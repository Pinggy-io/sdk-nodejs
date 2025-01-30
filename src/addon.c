#include <node_api.h>

// Function declarations from addon1.c and addon2.c
napi_value Init1(napi_env env, napi_value exports);
napi_value Init2(napi_env env, napi_value exports);

napi_value Init(napi_env env, napi_value exports) {
    // Initialize functions from both addon1.c and addon2.c
    Init1(env, exports);
    Init2(env, exports);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
// This macro registers the module with Node.js.
// - NODE_GYP_MODULE_NAME: A macro that expands to the name of the module.
// - Init: The initialization function for the module.
