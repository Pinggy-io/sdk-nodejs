#include <node_api.h>
#include "debug.h"

napi_value Init1(napi_env env, napi_value exports);
napi_value Init2(napi_env env, napi_value exports);
napi_value Init3(napi_env env, napi_value exports);

napi_value Init(napi_env env, napi_value exports)
{
    Init1(env, exports);
    Init2(env, exports);
    Init3(env, exports);
    InitDebug(env, exports);

    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
// This macro registers the module with Node.js.
// - NODE_GYP_MODULE_NAME: A macro that expands to the name of the module.
// - Init: The initialization function for the module.
