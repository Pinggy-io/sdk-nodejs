#include <node_api.h>
#include "../pinggy.h" // Include the header file for the Pinggy library

// Wrapper function for pinggy_create_config
napi_value CreateConfig(napi_env env, napi_callback_info info) {
    napi_status status;

    // Call the Pinggy function to create a new config
    pinggy_ref_t config = pinggy_create_config();

    // Wrap the config reference in a JavaScript external value
    napi_value js_config;
    status = napi_create_external(env, config, NULL, NULL, &js_config);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Failed to create external value");
        return NULL;
    }

    return js_config;
}

// Initialize the addon
napi_value Init(napi_env env, napi_value exports) {
    napi_status status;
    napi_value fn;

    // Export the CreateConfig function
    status = napi_create_function(env, NULL, 0, CreateConfig, NULL, &fn);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Failed to create function");
        return NULL;
    }

    status = napi_set_named_property(env, exports, "createConfig", fn);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Failed to export function");
        return NULL;
    }

    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)