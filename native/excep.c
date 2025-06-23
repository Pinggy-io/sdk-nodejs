#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <node_api.h>

#ifdef _WIN32
#include <windows.h>
static DWORD tlsIndexType = TLS_OUT_OF_INDEXES;
static DWORD tlsIndexMessage = TLS_OUT_OF_INDEXES;
#else
#include <pthread.h>
static pthread_key_t keyType;
static pthread_key_t keyMessage;
static pthread_once_t onceControl = PTHREAD_ONCE_INIT;

// moved out of init_tls so it's a proper top-level function
static void create_keys(void)
{
    pthread_key_create(&keyType, free);
    pthread_key_create(&keyMessage, free);
}
#endif

#include "../pinggy.h" // adjust path if needed

#define TLS_BUFFER_SIZE 512

// --- TLS Init/Cleanup ---
void init_tls()
{
#ifdef _WIN32
    if (tlsIndexType == TLS_OUT_OF_INDEXES)
        tlsIndexType = TlsAlloc();
    if (tlsIndexMessage == TLS_OUT_OF_INDEXES)
        tlsIndexMessage = TlsAlloc();
#else
    // single call to our top-level create_keys()
    pthread_once(&onceControl, create_keys);
#endif
}

void cleanup_tls()
{
#ifdef _WIN32
    if (tlsIndexType != TLS_OUT_OF_INDEXES)
    {
        TlsFree(tlsIndexType);
        tlsIndexType = TLS_OUT_OF_INDEXES;
    }
    if (tlsIndexMessage != TLS_OUT_OF_INDEXES)
    {
        TlsFree(tlsIndexMessage);
        tlsIndexMessage = TLS_OUT_OF_INDEXES;
    }
#else
    // not strictly needed on POSIX, but you could delete keys:
    pthread_key_delete(keyType);
    pthread_key_delete(keyMessage);
#endif
}

static char *get_tls_buffer(int isType)
{
    init_tls();
#ifdef _WIN32
    DWORD index = isType ? tlsIndexType : tlsIndexMessage;
    char *buf = (char *)TlsGetValue(index);
    if (!buf)
    {
        buf = calloc(1, TLS_BUFFER_SIZE);
        TlsSetValue(index, buf);
    }
    return buf;
#else
    pthread_key_t key = isType ? keyType : keyMessage;
    char *buf = pthread_getspecific(key);
    if (!buf)
    {
        buf = calloc(1, TLS_BUFFER_SIZE);
        pthread_setspecific(key, buf);
    }
    return buf;
#endif
}

void set_tls_exception(const char *type, const char *message)
{
    snprintf(get_tls_buffer(1), TLS_BUFFER_SIZE, "%s", type);
    snprintf(get_tls_buffer(0), TLS_BUFFER_SIZE, "%s", message);
}

char *get_tls_exception_type() { return get_tls_buffer(1); }
char *get_tls_exception_message() { return get_tls_buffer(0); }

void clear_tls_exception()
{
    get_tls_exception_type()[0] = '\0';
    get_tls_exception_message()[0] = '\0';
}

// --- Pinggy Exception Callback ---
void PinggyExceptionHandler(const char *etype, const char *ewhat)
{
    set_tls_exception(etype, ewhat);
    printf("Pinggy Exception: %s: %s\n", etype, ewhat);
}

// --- N-API: Get Last Exception ---
napi_value GetLastException(napi_env env, napi_callback_info info)
{
    napi_value result;
    char buffer[TLS_BUFFER_SIZE * 2];
    snprintf(buffer, sizeof(buffer), "%s: %s",
             get_tls_exception_type(),
             get_tls_exception_message());

    napi_create_string_utf8(env, buffer, NAPI_AUTO_LENGTH, &result);
    clear_tls_exception();
    return result;
}

// --- N-API: Init Exception Handling ---
napi_value InitExceptionHandling(napi_env env, napi_callback_info info)
{
    init_tls();
    pinggy_set_exception_callback(PinggyExceptionHandler);
    return NULL;
}

// --- N-API: Cleanup Hook ---
void Cleanup(void *arg)
{
    cleanup_tls();
}

// Module initialization
napi_value Init3(napi_env env, napi_value exports)
{
    napi_value fnInit, fnGetLast;

    napi_create_function(env, NULL, 0, InitExceptionHandling, NULL, &fnInit);
    napi_set_named_property(env, exports, "initExceptionHandling", fnInit);

    napi_create_function(env, NULL, 0, GetLastException, NULL, &fnGetLast);
    napi_set_named_property(env, exports, "getLastException", fnGetLast);

    napi_add_env_cleanup_hook(env, Cleanup, NULL);
    return exports;
}