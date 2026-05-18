#include <node_api.h>
#include <stdlib.h>
#include <stdio.h>
#include "../pinggy.h"
#include "helper_macro.h"

// Per-thread JS callback ref. Each Node Worker thread (= one tunnel in the
// daemon model) has its own slot, matching libpinggy's thread_local callback
// storage. Lines emitted on this thread are routed to this worker's JS
// callback only.
typedef struct {
    napi_env env;
    napi_ref callback_ref;
} LogCallbackData;

static _Thread_local LogCallbackData *tl_log_cb_data = NULL;

static void clear_tl_callback(void) {
    if (!tl_log_cb_data) return;
    pinggy_set_log_callback(NULL, NULL);
    napi_delete_reference(tl_log_cb_data->env, tl_log_cb_data->callback_ref);
    free(tl_log_cb_data);
    tl_log_cb_data = NULL;
}

// Invoked by libpinggy synchronously on this worker thread.
static void native_log_callback(pinggy_void_p_t user_data, pinggy_int_t level, pinggy_const_char_p_t message) {
    LogCallbackData *data = (LogCallbackData *)user_data;
    if (!data) return;

    napi_env env = data->env;
    napi_value js_cb, undefined, js_level, js_msg, result;
    napi_status status;

    status = napi_get_reference_value(env, data->callback_ref, &js_cb);
    if (status != napi_ok || !js_cb) return;

    napi_get_undefined(env, &undefined);
    napi_create_int32(env, (int32_t)level, &js_level);
    napi_create_string_utf8(env, message ? message : "", NAPI_AUTO_LENGTH, &js_msg);

    napi_value args[2] = { js_level, js_msg };
    napi_call_function(env, undefined, js_cb, 2, args, &result);
}

// JS binding: setLogCallback(tunnelRef, cb). tunnelRef is accepted for API
// symmetry with other tunnel-scoped setters but ignored here — libpinggy's
// callback slot is thread-local, and each worker thread runs exactly one
// tunnel, so attribution is implicit.
napi_value SetLogCallback(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 2;
    napi_value args[2];

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    napi_value cb_value = (argc >= 2) ? args[1] : (argc >= 1 ? args[0] : NULL);

    napi_valuetype vt = napi_undefined;
    if (cb_value) {
        napi_typeof(env, cb_value, &vt);
    }

    if (vt != napi_function) {
        clear_tl_callback();
        napi_value undef;
        napi_get_undefined(env, &undef);
        return undef;
    }

    clear_tl_callback();

    LogCallbackData *data = (LogCallbackData *)malloc(sizeof(LogCallbackData));
    NAPI_CHECK_CONDITION_THROW(env, data != NULL, "Failed to allocate log callback data");

    data->env = env;
    status = napi_create_reference(env, cb_value, 1, &data->callback_ref);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to create callback reference", free(data));

    tl_log_cb_data = data;
    pinggy_set_log_callback(native_log_callback, (pinggy_void_p_t)data);

    napi_value undef;
    napi_get_undefined(env, &undef);
    return undef;
}

napi_value InitLogCallback(napi_env env, napi_value exports) {
    napi_status status;
    napi_value fn;

    status = napi_create_function(env, NULL, 0, SetLogCallback, NULL, &fn);
    if (status != napi_ok) return NULL;

    status = napi_set_named_property(env, exports, "setLogCallback", fn);
    if (status != napi_ok) return NULL;

    return exports;
}
