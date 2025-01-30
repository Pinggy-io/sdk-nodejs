#include <node_api.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include "../pinggy.h"

// Wrapper for pinggy_tunnel_request_remote_forwarding
napi_value TunnelRequestRemoteForwarding(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_value result;
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    if (status != napi_ok)
    {
        napi_create_string_utf8(env, "Failed to parse arguments", NAPI_AUTO_LENGTH, &result);
        return result;
    }

    // Validate the number of arguments
    if (argc < 1)
    {
        napi_create_string_utf8(env, "Expected one argument (tunnel)", NAPI_AUTO_LENGTH, &result);
        return result;
    }

    // Get the first argument: tunnel (uint32_t)
    uint32_t tunnel;
    status = napi_get_value_uint32(env, args[0], &tunnel);
    if (status != napi_ok)
    {
        napi_create_string_utf8(env, "Invalid tunnel reference", NAPI_AUTO_LENGTH, &result);
        return result;
    }

    // Call the pinggy_tunnel_request_remote_forwarding function
    pinggy_tunnel_request_remote_forwarding(tunnel);

    // Return undefined (void return type in C)
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_tunnel_initiate
napi_value tunnelInitiate(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_value result;

    // Parse arguments
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    // Validate the number of arguments
    if (argc < 1)
    {
        napi_throw_type_error(env, NULL, "Expected one argument (config)");
        return NULL;
    }

    // Get the first argument: config (pinggy_ref_t)
    uint32_t config;
    napi_get_value_uint32(env, args[0], &config);

    // Call the pinggy_tunnel_initiate function
    uint32_t tunnel = pinggy_tunnel_initiate(config);

    // Return the newly created tunnel reference (pinggy_ref_t)
    napi_create_uint32(env, tunnel, &result);
    return result;
}

// Wrapper for pinggy_tunnel_start
napi_value tunnelStart(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_value result;
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_create_string_utf8(env, "Failed to parse arguments", NAPI_AUTO_LENGTH, &result);
        return result;
    }

    // Validate the number of arguments
    if (argc < 1)
    {
        napi_create_string_utf8(env, "Expected one argument (tunnel)", NAPI_AUTO_LENGTH, &result);
        return result;
    }

    // Get the first argument: tunnel (pinggy_ref_t)
    uint32_t tunnel;
    status = napi_get_value_uint32(env, args[0], &tunnel);
    if (status != napi_ok)
    {
        napi_create_string_utf8(env, "Invalid tunnel reference", NAPI_AUTO_LENGTH, &result);
        return result;
    }

    // Call the pinggy_tunnel_start function
    pinggy_bool_t success = pinggy_tunnel_start(tunnel);
    if (!success)
    {
        napi_create_string_utf8(env, "Failed to start tunnel", NAPI_AUTO_LENGTH, &result);
        return result;
    }

    // Return the boolean value (success) as a JavaScript boolean
    napi_get_boolean(env, success, &result);
    return result;
}

// Wrapper for pinggy_tunnel_resume
napi_value TunnelResume(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse the arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 1) {
        napi_throw_error(env, NULL, "Expected one argument (tunnel ref)");
        return NULL;
    }

    // Convert the first argument to uint32_t (tunnel ref)
    uint32_t tunnel_ref;
    status = napi_get_value_uint32(env, args[0], &tunnel_ref);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Expected argument to be an unsigned integer (tunnel ref)");
        return NULL;
    }

    // Call the pinggy_tunnel_resume function
    pinggy_int_t ret = pinggy_tunnel_resume((pinggy_ref_t)tunnel_ref);

    // Check for errors
    if (ret < 0) {
        char error_message[256];
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Return the result as a JavaScript number
    napi_value result;
    status = napi_create_int32(env, ret, &result);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Failed to create JavaScript number");
        return NULL;
    }

    return result;
}

// PINGGY_EXPORT pinggy_void_t
// pinggy_config_set_tcp_forward_to(pinggy_ref_t config, pinggy_char_p_t tcp_forward_to);

