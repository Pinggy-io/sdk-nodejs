#include "debug.h"
#include <node_api.h>

// Global debug flag - initialized to -1 to indicate uninitialized state
int _pinggy_debug_enabled = -1;

// Function to initialize debug logging based on environment variable
void pinggy_debug_init(void)
{
    if (_pinggy_debug_enabled != -1)
    {
        // Already initialized
        return;
    }

    const char *debug_env = getenv("PINGGY_DEBUG");
    if (debug_env != NULL)
    {
        // Check for various true values
        if (strcmp(debug_env, "1") == 0 ||
            strcmp(debug_env, "true") == 0 ||
            strcmp(debug_env, "TRUE") == 0 ||
            strcmp(debug_env, "yes") == 0 ||
            strcmp(debug_env, "YES") == 0)
        {
            _pinggy_debug_enabled = 1;
        }
        else
        {
            _pinggy_debug_enabled = 0;
        }
    }
    else
    {
        // Default to disabled if environment variable is not set
        _pinggy_debug_enabled = 0;
    }
}

// Function to set debug logging state (for JavaScript API)
void pinggy_debug_set_enabled(int enabled)
{
    _pinggy_debug_enabled = enabled ? 1 : 0;
}

// Function to check if debug logging is enabled
int pinggy_debug_is_enabled(void)
{
    // Auto-initialize if not done yet
    if (_pinggy_debug_enabled == -1)
    {
        pinggy_debug_init();
    }
    return _pinggy_debug_enabled;
}

// N-API binding to enable/disable debug logging from JavaScript
napi_value SetDebugLogging(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse the arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 1)
    {
        napi_throw_error(env, NULL, "Expected one boolean argument");
        return NULL;
    }

    // Convert the argument to boolean
    bool enabled;
    status = napi_get_value_bool(env, args[0], &enabled);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Argument must be a boolean");
        return NULL;
    }

    // Set debug logging state
    pinggy_debug_set_enabled(enabled ? 1 : 0);

    // Return undefined
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Initialize the debug module and export the functions
napi_value InitDebug(napi_env env, napi_value exports)
{
    napi_status status;
    napi_value fn;

    // Export setDebugLogging function
    status = napi_create_function(env, NULL, 0, SetDebugLogging, NULL, &fn);
    if (status != napi_ok)
        return NULL;

    status = napi_set_named_property(env, exports, "setDebugLogging", fn);
    if (status != napi_ok)
        return NULL;

    return exports;
}
