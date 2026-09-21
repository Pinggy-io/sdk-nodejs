#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <node_api.h>
#include "debug.h"

#ifdef _WIN32
#include <windows.h>
#else
#include <pthread.h>
#endif

#include "../pinggy.h" // adjust path if needed

#define TLS_BUFFER_SIZE 512

/*
 * Global (cross-thread) exception storage.
 *
 * Use a single, globally-shared buffer protected by a mutex so that any
 * thread writing an exception is visible from any thread reading it.
 *
 * Lifetime matters here. addon.node is mapped into the process once and is
 * shared by every worker_threads environment that requires it (one per
 * tunnel), and libpinggy calls PinggyExceptionHandler from its own threads.
 * The lock is therefore process-wide: it is created exactly once, lazily and
 * thread-safely, and it is intentionally never destroyed.
 *
 * It used to be deleted from a per-environment N-API cleanup hook. When one
 * tunnel's worker shut down, DeleteCriticalSection() zeroed the structure
 * while other workers and libpinggy threads were still entering it; the next
 * contended EnterCriticalSection() dereferenced the NULL DebugInfo pointer
 * (access violation writing address 0x24 in ntdll) and took the whole host
 * process down. A lock that lives until process exit costs nothing.
 */
static char g_exception_type[TLS_BUFFER_SIZE] = {0};
static char g_exception_message[TLS_BUFFER_SIZE] = {0};

#ifdef _WIN32
static INIT_ONCE g_exception_lock_once = INIT_ONCE_STATIC_INIT;
static CRITICAL_SECTION g_exception_lock;

static BOOL CALLBACK init_exception_lock(PINIT_ONCE init_once, PVOID parameter,
                                         PVOID *context) {
  (void)init_once;
  (void)parameter;
  (void)context;
  InitializeCriticalSection(&g_exception_lock);
  return TRUE;
}

/* Thread-safe and idempotent: every worker may call this concurrently. */
static void ensure_exception_lock(void) {
  InitOnceExecuteOnce(&g_exception_lock_once, init_exception_lock, NULL, NULL);
}

static void lock_exception_state(void) {
  ensure_exception_lock();
  EnterCriticalSection(&g_exception_lock);
}

static void unlock_exception_state(void) {
  LeaveCriticalSection(&g_exception_lock);
}
#else
static pthread_mutex_t g_exception_lock = PTHREAD_MUTEX_INITIALIZER;

static void ensure_exception_lock(void) {
  /* pthread_mutex_t is statically initialized; nothing to do. */
}

static void lock_exception_state(void) {
  pthread_mutex_lock(&g_exception_lock);
}

static void unlock_exception_state(void) {
  pthread_mutex_unlock(&g_exception_lock);
}
#endif

// --- Global Lock Init ---
void init_tls() { ensure_exception_lock(); }

void set_tls_exception(const char *type, const char *message) {
  lock_exception_state();
  snprintf(g_exception_type, TLS_BUFFER_SIZE, "%s", type ? type : "");
  snprintf(g_exception_message, TLS_BUFFER_SIZE, "%s", message ? message : "");
  unlock_exception_state();
}

char *get_tls_exception_type() { return g_exception_type; }
char *get_tls_exception_message() { return g_exception_message; }

void clear_tls_exception() {
  lock_exception_state();
  g_exception_type[0] = '\0';
  g_exception_message[0] = '\0';
  unlock_exception_state();
}

// --- Pinggy Exception Callback ---
void PinggyExceptionHandler(const char *etype, const char *ewhat) {
  set_tls_exception(etype, ewhat);
  printf("Pinggy Exception: %s: %s\n", etype, ewhat);
}

// --- N-API: Get Last Exception ---
napi_value GetLastException(napi_env env, napi_callback_info info) {
  napi_value result;
  char buffer[TLS_BUFFER_SIZE * 2];

  /* Lock while we read so we don't race with PinggyExceptionHandler. */
  lock_exception_state();

  int has_exception = (g_exception_type[0] != '\0');
  if (has_exception) {
    snprintf(buffer, sizeof(buffer), "%s  %s", g_exception_type,
             g_exception_message);
    g_exception_type[0] = '\0';
    g_exception_message[0] = '\0';
  }

  unlock_exception_state();

  if (!has_exception) {
    napi_get_null(env, &result);
    return result;
  }

  napi_create_string_utf8(env, buffer, NAPI_AUTO_LENGTH, &result);
  return result;
}

// --- N-API: Init Exception Handling ---
napi_value InitExceptionHandling(napi_env env, napi_callback_info info) {
  init_tls();
  pinggy_set_on_exception_callback(PinggyExceptionHandler);
  return NULL;
}

// Module initialization
napi_value Init3(napi_env env, napi_value exports) {
  napi_value fnInit, fnGetLast;

  napi_create_function(env, NULL, 0, InitExceptionHandling, NULL, &fnInit);
  napi_set_named_property(env, exports, "initExceptionHandling", fnInit);

  napi_create_function(env, NULL, 0, GetLastException, NULL, &fnGetLast);
  napi_set_named_property(env, exports, "getLastException", fnGetLast);

  /*
   * Deliberately no napi_add_env_cleanup_hook here. The exception state and
   * its lock are process-wide and outlive any single worker environment.
   */
  return exports;
}
