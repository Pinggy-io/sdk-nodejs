#ifndef PINGGY_DEBUG_H
#define PINGGY_DEBUG_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef __cplusplus
extern "C"
{
#endif

    // Global debug flag
    extern int _pinggy_debug_enabled;

    // Function to initialize debug logging based on environment variable
    void pinggy_debug_init(void);

    // Function to set debug logging state (for JavaScript API)
    void pinggy_debug_set_enabled(int enabled);

    // Function to check if debug logging is enabled
    int pinggy_debug_is_enabled(void);

// Debug logging macro
#define PINGGY_DEBUG(...)                                              \
    do                                                                 \
    {                                                                  \
        if (pinggy_debug_is_enabled())                                 \
        {                                                              \
            printf("[DEBUG] %s:%d %s ", __FILE__, __LINE__, __func__); \
            printf(__VA_ARGS__);                                       \
            printf("\n");                                              \
            fflush(stdout);                                            \
        }                                                              \
    } while (0)

// Backward compatibility macro for existing printf statements
#define PINGGY_DEBUG_RET(ret) PINGGY_DEBUG("ret = %p", (void *)ret)
#define PINGGY_DEBUG_INT(val)  PINGGY_DEBUG("val = %llu", (unsigned long long)(val))
#define PINGGY_DEBUG_VOID() PINGGY_DEBUG("ret = void")

// N-API module initialization function
#include <node_api.h>
    napi_value InitDebug(napi_env env, napi_value exports);

#ifdef __cplusplus
}
#endif

#endif // PINGGY_DEBUG_H
