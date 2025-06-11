#include <node_api.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include "../pinggy.h"

// Wrapper for pinggy_tunnel_initiate
napi_value TunnelInitiate(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_value result;

    // Parse arguments
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    // Validate the number of arguments
    if (argc < 1)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected one argument (config)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Get the first argument: config (pinggy_ref_t)
    uint32_t config;
    napi_get_value_uint32(env, args[0], &config);

    // Call the pinggy_tunnel_initiate function
    uint32_t tunnel = pinggy_tunnel_initiate(config);
    printf("[DEBUG] %s:%d %s ret = %d\n", __FILE__, __LINE__, __func__, tunnel);

    // Return the newly created tunnel reference (pinggy_ref_t)
    napi_create_uint32(env, tunnel, &result);
    return result;
}

// Wrapper for pinggy_tunnel_start
napi_value TunnelStart(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_value result;
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to parse arguments", __FILE__, __LINE__);
        napi_create_string_utf8(env, error_message, NAPI_AUTO_LENGTH, &result);
        return result;
    }

    // Validate the number of arguments
    if (argc < 1)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected one argument (tunnel)", __FILE__, __LINE__);
        napi_create_string_utf8(env, error_message, NAPI_AUTO_LENGTH, &result);
        return result;
    }

    // Get the first argument: tunnel (pinggy_ref_t)
    uint32_t tunnel;
    status = napi_get_value_uint32(env, args[0], &tunnel);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Invalid tunnel reference", __FILE__, __LINE__);
        napi_create_string_utf8(env, error_message, NAPI_AUTO_LENGTH, &result);
        return result;
    }

    // Call the pinggy_tunnel_start function
    pinggy_bool_t success = pinggy_tunnel_start(tunnel);
    printf("[DEBUG] %s:%d %s ret = %d\n", __FILE__, __LINE__, __func__, success);
    if (!success)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to start tunnel", __FILE__, __LINE__);
        napi_create_string_utf8(env, error_message, NAPI_AUTO_LENGTH, &result);
        return result;
    }

    // Return the boolean value (success) as a JavaScript boolean
    napi_get_boolean(env, success, &result);
    return result;
}

// Wrapper for pinggy_tunnel_connect
napi_value TunnelConnect(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse the arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 1)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected one argument (tunnel ref)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Convert the first argument to uint32_t (tunnel ref)
    uint32_t tunnel_ref;
    status = napi_get_value_uint32(env, args[0], &tunnel_ref);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected argument to be an unsigned integer (tunnel ref)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Call the pinggy_tunnel_connect function
    pinggy_bool_t result = pinggy_tunnel_connect((pinggy_ref_t)tunnel_ref);
    printf("[DEBUG] %s:%d %s ret = %d\n", __FILE__, __LINE__, __func__, result);

    // Convert the result (pinggy_bool_t) to a JavaScript boolean
    napi_value js_result;
    status = napi_get_boolean(env, result, &js_result);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create JavaScript boolean", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    return js_result;
}

// Wrapper for pinggy_tunnel_resume
napi_value TunnelResume(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse the arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 1)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected one argument (tunnel ref)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Convert the first argument to uint32_t (tunnel ref)
    uint32_t tunnel_ref;
    status = napi_get_value_uint32(env, args[0], &tunnel_ref);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected argument to be an unsigned integer (tunnel ref)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Call the pinggy_tunnel_resume function
    pinggy_int_t ret = pinggy_tunnel_resume((pinggy_ref_t)tunnel_ref);
    printf("[DEBUG] %s:%d %s ret = %d\n", __FILE__, __LINE__, __func__, ret);

    // Check for errors
    if (ret < 0)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Error in pinggy_tunnel_resume: %d", __FILE__, __LINE__, ret);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Return the result as a JavaScript number
    napi_value result;
    status = napi_create_int32(env, ret, &result);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create JavaScript number", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    return result;
}

// Wrapper for pinggy_tunnel_stop
napi_value TunnelStop(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse the arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 1)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected one argument (tunnel ref)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Convert the first argument to uint32_t (tunnel ref)
    uint32_t tunnel_ref;
    status = napi_get_value_uint32(env, args[0], &tunnel_ref);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected argument to be an unsigned integer (tunnel ref)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Call the pinggy_tunnel_stop function
    pinggy_bool_t result = pinggy_tunnel_stop((pinggy_ref_t)tunnel_ref);
    printf("[DEBUG] %s:%d %s ret = %d\n", __FILE__, __LINE__, __func__, result);

    // Convert the result (pinggy_bool_t) to a JavaScript boolean
    napi_value js_result;
    status = napi_get_boolean(env, result, &js_result);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create JavaScript boolean", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    return js_result;
}

