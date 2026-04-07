#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <node_api.h>
#include "debug.h"

#ifdef _WIN32
#include <windows.h>
static CRITICAL_SECTION g_exception_lock;
static BOOL g_lock_initialized = FALSE;
#else
#include <pthread.h>
static pthread_mutex_t g_exception_lock = PTHREAD_MUTEX_INITIALIZER;
#endif

#include "../pinggy.h" // adjust path if needed

#define TLS_BUFFER_SIZE 512

/*
 * Global (cross-thread) exception storage.
 *
 * Use a single, globally-shared buffer protected by a mutex so that any
 * thread writing an exception is visible from any thread reading it.
 */
static char g_exception_type[TLS_BUFFER_SIZE] = {0};
static char g_exception_message[TLS_BUFFER_SIZE] = {0};

// --- Global Lock Init/Cleanup ---
void init_tls() {
#ifdef _WIN32
  if (!g_lock_initialized) {
    InitializeCriticalSection(&g_exception_lock);
    g_lock_initialized = TRUE;
  }
#else
  /* pthread_mutex_t is statically initialized; nothing to do. */
#endif
}

void cleanup_tls() {
#ifdef _WIN32
  if (g_lock_initialized) {
    DeleteCriticalSection(&g_exception_lock);
    g_lock_initialized = FALSE;
  }
#else
  /* Static mutex — no explicit destroy needed for our use-case. */
#endif
}

void set_tls_exception(const char *type, const char *message) {
#ifdef _WIN32
  EnterCriticalSection(&g_exception_lock);
#else
  pthread_mutex_lock(&g_exception_lock);
#endif
  snprintf(g_exception_type, TLS_BUFFER_SIZE, "%s", type ? type : "");
  snprintf(g_exception_message, TLS_BUFFER_SIZE, "%s", message ? message : "");
#ifdef _WIN32
  LeaveCriticalSection(&g_exception_lock);
#else
  pthread_mutex_unlock(&g_exception_lock);
#endif
}

char *get_tls_exception_type() { return g_exception_type; }
char *get_tls_exception_message() { return g_exception_message; }

void clear_tls_exception() {
#ifdef _WIN32
  EnterCriticalSection(&g_exception_lock);
#else
  pthread_mutex_lock(&g_exception_lock);
#endif
  g_exception_type[0] = '\0';
  g_exception_message[0] = '\0';
#ifdef _WIN32
  LeaveCriticalSection(&g_exception_lock);
#else
  pthread_mutex_unlock(&g_exception_lock);
#endif
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
#ifdef _WIN32
  EnterCriticalSection(&g_exception_lock);
#else
  pthread_mutex_lock(&g_exception_lock);
#endif

  int has_exception = (g_exception_type[0] != '\0');
  if (has_exception) {
    snprintf(buffer, sizeof(buffer), "%s  %s", g_exception_type,
             g_exception_message);
    g_exception_type[0] = '\0';
    g_exception_message[0] = '\0';
  }

#ifdef _WIN32
  LeaveCriticalSection(&g_exception_lock);
#else
  pthread_mutex_unlock(&g_exception_lock);
#endif

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

// --- N-API: Cleanup Hook ---
void Cleanup(void *arg) { cleanup_tls(); }

// Module initialization
napi_value Init3(napi_env env, napi_value exports) {
  napi_value fnInit, fnGetLast;

  napi_create_function(env, NULL, 0, InitExceptionHandling, NULL, &fnInit);
  napi_set_named_property(env, exports, "initExceptionHandling", fnInit);

  napi_create_function(env, NULL, 0, GetLastException, NULL, &fnGetLast);
  napi_set_named_property(env, exports, "getLastException", fnGetLast);

  napi_add_env_cleanup_hook(env, Cleanup, NULL);
  return exports;
}