// Wrapper for pinggy_config_set_tcp_forward_to
napi_value TCPForwardTo(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse the arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 2) {
        napi_throw_error(env, NULL, "Expected two arguments (config, tcp_forward_to)");
        return NULL;
    }

    // Convert the first argument to uint32_t (config)
    uint32_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Expected argument 1 to be an unsigned integer (config)");
        return NULL;
    }

    // Convert the second argument to a string (tcp_forward_to)
    size_t str_len;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &str_len);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Failed to get the length of the string");
        return NULL;
    }

    char *tcp_forward_to = (char *)malloc(str_len + 1);
    status = napi_get_value_string_utf8(env, args[1], tcp_forward_to, str_len + 1, NULL);
    if (status != napi_ok) {
        free(tcp_forward_to);
        napi_throw_error(env, NULL, "Failed to get the string value");
        return NULL;
    }

    // Call the pinggy_config_set_tcp_forward_to function
    pinggy_config_set_tcp_forward_to((pinggy_ref_t)config, tcp_forward_to);

    // Free the allocated memory
    free(tcp_forward_to);

    // Return undefined (void return type in C)
    napi_value result;

    status = napi_get_undefined(env, &result);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Failed to create JavaScript undefined");
        return NULL;
    }

    return result;
}

// Wrapper for pinggy_tunnel_stop
napi_value TunnelStop(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse the arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 1) {
        napi_throw_error(env, NULL, "Expected one argument (tunnel ref)");
        return NULL;
    }

    // Convert the first argument to uint32_t (tunnel ref)
    uint32_t tunnel_ref;
    status = napi_get_value_uint32(env, args[0], &tunnel_ref);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Expected argument to be an unsigned integer (tunnel ref)");
        return NULL;
    }

    // Call the pinggy_tunnel_stop function
    pinggy_bool_t result = pinggy_tunnel_stop((pinggy_ref_t)tunnel_ref);

    // Convert the result (pinggy_bool_t) to a JavaScript boolean
    napi_value js_result;
    status = napi_get_boolean(env, result, &js_result);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Failed to create JavaScript boolean");
        return NULL;
    }

    return js_result;
}

// PINGGY_EXPORT pinggy_bool_t
// pinggy_tunnel_set_reverse_forwrding_done_callback(pinggy_ref_t tunnel, pinggy_reverse_forwrding_done_cb_t reverse_forwrding_done, pinggy_void_p_t user_data);
// napi_value TunnelSetReverseForwardingDoneCallback(napi_env env, napi_callback_info info) {
//     size_t argc = 3;
//     napi_value args[3];
//     napi_status status;

//     // Parse the arguments
//     status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
//     if (status != napi_ok || argc < 3) {
//         napi_throw_error(env, NULL, "Expected three arguments (tunnel ref, callback, user_data)");
//         return NULL;
//     }

//     // Convert the first argument to uint32_t (tunnel ref)
//     uint32_t tunnel_ref;
//     status = napi_get_value_uint32(env, args[0], &tunnel_ref);
//     if (status != napi_ok) {
//         napi_throw_error(env, NULL, "Expected argument 1 to be an unsigned integer (tunnel ref)");
//         return NULL;
//     }

//     // Convert the second argument to a function (callback)
//     napi_value callback = args[1];
//     napi_value user_data = args[2];

//     // Call the pinggy_tunnel_set_reverse_forwrding_done_callback function
//     pinggy_bool_t result = pinggy_tunnel_set_reverse_forwrding_done_callback((pinggy_ref_t)tunnel_ref, NULL, NULL);

//     // Convert the result (pinggy_bool_t) to a JavaScript boolean
//     napi_value js_result;
//     status = napi_get_boolean(env, result, &js_result);
//     if (status != napi_ok) {
//         napi_throw_error(env, NULL, "Failed to create JavaScript boolean");
//         return NULL;
//     }

//     return js_result;
// }

// Global reference to the callback function
typedef struct {
    napi_ref callback_ref;
    napi_env env;
} CallbackData;

void reverse_forwarding_done_callback(const char *address, void *user_data) {
    if (user_data == NULL) {
        printf("[ERROR] Callback data is NULL!\n");
        return;
    }

    CallbackData *cb_data = (CallbackData *)user_data;
    napi_env env = cb_data->env;

    napi_value js_callback, js_address, global, undefined;
    napi_get_reference_value(env, cb_data->callback_ref, &js_callback);
    napi_get_undefined(env, &undefined);
    napi_create_string_utf8(env, address, NAPI_AUTO_LENGTH, &js_address);

    napi_call_function(env, undefined, js_callback, 1, &js_address, NULL);
}