// Wrapper for pinggy_tunnel_start_web_debugging
napi_value TunnelStartWebDebugging(napi_env env, napi_callback_info info)
{
    napi_status status;
    size_t argc = 2;
    napi_value args[2];

    // Get function arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 2)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected 2 arguments: tunnelRef and listeningPort", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Extract tunnel reference (assumed to be an integer)
    pinggy_ref_t tunnel;
    status = napi_get_value_int64(env, args[0], (int64_t *)&tunnel);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Invalid tunnel reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Extract listening port (assumed to be a uint16_t)
    uint32_t port;
    status = napi_get_value_uint32(env, args[1], &port);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Invalid port number", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Call the actual Pinggy function
    pinggy_uint16_t result = pinggy_tunnel_start_web_debugging(tunnel, (pinggy_uint16_t)port);
    printf("[DEBUG] %s:%d %s ret = %d\n", __FILE__, __LINE__, __func__, result);

    // Return the result as a JavaScript number
    napi_value jsResult;
    status = napi_create_uint32(env, result, &jsResult);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create return value", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    return jsResult;
}

// Wrapper for pinggy_tunnel_request_primary_forwarding
napi_value TunnelRequestPrimaryForwarding(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_value result;
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to parse arguments", __FILE__, __LINE__);
        napi_create_string_utf8(env, error_message, NAPI_AUTO_LENGTH, &result);
        return result;
    }

    // Validate the number of arguments
    if (argc < 1)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected one argument (tunnel)", __FILE__, __LINE__);
        napi_create_string_utf8(env, error_message, NAPI_AUTO_LENGTH, &result);
        return result;
    }

    // Get the first argument: tunnel (uint32_t)
    uint32_t tunnel;
    status = napi_get_value_uint32(env, args[0], &tunnel);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Invalid tunnel reference", __FILE__, __LINE__);
        napi_create_string_utf8(env, error_message, NAPI_AUTO_LENGTH, &result);
        return result;
    }

    // Call the pinggy_tunnel_request_primary_forwarding function
    pinggy_tunnel_request_primary_forwarding(tunnel);
    printf("[DEBUG] %s:%d %s ret = %d\n", __FILE__, __LINE__, __func__, tunnel);

    // Return undefined (void return type in C)
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_tunnel_request_additional_forwarding
// ================================= CALLBACKS =================================
napi_value TunnelRequestAdditionalForwarding(napi_env env, napi_callback_info info)
{
    size_t argc = 3;
    napi_value args[3];
    napi_status status;

    // Parse the arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 3)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected three arguments: (tunnelRef, remoteBindingAddr, forwardTo)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Convert first argument to uint32_t (tunnelRef)
    uint32_t tunnelRef;
    status = napi_get_value_uint32(env, args[0], &tunnelRef);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected first argument to be an unsigned integer (tunnelRef)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Convert second argument to a C string (remoteBindingAddr)
    size_t remoteBindingAddrLen;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &remoteBindingAddrLen);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected second argument to be a string (remoteBindingAddr)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }
    char *remoteBindingAddr = (char *)malloc(remoteBindingAddrLen + 1);
    napi_get_value_string_utf8(env, args[1], remoteBindingAddr, remoteBindingAddrLen + 1, NULL);

    // Convert third argument to a C string (forwardTo)
    size_t forwardToLen;
    status = napi_get_value_string_utf8(env, args[2], NULL, 0, &forwardToLen);
    if (status != napi_ok)
    {
        free(remoteBindingAddr);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected third argument to be a string (forwardTo)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }
    char *forwardTo = (char *)malloc(forwardToLen + 1);
    napi_get_value_string_utf8(env, args[2], forwardTo, forwardToLen + 1, NULL);

    // Call the Pinggy function
    pinggy_tunnel_request_additional_forwarding((pinggy_ref_t)tunnelRef, remoteBindingAddr, forwardTo);
    printf("[DEBUG] %s:%d %s ret = %d\n", __FILE__, __LINE__, __func__, tunnelRef);

    // Free allocated memory
    free(remoteBindingAddr);
    free(forwardTo);

    return NULL;
}

// Global reference to the callback function
typedef struct
{
    napi_ref callback_ref;
    napi_env env;
} CallbackData;

