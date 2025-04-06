#include <node_api.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include "../pinggy.h"

// Thread-local storage for last exception
static __declspec(thread) char last_exception[512] = {0};

// Exception handler function
void PinggyExceptionHandler(const char *etype, const char *ewhat)
{
    snprintf(last_exception, sizeof(last_exception), "%s: %s", etype, ewhat);
    printf("Exception Caught: %s\n", last_exception); // Debug print
}

// N-API function to get the last exception
napi_value GetLastException(napi_env env, napi_callback_info info)
{
    napi_value result;

    // Copy the thread-local `last_exception` to a local C string buffer
    char exception_copy[512];
    strncpy(exception_copy, last_exception, sizeof(exception_copy));
    exception_copy[sizeof(exception_copy) - 1] = '\0'; // Ensure null termination

    // Convert the C string to a UTF-8 N-API string
    napi_create_string_utf8(env, exception_copy, NAPI_AUTO_LENGTH, &result);

    // Debug print
    printf("GetLastException (Copied): %s\n", exception_copy);

    // Clear the stored exception after retrieval
    last_exception[0] = '\0';

    return result;
}

// N-API function to initialize exception handling
napi_value InitExceptionHandling(napi_env env, napi_callback_info info)
{
    pinggy_set_exception_callback(PinggyExceptionHandler);
    return NULL;
}

// Module initialization
napi_value Init3(napi_env env, napi_value exports)
{
    napi_value init_exception_handling_fn, get_last_exception_fn;

    napi_create_function(env, NULL, 0, InitExceptionHandling, NULL, &init_exception_handling_fn);
    napi_set_named_property(env, exports, "initExceptionHandling", init_exception_handling_fn);

    napi_create_function(env, NULL, 0, GetLastException, NULL, &get_last_exception_fn);
    napi_set_named_property(env, exports, "getLastException", get_last_exception_fn);

    return exports;
}