napi_value SetReverseForwardingCallback(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 2;
    napi_value args[2];
    napi_value js_tunnel;
    napi_value js_callback;

    // Extract arguments (tunnel reference & callback function)
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 2) return NULL;

    js_tunnel = args[0];  // Tunnel reference (integer or object)
    js_callback = args[1]; // JavaScript callback function

    // Convert tunnel reference to C type
    pinggy_ref_t tunnel;
    napi_get_value_int64(env, js_tunnel, (int64_t *)&tunnel);

    // Store callback in a reference
    CallbackData *cb_data = (CallbackData *)malloc(sizeof(CallbackData));
    cb_data->env = env;
    napi_create_reference(env, js_callback, 1, &cb_data->callback_ref);

    // Register callback with Pinggy
    pinggy_tunnel_set_reverse_forwrding_done_callback(tunnel, reverse_forwarding_done_callback, cb_data);

    return NULL;
}

// Wrapper for pinggy_tunnel_connect
napi_value TunnelConnect(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse the arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 1) {
        napi_throw_error(env, NULL, "Expected one argument (tunnel ref)");
        return NULL;
    }

    // Convert the first argument to uint32_t (tunnel ref)
    uint32_t tunnel_ref;
    status = napi_get_value_uint32(env, args[0], &tunnel_ref);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Expected argument to be an unsigned integer (tunnel ref)");
        return NULL;
    }

    // Call the pinggy_tunnel_connect function
    pinggy_bool_t result = pinggy_tunnel_connect((pinggy_ref_t)tunnel_ref);

    // Convert the result (pinggy_bool_t) to a JavaScript boolean
    napi_value js_result;
    status = napi_get_boolean(env, result, &js_result);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Failed to create JavaScript boolean");
        return NULL;
    }

    return js_result;
}

// Initialize the module and export the function
napi_value Init2(napi_env env, napi_value exports)
{
    napi_value request_remote_forwarding_fn, tunnel_initiate_fn, tunnel_start_fn, tunnel_resume_fn, tunnel_stop_fn, tcp_forward_to_fn, tunnel_set_reverse_forwarding_done_callback_fn, tunnel_connect_fn;

    napi_create_function(env, NULL, 0, TunnelRequestRemoteForwarding, NULL, &request_remote_forwarding_fn);
    napi_set_named_property(env, exports, "tunnelRequestRemoteForwarding", request_remote_forwarding_fn);

    napi_create_function(env, NULL, 0, tunnelInitiate, NULL, &tunnel_initiate_fn);
    napi_set_named_property(env, exports, "tunnelInitiate", tunnel_initiate_fn);

    napi_create_function(env, NULL, 0, tunnelStart, NULL, &tunnel_start_fn);
    napi_set_named_property(env, exports, "tunnelStart", tunnel_start_fn);

    napi_create_function(env, NULL, 0, TunnelResume, NULL, &tunnel_resume_fn);
    napi_set_named_property(env, exports, "tunnelResume", tunnel_resume_fn);

    napi_create_function(env, NULL, 0, TunnelStop, NULL, &tunnel_stop_fn);
    napi_set_named_property(env, exports, "tunnelStop", tunnel_stop_fn);

    napi_create_function(env, NULL, 0, TCPForwardTo, NULL, &tcp_forward_to_fn);
    napi_set_named_property(env, exports, "tcpForwardTo", tcp_forward_to_fn);

    napi_create_function(env, NULL, 0, SetReverseForwardingCallback, NULL, &tunnel_set_reverse_forwarding_done_callback_fn);
    napi_set_named_property(env, exports, "tunnelSetReverseForwardingDoneCallback", tunnel_set_reverse_forwarding_done_callback_fn);

    napi_create_function(env, NULL, 0, TunnelConnect, NULL, &tunnel_connect_fn);
    napi_set_named_property(env, exports, "tunnelConnect", tunnel_connect_fn);

    return exports;
}