// primary forwarding succeeded callback in newer version in place of reverse forwarding done callback
void primary_forwarding_succeeded_callback(pinggy_void_p_t user_data, pinggy_ref_t tunnel, pinggy_len_t address_len, pinggy_char_p_p_t addresses)
{
    if (user_data == NULL)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Callback data is NULL", __FILE__, __LINE__);
        napi_throw_error(((CallbackData *)user_data)->env, NULL, error_message);
        return;
    }

    CallbackData *cb_data = (CallbackData *)user_data;
    napi_env env = cb_data->env;

    napi_value js_callback, undefined, js_addresses_array;
    napi_get_reference_value(env, cb_data->callback_ref, &js_callback);
    napi_get_undefined(env, &undefined);

    // Create a JavaScript array to hold the addresses
    napi_create_array_with_length(env, address_len, &js_addresses_array);

    for (int i = 0; i < address_len; i++)
    {
        napi_value js_address;
        napi_create_string_utf8(env, addresses[i], NAPI_AUTO_LENGTH, &js_address);
        napi_set_element(env, js_addresses_array, i, js_address);
    }

    // Call the JavaScript callback with the array of addresses
    napi_value result;
    napi_call_function(env, undefined, js_callback, 1, &js_addresses_array, &result);
    printf("[DEBUG] %s:%d %s ret = %d\n", __FILE__, __LINE__, __func__, result);
}

napi_value SetPrimaryForwardingCallback(napi_env env, napi_callback_info info)
{

    napi_status status;
    size_t argc = 2;
    napi_value args[2];
    napi_value js_tunnel;
    napi_value js_callback;

    // Extract arguments (tunnel reference & callback function)
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 2)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Wrong number of arguments", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    js_tunnel = args[0];
    js_callback = args[1];

    // Convert tunnel reference to C type
    pinggy_ref_t tunnel;
    status = napi_get_value_int64(env, js_tunnel, (int64_t *)&tunnel);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Invalid tunnel reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Verify callback is a function
    napi_valuetype valuetype;
    status = napi_typeof(env, js_callback, &valuetype);
    if (status != napi_ok || valuetype != napi_function)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Second argument must be a function", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Store callback in a reference
    CallbackData *cb_data = (CallbackData *)malloc(sizeof(CallbackData));
    if (cb_data == NULL)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to allocate memory for CallbackData", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }
    cb_data->env = env;
    status = napi_create_reference(env, js_callback, 1, &cb_data->callback_ref);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create reference for callback", __FILE__, __LINE__);
        free(cb_data);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Register callback with Pinggy
    pinggy_bool_t result = pinggy_tunnel_set_primary_forwarding_succeeded_callback(tunnel, primary_forwarding_succeeded_callback, cb_data);
    printf("[DEBUG] %s:%d %s ret = %d\n", __FILE__, __LINE__, __func__, result);
    if (result != pinggy_true)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to set primary forwarding succeeded callback", __FILE__, __LINE__);
        napi_delete_reference(env, cb_data->callback_ref);
        free(cb_data);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    return NULL;
}

// Structure to hold callback reference and environment
typedef struct
{
    napi_ref callback_ref;
    napi_env env;
} AdditionalForwardingCallbackData;

// C callback function that will be called by Pinggy
void additional_forwarding_succeeded_callback(pinggy_void_p_t user_data, pinggy_ref_t tunnel, pinggy_const_char_p_t address, pinggy_const_char_p_t protocol)
{
    if (user_data == NULL)
    {
        return;
    }

    AdditionalForwardingCallbackData *cb_data = (AdditionalForwardingCallbackData *)user_data;
    napi_env env = cb_data->env;

    napi_value js_callback, undefined, js_tunnel, js_address, js_protocol;
    napi_get_reference_value(env, cb_data->callback_ref, &js_callback);
    napi_get_undefined(env, &undefined);

    napi_create_int64(env, (int64_t)tunnel, &js_tunnel);
    napi_create_string_utf8(env, address, NAPI_AUTO_LENGTH, &js_address);
    napi_create_string_utf8(env, protocol, NAPI_AUTO_LENGTH, &js_protocol);

    napi_value args[3] = {js_tunnel, js_address, js_protocol};
    napi_value result;
    napi_call_function(env, undefined, js_callback, 3, args, &result);
    printf("[DEBUG] %s:%d %s ret = %d\n", __FILE__, __LINE__, __func__, result);
}

// JavaScript wrapper function to set the callback
napi_value SetAdditionalForwardingCallback(napi_env env, napi_callback_info info)
{
    napi_status status;
    size_t argc = 2;
    napi_value args[2];
    napi_value js_tunnel, js_callback;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 2)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Wrong number of arguments", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    js_tunnel = args[0];
    js_callback = args[1];

    // Convert tunnel reference to C type
    pinggy_ref_t tunnel;
    status = napi_get_value_int64(env, js_tunnel, (int64_t *)&tunnel);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Invalid tunnel reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Verify callback is a function
    napi_valuetype valuetype;
    status = napi_typeof(env, js_callback, &valuetype);
    if (status != napi_ok || valuetype != napi_function)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Second argument must be a function", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Store callback in a reference
    AdditionalForwardingCallbackData *cb_data = (AdditionalForwardingCallbackData *)malloc(sizeof(AdditionalForwardingCallbackData));
    if (cb_data == NULL)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to allocate memory for AdditionalForwardingCallbackData", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }
    cb_data->env = env;
    status = napi_create_reference(env, js_callback, 1, &cb_data->callback_ref);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create reference for callback", __FILE__, __LINE__);
        free(cb_data);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Register callback with Pinggy
    pinggy_bool_t result = pinggy_tunnel_set_additional_forwarding_succeeded_callback(tunnel, additional_forwarding_succeeded_callback, cb_data);
    printf("[DEBUG] %s:%d %s ret = %d\n", __FILE__, __LINE__, __func__, result);
    if (result != pinggy_true)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to set additional forwarding succeeded callback", __FILE__, __LINE__);
        napi_delete_reference(env, cb_data->callback_ref);
        free(cb_data);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    return NULL;
}

typedef struct
{
    napi_ref callback_ref;
    napi_env env;
} AuthCallbackData;

void authenticated_callback(pinggy_void_p_t user_data, pinggy_ref_t tunnel)
{
    AuthCallbackData *cb_data = (AuthCallbackData *)user_data;
    napi_env env = cb_data->env;

    napi_value js_callback, js_tunnel, undefined, js_result;
    napi_status status;

    // Get the JavaScript callback function
    status = napi_get_reference_value(env, cb_data->callback_ref, &js_callback);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to get callback reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }

    // Create JavaScript value for tunnel
    status = napi_create_uint32(env, tunnel, &js_tunnel);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create tunnel value", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }

    // Get undefined as `this` argument
    status = napi_get_undefined(env, &undefined);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to get undefined", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }

    // Call the JavaScript callback
    status = napi_call_function(env, undefined, js_callback, 1, &js_tunnel, &js_result);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to call JavaScript callback", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
    }
    printf("[DEBUG] %s:%d %s ret = %d\n", __FILE__, __LINE__, __func__, js_result);
}

napi_value SetAuthenticatedCallback(napi_env env, napi_callback_info info)
{
    napi_status status;
    size_t argc = 2;
    napi_value args[2];
    napi_value js_tunnel;
    napi_value js_callback;

    // Extract arguments (tunnel reference & callback function)
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 2)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Wrong number of arguments", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    js_tunnel = args[0];   // Tunnel reference (integer)
    js_callback = args[1]; // JavaScript callback function

    // Convert tunnel reference to C type
    pinggy_ref_t tunnel;
    status = napi_get_value_uint32(env, js_tunnel, &tunnel);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Invalid tunnel reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Store callback in a reference
    AuthCallbackData *cb_data = (AuthCallbackData *)malloc(sizeof(AuthCallbackData));
    cb_data->env = env;

    // To do: Decrease reference count when no longer needed to prevent memory leak
    status = napi_create_reference(env, js_callback, 1, &cb_data->callback_ref);
    if (status != napi_ok)
    {
        free(cb_data);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Unable to create reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Register callback with Pinggy
    pinggy_bool_t result = pinggy_tunnel_set_authenticated_callback(tunnel, authenticated_callback, cb_data);
    printf("[DEBUG] %s:%d %s ret = %d\n", __FILE__, __LINE__, __func__, result);

    // If registration failed, decrease reference count and free memory
    if (!result)
    {
        napi_delete_reference(env, cb_data->callback_ref);
        free(cb_data);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to set authenticated callback", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

// Wrapper for pinggy_tunnel_is_active
napi_value TunnelIsActive(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse the arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 1)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected one argument (tunnel ref)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Convert the first argument to uint32_t (tunnel ref)
    uint32_t tunnel_ref;
    status = napi_get_value_uint32(env, args[0], &tunnel_ref);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected argument to be an unsigned integer (tunnel ref)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Call the pinggy_tunnel_is_active function
    pinggy_bool_t result = pinggy_tunnel_is_active((pinggy_ref_t)tunnel_ref);
    printf("[DEBUG] %s:%d %s ret = %d\n", __FILE__, __LINE__, __func__, result);

    // Convert the result (pinggy_bool_t) to a JavaScript boolean
    napi_value js_result;
    status = napi_get_boolean(env, result, &js_result);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create JavaScript boolean", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    return js_result;
}

// ================================= INITIALIZATION =================================

// Initialize the module and export the function
napi_value Init2(napi_env env, napi_value exports)
{
    napi_value request_primary_forwarding_fn,
        tunnel_initiate_fn, tunnel_start_fn,
        tunnel_resume_fn, tunnel_stop_fn,
        tunnel_set_reverse_forwarding_done_callback_fn,
        tunnel_connect_fn,
        tunnel_set_authenticated_callback_fn,
        tunnel_start_web_debugging_fn,
        tunnel_request_additional_forwarding_fn,
        tunnel_set_additional_forwarding_succeeded_callback_fn,
        tunnel_is_active_fn;

    napi_create_function(env, NULL, 0, TunnelRequestPrimaryForwarding, NULL, &request_primary_forwarding_fn);
    napi_set_named_property(env, exports, "tunnelRequestPrimaryForwarding", request_primary_forwarding_fn);

    napi_create_function(env, NULL, 0, TunnelInitiate, NULL, &tunnel_initiate_fn);
    napi_set_named_property(env, exports, "tunnelInitiate", tunnel_initiate_fn);

    napi_create_function(env, NULL, 0, TunnelStart, NULL, &tunnel_start_fn);
    napi_set_named_property(env, exports, "tunnelStart", tunnel_start_fn);

    napi_create_function(env, NULL, 0, TunnelResume, NULL, &tunnel_resume_fn);
    napi_set_named_property(env, exports, "tunnelResume", tunnel_resume_fn);

    napi_create_function(env, NULL, 0, TunnelStop, NULL, &tunnel_stop_fn);
    napi_set_named_property(env, exports, "tunnelStop", tunnel_stop_fn);

    // napi_create_function(env, NULL, 0, SetReverseForwardingCallback, NULL, &tunnel_set_reverse_forwarding_done_callback_fn);
    // napi_set_named_property(env, exports, "tunnelSetReverseForwardingDoneCallback", tunnel_set_reverse_forwarding_done_callback_fn);

    // add the updated callback
    napi_create_function(env, NULL, 0, SetPrimaryForwardingCallback, NULL, &tunnel_set_reverse_forwarding_done_callback_fn);
    napi_set_named_property(env, exports, "tunnelSetPrimaryForwardingSucceededCallback", tunnel_set_reverse_forwarding_done_callback_fn);

    napi_create_function(env, NULL, 0, TunnelConnect, NULL, &tunnel_connect_fn);
    napi_set_named_property(env, exports, "tunnelConnect", tunnel_connect_fn);

    napi_create_function(env, NULL, 0, SetAuthenticatedCallback, NULL, &tunnel_set_authenticated_callback_fn);
    napi_set_named_property(env, exports, "tunnelSetAuthenticatedCallback", tunnel_set_authenticated_callback_fn);

    napi_create_function(env, NULL, 0, TunnelStartWebDebugging, NULL, &tunnel_start_web_debugging_fn);
    napi_set_named_property(env, exports, "tunnelStartWebDebugging", tunnel_start_web_debugging_fn);

    napi_create_function(env, NULL, 0, TunnelRequestAdditionalForwarding, NULL, &tunnel_request_additional_forwarding_fn);
    napi_set_named_property(env, exports, "tunnelRequestAdditionalForwarding", tunnel_request_additional_forwarding_fn);

    napi_create_function(env, NULL, 0, SetAdditionalForwardingCallback, NULL, &tunnel_set_additional_forwarding_succeeded_callback_fn);
    napi_set_named_property(env, exports, "tunnelSetAdditionalForwardingSucceededCallback", tunnel_set_additional_forwarding_succeeded_callback_fn);

    // Add the new function to exports
    napi_create_function(env, NULL, 0, TunnelIsActive, NULL, &tunnel_is_active_fn);
    napi_set_named_property(env, exports, "tunnelIsActive", tunnel_is_active_fn);

    return exports;
}