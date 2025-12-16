#include <node_api.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include "../pinggy.h"
#include "debug.h"

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
    PINGGY_DEBUG_INT(tunnel);

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
    PINGGY_DEBUG_INT(success);
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

napi_value TunnelStartNonBlocking(napi_env env, napi_callback_info info)
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

    // Call the pinggy_tunnel_start_non_blocking function
    pinggy_bool_t success = pinggy_tunnel_start_non_blocking(tunnel);
    PINGGY_DEBUG_INT(success);
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
    pinggy_bool_t ret = pinggy_tunnel_resume((pinggy_ref_t)tunnel_ref);
    PINGGY_DEBUG_INT(ret);

    // Return the result as a JavaScript boolean
    napi_value result;
    status = napi_get_boolean(env, ret, &result);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create JavaScript boolean", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    return result;
}

napi_value TunnelResumeWithTimeout(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse the arguments: expect tunnelRef and timeout
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 2)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected two arguments (tunnel ref, timeout)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Convert the first argument to uint32_t (tunnel ref)
    uint32_t tunnel_ref;
    status = napi_get_value_uint32(env, args[0], &tunnel_ref);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected first argument to be an unsigned integer (tunnel ref)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Convert the second argument to an integer (timeout). Allow negative values (e.g. -1).
    int32_t timeout;
    status = napi_get_value_int32(env, args[1], &timeout);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected second argument to be an integer (timeout)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Call the native function with provided timeout
    pinggy_bool_t ret = pinggy_tunnel_resume_timeout((pinggy_ref_t)tunnel_ref, (pinggy_int32_t)timeout);

    // Return the result as a JavaScript boolean
    napi_value result;
    status = napi_get_boolean(env, ret, &result);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create JavaScript boolean", __FILE__, __LINE__);
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
    PINGGY_DEBUG_INT(result);

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

    size_t listening_addr_len;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &listening_addr_len);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Invalid listening address", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }
    // create a buffer to hold the listening address
    pinggy_const_char_p_t listening_addr = (char *)malloc(listening_addr_len + 1);
    status = napi_get_value_string_utf8(env, args[1], listening_addr, listening_addr_len + 1, NULL);
    if (status != napi_ok)
    {
        free(listening_addr);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to get listening address string", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }
    // copy string into buffer
    // listening_addr[listening_addr_len] = '\0';
    status = napi_get_value_string_utf8(env, args[1], (char *)listening_addr, listening_addr_len + 1, NULL);
    if (status != napi_ok)
    {
        free((void *)listening_addr);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to copy listening address string", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Call the actual Pinggy function Example: "localhost:4300" specify host:port
    pinggy_uint16_t result = pinggy_tunnel_start_web_debugging(tunnel, listening_addr);
    PINGGY_DEBUG_INT(result);

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
    PINGGY_DEBUG_INT(result);

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

napi_value GetTunnelState(napi_env env, napi_callback_info info)
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

    // Call the native function to get the tunnel state
    pinggy_const_char_p_t state = pinggy_tunnel_get_state(tunnel);
    if (state == NULL)
    {
        napi_throw_error(env, NULL, "Failed to get tunnel state");
        return NULL;
    }

    status = napi_create_string_utf8(env, state, NAPI_AUTO_LENGTH, &result);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to create result string");
        return NULL;
    }
    return result;
}

// Retrieves the web debugging address from the tunnel.
napi_value GetTunnelWebDebuggingAddress(napi_env env, napi_callback_info info)
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

    pinggy_capa_t required_len = 0;
    // Call the native function to get the web debugging address length
    pinggy_const_int_t rc = pinggy_tunnel_get_webdebugging_addr_len(tunnel, 0, NULL, &required_len);
    if (rc < 0 || required_len == 0)
    {
        napi_throw_error(env, NULL, "Failed to get web debugging address length");
        return NULL;
    }

    pinggy_char_p_t webdebug_addr = malloc(required_len + 1);
    if (webdebug_addr == NULL)
    {
        napi_throw_error(env, NULL, "Memory allocation failed");
        return NULL;
    }

    // Call the native function to get the web debugging address
    pinggy_const_int_t copied_len = pinggy_tunnel_get_webdebugging_addr(tunnel, required_len, webdebug_addr);
    if (copied_len < 0)
    {
        napi_throw_error(env, NULL, "Failed to get web debugging address");
        free(webdebug_addr);
        return NULL;
    }

    status = napi_create_string_utf8(env, webdebug_addr, copied_len, &result);
    free(webdebug_addr);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to create result string");
        return NULL;
    }

    return result;
}

napi_value GetTunnelWebDebuggingPort(napi_env env, napi_callback_info info)
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

    // Call the native function to get the web debugging port
    pinggy_uint16_t port = pinggy_tunnel_get_webdebugging_port(tunnel);
    PINGGY_DEBUG_INT(port);

    // Return the port as a JavaScript number
    status = napi_create_uint32(env, port, &result);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to create result value");
        return NULL;
    }

    return result;
}

// Wrapper for pinggy_tunnel_request_additional_forwarding
// ================================= CALLBACKS =================================
napi_value TunnelRequestAdditionalForwarding(napi_env env, napi_callback_info info)
{
    size_t argc = 4;
    napi_value args[4];
    napi_status status;

    // Parse the arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 4)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected three arguments: (tunnelRef, remote_binding_url, forward_to, forwarding_type)", __FILE__, __LINE__);
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

    // Convert second argument to a C string (remote_binding_url)
    size_t remote_binding_url_len;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &remote_binding_url_len);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected second argument to be a string (remote_binding_url)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }
    char *remote_binding_url = (char *)malloc(remote_binding_url_len + 1);
    napi_get_value_string_utf8(env, args[1], remote_binding_url, remote_binding_url_len + 1, NULL);

    // Convert third argument to a C string (forwardTo)
    size_t forward_to_len;
    status = napi_get_value_string_utf8(env, args[2], NULL, 0, &forward_to_len);
    if (status != napi_ok)
    {
        free(remote_binding_url);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected third argument to be a string (forward_to)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }
    char *forward_to = (char *)malloc(forward_to_len + 1);
    napi_get_value_string_utf8(env, args[2], forward_to, forward_to_len + 1, NULL);

    // Convert fourth argument to a C string (forwardTo)
    size_t forwarding_type_len;
    status = napi_get_value_string_utf8(env, args[3], NULL, 0, &forwarding_type_len);
    if (status != napi_ok)
    {
        free(remote_binding_url);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected third argument to be a string (forward_type)", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }
    char *forward_type = (char *)malloc(forwarding_type_len + 1);
    napi_get_value_string_utf8(env, args[3], forward_type, forwarding_type_len + 1, NULL);

    pinggy_const_char_p_t remoteBindingAddr = remote_binding_url;
    ;
    pinggy_const_char_p_t forwardTo = forward_to;
    pinggy_const_char_p_t forwardingType = forward_type;

    // Call the Pinggy function
    pinggy_tunnel_request_additional_forwarding((pinggy_ref_t)tunnelRef, remoteBindingAddr, forwardTo, forwardingType);
    PINGGY_DEBUG_INT(tunnelRef);

    // Free allocated memory
    free(remote_binding_url);
    free(forward_to);
    free(forward_type);

    return NULL;
}

// Structure to hold callback reference and environment
typedef struct
{
    napi_ref callback_ref;
    napi_env env;

} AdditionalForwardingCallbackData;

// C callback function that will be called by Pinggy
void additional_forwarding_succeeded_callback(pinggy_void_p_t user_data, pinggy_ref_t tunnel, pinggy_const_char_p_t bind_addr, pinggy_const_char_p_t forward_to_addr)
{
    napi_status status;
    if (user_data == NULL)
    {
        return;
    }

    AdditionalForwardingCallbackData *cb_data = (AdditionalForwardingCallbackData *)user_data;
    napi_env env = cb_data->env;

    napi_value js_callback, undefined, js_tunnel, js_bind_address, js_forward_to_addr;
    status = napi_get_reference_value(env, cb_data->callback_ref, &js_callback);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to get callback reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }
    napi_get_undefined(env, &undefined);

    // convert from the C int64_t type to the JavaScript number type
    status = napi_create_int64(env, (int64_t)tunnel, &js_tunnel);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create tunnel value", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }

    // Convert UTF-8 encoded c string to JS string
    status = napi_create_string_utf8(env, bind_addr, NAPI_AUTO_LENGTH, &js_bind_address);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create bind address value", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }
    // Convert UTF-8 encoded c string to JS string
    status = napi_create_string_utf8(env, forward_to_addr, NAPI_AUTO_LENGTH, &js_forward_to_addr);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create forward to address value", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }
    napi_value args[3] = {js_tunnel, js_bind_address, js_forward_to_addr};
    napi_value result;
    status = napi_call_function(env, undefined, js_callback, 3, args, &result);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to call JavaScript callback", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }
    PINGGY_DEBUG_RET(result);
}

// JavaScript wrapper function to set the callback
napi_value SetAdditionalForwardingsucceededCallback(napi_env env, napi_callback_info info)
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
    pinggy_bool_t result = pinggy_tunnel_set_on_additional_forwarding_succeeded_callback(tunnel, additional_forwarding_succeeded_callback, cb_data);
    PINGGY_DEBUG_INT(result);
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

} TunnelFailedCallbackData;

void tunnel_failed_callback(pinggy_void_p_t user_data, pinggy_ref_t tunnel, pinggy_const_char_p_t msg)
{
    TunnelFailedCallbackData *cb_data = (TunnelFailedCallbackData *)user_data;
    napi_env env = cb_data->env;

    napi_value js_callback, js_tunnel, js_msg, undefined, js_result;
    napi_status status;

    status = napi_get_reference_value(env, cb_data->callback_ref, &js_callback);
    if (status != napi_ok)
    {

        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to get callback reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }

    status = napi_create_uint32(env, tunnel, &js_tunnel);
    if (status != napi_ok)
    {

        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create tunnel value", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }

    status = napi_create_string_utf8(env, msg, NAPI_AUTO_LENGTH, &js_msg);
    if (status != napi_ok)
    {

        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create message string", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }

    status = napi_get_undefined(env, &undefined);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to get undefined", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }

    napi_value args[2] = {js_tunnel, js_msg};
    status = napi_call_function(env, undefined, js_callback, 2, args, &js_result);
    if (status != napi_ok)
    {

        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to call JavaScript callback", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
    }
    PINGGY_DEBUG_RET(js_result);
}

// Registers a callback for when primary forwarding fails.
napi_value SetOnTunnelFailedCallback(napi_env env, napi_callback_info info)
{
    napi_status status;
    size_t argc = 2;
    napi_value args[2];
    napi_value js_tunnel;
    napi_value js_callback;

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

    pinggy_ref_t tunnel;
    status = napi_get_value_uint32(env, js_tunnel, &tunnel);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Invalid tunnel reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    napi_valuetype valuetype;
    status = napi_typeof(env, js_callback, &valuetype);
    if (status != napi_ok || valuetype != napi_function)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Second argument must be a function", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    TunnelFailedCallbackData *cb_data = (TunnelFailedCallbackData *)malloc(sizeof(TunnelFailedCallbackData));
    if (cb_data == NULL)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to allocate memory for TunnelFailedCallbackData", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }
    cb_data->env = env;
    status = napi_create_reference(env, js_callback, 1, &cb_data->callback_ref);
    if (status != napi_ok)
    {
        free(cb_data);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Unable to create reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    pinggy_bool_t result = pinggy_tunnel_set_on_tunnel_failed_callback(tunnel, tunnel_failed_callback, cb_data);
    PINGGY_DEBUG_INT(result);

    if (!result)
    {
        napi_delete_reference(env, cb_data->callback_ref);
        free(cb_data);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to set tunnel_failed_callback", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

typedef struct
{
    napi_ref callback_ref;
    napi_env env;

} TunnelEstablishedCallbackData;

void tunnel_established_callback(pinggy_void_p_t user_data, pinggy_ref_t tunnel, pinggy_len_t num_urls, pinggy_char_p_p_t urls)
{
    TunnelEstablishedCallbackData *cb_data = (TunnelEstablishedCallbackData *)user_data;
    napi_env env = cb_data->env;

    napi_value js_callback, js_tunnel, js_urls_array, undefined, js_result;
    napi_status status;

    status = napi_get_reference_value(env, cb_data->callback_ref, &js_callback);
    if (status != napi_ok)
    {
        return;
    }

    status = napi_create_uint32(env, tunnel, &js_tunnel);
    if (status != napi_ok)
    {
        return;
    }

    // Create a JavaScript array to hold the URLs
    napi_create_array_with_length(env, num_urls, &js_urls_array);
    for (pinggy_len_t i = 0; i < num_urls; i++)
    {
        napi_value js_url;
        napi_create_string_utf8(env, urls[i] ? urls[i] : "", NAPI_AUTO_LENGTH, &js_url);
        napi_set_element(env, js_urls_array, i, js_url);
    }

    status = napi_get_undefined(env, &undefined);
    if (status != napi_ok)
    {
        return;
    }

    napi_value args[2] = {js_tunnel, js_urls_array};
    status = napi_call_function(env, undefined, js_callback, 2, args, &js_result);
    if (status != napi_ok)
    {
        return;
    }
    PINGGY_DEBUG_RET(js_result);
}
// Callback for when primary forwarding is successfully established.
napi_value SetOnTunnelEstablishedCallback(napi_env env, napi_callback_info info)
{
    napi_status status;
    size_t argc = 2;
    napi_value args[2];
    napi_value js_tunnel;
    napi_value js_callback;

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

    pinggy_ref_t tunnel;
    status = napi_get_value_uint32(env, js_tunnel, &tunnel);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Invalid tunnel reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    napi_valuetype valuetype;
    status = napi_typeof(env, js_callback, &valuetype);
    if (status != napi_ok || valuetype != napi_function)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Second argument must be a function", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    TunnelEstablishedCallbackData *cb_data = (TunnelEstablishedCallbackData *)malloc(sizeof(TunnelEstablishedCallbackData));
    if (cb_data == NULL)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to allocate memory for TunnelEstablishedCallbackData", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }
    cb_data->env = env;
    status = napi_create_reference(env, js_callback, 1, &cb_data->callback_ref);
    if (status != napi_ok)
    {
        free(cb_data);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Unable to create reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    pinggy_bool_t result = pinggy_tunnel_set_on_tunnel_established_callback(tunnel, tunnel_established_callback, cb_data);
    PINGGY_DEBUG_INT(result);

    if (!result)
    {
        napi_delete_reference(env, cb_data->callback_ref);
        free(cb_data);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to set inggy_tunnel_set_on_tunnel_established_callback", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

typedef struct
{
    napi_ref callback_ref;
    napi_env env;

} TunnelForwardingChangedCallbackData;

void tunnel_forwarding_changed_callback(pinggy_void_p_t user_data, pinggy_ref_t tunnel, pinggy_const_char_p_t url_map)
{
    TunnelForwardingChangedCallbackData *cb_data = (TunnelForwardingChangedCallbackData *)user_data;
    napi_env env = cb_data->env;

    napi_value js_callback, js_tunnel, js_url_map, undefined, js_result;
    napi_status status;

    status = napi_get_reference_value(env, cb_data->callback_ref, &js_callback);
    if (status != napi_ok)
    {
        return;
    }

    status = napi_create_uint32(env, tunnel, &js_tunnel);
    if (status != napi_ok)
    {
        return;
    }

    // Convert the url_map string to a JavaScript string
    status = napi_create_string_utf8(env, url_map ? url_map : "", NAPI_AUTO_LENGTH, &js_url_map);
    if (status != napi_ok)
    {
        return;
    }

    status = napi_get_undefined(env, &undefined);
    if (status != napi_ok)
    {
        return;
    }

    napi_value args[2] = {js_tunnel, js_url_map};
    status = napi_call_function(env, undefined, js_callback, 2, args, &js_result);
    if (status != napi_ok)
    {
        return;
    }
    PINGGY_DEBUG_RET(js_result);
}

napi_value SetOnTunnelForwardingChangedCallback(napi_env env, napi_callback_info info)
{
    napi_status status;
    size_t argc = 2;
    napi_value args[2];
    napi_value js_tunnel;
    napi_value js_callback;

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

    pinggy_ref_t tunnel;
    status = napi_get_value_uint32(env, js_tunnel, &tunnel);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Invalid tunnel reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    napi_valuetype valuetype;
    status = napi_typeof(env, js_callback, &valuetype);
    if (status != napi_ok || valuetype != napi_function)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Second argument must be a function", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    TunnelForwardingChangedCallbackData *cb_data = (TunnelForwardingChangedCallbackData *)malloc(sizeof(TunnelForwardingChangedCallbackData));
    if (cb_data == NULL)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to allocate memory for TunnelForwardingChangedCallbackData", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }
    cb_data->env = env;
    status = napi_create_reference(env, js_callback, 1, &cb_data->callback_ref);
    if (status != napi_ok)
    {
        free(cb_data);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Unable to create reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    pinggy_bool_t result = pinggy_tunnel_set_on_forwardings_changed_callback(tunnel, tunnel_forwarding_changed_callback, cb_data);
    PINGGY_DEBUG_INT(result);

    if (!result)
    {
        napi_delete_reference(env, cb_data->callback_ref);
        free(cb_data);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to set pinggy_tunnel_set_on_forwardings_changed_callback", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

typedef struct
{
    napi_ref callback_ref;
    napi_env env;

} AdditionalForwardingFailedCallbackData;

void additional_forwarding_failed_callback(pinggy_void_p_t user_data, pinggy_ref_t tunnel, pinggy_const_char_p_t bind_address, pinggy_const_char_p_t forward_to_addr, pinggy_const_char_p_t forwarding_type, pinggy_const_char_p_t error_message)
{
    AdditionalForwardingFailedCallbackData *cb_data = (AdditionalForwardingFailedCallbackData *)user_data;
    napi_handle_scope scope;
    napi_open_handle_scope(cb_data->env, &scope);

    napi_value global;
    napi_get_global(cb_data->env, &global);

    napi_value callback;
    napi_get_reference_value(cb_data->env, cb_data->callback_ref, &callback);

    napi_value argv[5];
    napi_create_uint32(cb_data->env, (uint32_t)tunnel, &argv[0]);
    napi_create_string_utf8(cb_data->env, bind_address, NAPI_AUTO_LENGTH, &argv[1]);
    napi_create_string_utf8(cb_data->env, forward_to_addr, NAPI_AUTO_LENGTH, &argv[2]);
    napi_create_string_utf8(cb_data->env, forwarding_type, NAPI_AUTO_LENGTH, &argv[3]);
    napi_create_string_utf8(cb_data->env, error_message, NAPI_AUTO_LENGTH, &argv[4]);

    napi_value undefined;
    napi_get_undefined(cb_data->env, &undefined);

    napi_call_function(cb_data->env, global, callback, 5, argv, NULL);

    napi_close_handle_scope(cb_data->env, scope);
}

napi_value SetAdditionalForwardingFailedCallback(napi_env env, napi_callback_info info)
{
    napi_status status;
    size_t argc = 2;
    napi_value args[2];
    napi_value js_tunnel, js_callback;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 2)
    {
        napi_throw_error(env, NULL, "Expected 2 arguments: tunnelRef (uint32), callback (function)");
        return NULL;
    }

    js_tunnel = args[0];
    js_callback = args[1];

    pinggy_ref_t tunnel;
    status = napi_get_value_uint32(env, js_tunnel, &tunnel);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Invalid tunnel reference");
        return NULL;
    }

    napi_valuetype cb_type;
    status = napi_typeof(env, js_callback, &cb_type);
    if (status != napi_ok || cb_type != napi_function)
    {
        napi_throw_error(env, NULL, "Second argument must be a function");
        return NULL;
    }

    AdditionalForwardingFailedCallbackData *cb_data = malloc(sizeof(AdditionalForwardingFailedCallbackData));
    if (cb_data == NULL)
    {
        napi_throw_error(env, NULL, "Failed to allocate callback data");
        return NULL;
    }

    cb_data->env = env;
    status = napi_create_reference(env, js_callback, 1, &cb_data->callback_ref);
    if (status != napi_ok)
    {
        free(cb_data);
        napi_throw_error(env, NULL, "Failed to create callback reference");
        return NULL;
    }

    pinggy_bool_t result = pinggy_tunnel_set_on_additional_forwarding_failed_callback(
        tunnel, additional_forwarding_failed_callback, cb_data);

    if (!result)
    {
        napi_delete_reference(env, cb_data->callback_ref);
        free(cb_data);
        napi_throw_error(env, NULL, "Failed to register callback in Pinggy native layer");
        return NULL;
    }

    napi_value js_result;
    status = napi_get_boolean(env, result, &js_result);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to create boolean result");
        return NULL;
    }
    return js_result;
}

typedef struct
{
    napi_env env;
    napi_ref callback_ref;
} disconnected_callback_data;

void on_disconnected_cb(pinggy_void_p_t user_data, pinggy_ref_t tunnel_ref, pinggy_const_char_p_t error, pinggy_len_t msg_size, pinggy_char_p_p_t msg)
{
    disconnected_callback_data *cb_data = (disconnected_callback_data *)user_data;
    napi_handle_scope scope;
    napi_open_handle_scope(cb_data->env, &scope);

    napi_value global;
    napi_get_global(cb_data->env, &global);

    napi_value callback;
    napi_get_reference_value(cb_data->env, cb_data->callback_ref, &callback);

    napi_value argv[3];
    napi_create_uint32(cb_data->env, (uint32_t)tunnel_ref, &argv[0]);
    napi_create_string_utf8(cb_data->env, error, NAPI_AUTO_LENGTH, &argv[1]);

    // Create array for messages
    napi_value msg_array;
    napi_create_array(cb_data->env, &msg_array);
    for (pinggy_len_t i = 0; i < msg_size; i++)
    {
        napi_value msg_str;
        napi_create_string_utf8(cb_data->env, msg[i], NAPI_AUTO_LENGTH, &msg_str);
        napi_set_element(cb_data->env, msg_array, i, msg_str);
    }
    argv[2] = msg_array;

    napi_value undefined;
    napi_get_undefined(cb_data->env, &undefined);

    napi_call_function(cb_data->env, global, callback, 3, argv, NULL);

    napi_close_handle_scope(cb_data->env, scope);
}

napi_value TunnelSetDisconnectedCallback(napi_env env, napi_callback_info info)
{
    napi_status status;
    size_t argc = 2;
    napi_value args[2];

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 2)
    {
        napi_throw_error(env, NULL, "Expected 2 arguments: tunnelRef (uint32), callback (function)");
        return NULL;
    }

    uint32_t tunnelRef;
    status = napi_get_value_uint32(env, args[0], &tunnelRef);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid tunnel reference");
        return NULL;
    }

    napi_valuetype cb_type;
    status = napi_typeof(env, args[1], &cb_type);
    if (status != napi_ok || cb_type != napi_function)
    {
        napi_throw_type_error(env, NULL, "Callback must be a function");
        return NULL;
    }

    disconnected_callback_data *cb_data = malloc(sizeof(disconnected_callback_data));
    if (cb_data == NULL)
    {
        napi_throw_error(env, NULL, "Failed to allocate memory for callback data");
        return NULL;
    }
    cb_data->env = env;
    status = napi_create_reference(env, args[1], 1, &cb_data->callback_ref);
    if (status != napi_ok)
    {
        free(cb_data);
        napi_throw_error(env, NULL, "Failed to create callback reference");
        return NULL;
    }

    pinggy_bool_t result = pinggy_tunnel_set_on_disconnected_callback(
        (pinggy_ref_t)tunnelRef,
        on_disconnected_cb,
        cb_data);

    if (!result)
    {
        napi_delete_reference(env, cb_data->callback_ref);
        free(cb_data);
        napi_throw_error(env, NULL, "Failed to register callback in Pinggy native layer");
        return NULL;
    }

    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

typedef struct
{
    napi_env env;
    napi_ref callback_ref;
} tunnel_error_callback_data;

void on_tunnel_error_cb(pinggy_void_p_t user_data, pinggy_ref_t tunnel_ref, pinggy_uint32_t error_no, pinggy_const_char_p_t error, pinggy_bool_t recoverable)
{
    tunnel_error_callback_data *cb_data = (tunnel_error_callback_data *)user_data;
    napi_handle_scope scope;
    napi_open_handle_scope(cb_data->env, &scope);

    napi_value global;
    napi_get_global(cb_data->env, &global);

    napi_value callback;
    napi_get_reference_value(cb_data->env, cb_data->callback_ref, &callback);

    napi_value argv[4];
    napi_create_uint32(cb_data->env, (uint32_t)tunnel_ref, &argv[0]);
    napi_create_uint32(cb_data->env, error_no, &argv[1]);
    napi_create_string_utf8(cb_data->env, error, NAPI_AUTO_LENGTH, &argv[2]);
    napi_get_boolean(cb_data->env, recoverable, &argv[3]);

    napi_value undefined;
    napi_get_undefined(cb_data->env, &undefined);

    napi_call_function(cb_data->env, global, callback, 4, argv, NULL);

    napi_close_handle_scope(cb_data->env, scope);
}

napi_value TunnelSetErrorCallback(napi_env env, napi_callback_info info)
{
    napi_status status;
    size_t argc = 2;
    napi_value args[2];

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    if (status != napi_ok || argc < 2)
    {
        napi_throw_error(env, NULL, "Expected 2 arguments: tunnelRef (uint32), callback (function)");
        return NULL;
    }

    uint32_t tunnelRef;
    status = napi_get_value_uint32(env, args[0], &tunnelRef);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid tunnel reference");
        return NULL;
    }
    napi_valuetype cb_type;
    status = napi_typeof(env, args[1], &cb_type);
    if (status != napi_ok || cb_type != napi_function)
    {
        napi_throw_type_error(env, NULL, "Callback must be a function");
        return NULL;
    }

    tunnel_error_callback_data *cb_data = malloc(sizeof(tunnel_error_callback_data));
    if (cb_data == NULL)
    {
        napi_throw_error(env, NULL, "Failed to allocate memory for callback data");
        return NULL;
    }
    cb_data->env = env;
    status = napi_create_reference(env, args[1], 1, &cb_data->callback_ref);

    if (status != napi_ok)
    {
        free(cb_data);
        napi_throw_error(env, NULL, "Failed to create callback reference");
        return NULL;
    }

    pinggy_bool_t result = pinggy_tunnel_set_on_tunnel_error_callback(
        (pinggy_ref_t)tunnelRef,
        on_tunnel_error_cb,
        cb_data);

    if (!result)
    {
        napi_delete_reference(env, cb_data->callback_ref);
        free(cb_data);
        napi_throw_error(env, NULL, "Failed to register callback in Pinggy native layer");
        return NULL;
    }

    napi_value js_result;
    status = napi_get_boolean(env, result, &js_result);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to create boolean result");
        return NULL;
    }
    return js_result;
}

// Wrapper for pinggy_config_set_ssl
napi_value ConfigSetSsl(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 2)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Expected 2 arguments: configRef and ssl", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Get config reference
    uint32_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Invalid config reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Get ssl boolean
    bool ssl;
    status = napi_get_value_bool(env, args[1], &ssl);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Invalid ssl value", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    // Call the native function
    pinggy_config_set_ssl(config, ssl ? pinggy_true : pinggy_false);
    PINGGY_DEBUG_VOID();

    return NULL;
}

napi_value GetTunnelGreetMessage(napi_env env, napi_callback_info info)
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
    pinggy_capa_t required_len = 0;
    // Call the native function to get the greet message length
    pinggy_const_int_t rc = pinggy_tunnel_get_greeting_msgs_len(tunnel, 0, NULL, &required_len);
    if (rc < 0 || required_len == 0)
    {
        napi_throw_error(env, NULL, "Failed to get greeting message length");
        return NULL;
    }
    pinggy_char_p_t greet_msg = malloc(required_len + 1);
    if (greet_msg == NULL)
    {
        napi_throw_error(env, NULL, "Memory allocation failed");
        return NULL;
    }
    // Call the native function to get the greet message
    pinggy_const_int_t copied_len = pinggy_tunnel_get_greeting_msgs(tunnel, required_len, greet_msg);
    if (copied_len < 0)
    {
        napi_throw_error(env, NULL, "Failed to get greeting message");
        free(greet_msg);
        return NULL;
    }
    status = napi_create_string_utf8(env, greet_msg, NAPI_AUTO_LENGTH, &result);
    free(greet_msg);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to create result string");
        return NULL;
    }
    return result;
}

napi_value startTunnelUsageUpdate(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
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

    // Call the pinggy_tunnel_start_usage_update function
    pinggy_tunnel_start_usage_update(tunnel_ref);

    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

napi_value stopTunnelUsageUpdate(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
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

    // Call the pinggy_tunnel_stop_usage_update function
    pinggy_tunnel_stop_usage_update(tunnel_ref);

    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

napi_value GetTunnelUsages(napi_env env, napi_callback_info info)
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

    pinggy_capa_t required_len = 0;
    // Call the native function to get the usages length
    pinggy_const_int_t rc = pinggy_tunnel_get_current_usages_len(tunnel, 0, NULL, &required_len);
    if (rc < 0 || required_len == 0)
    {
        napi_throw_error(env, NULL, "Failed to get usages length");
        return NULL;
    }
    pinggy_char_p_t usages = malloc(required_len + 1);
    if (usages == NULL)
    {
        napi_throw_error(env, NULL, "Memory allocation failed");
        return NULL;
    }
    // Call the native function to get the usages
    pinggy_const_int_t copied_len = pinggy_tunnel_get_current_usages(tunnel, required_len, usages);
    if (copied_len < 0)
    {
        napi_throw_error(env, NULL, "Failed to get usages");
        free(usages);
        return NULL;
    }
    status = napi_create_string_utf8(env, usages, copied_len, &result);
    free(usages);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to create result string");
        return NULL;
    }
    return result;
}
typedef struct
{
    napi_ref callback_ref;
    napi_env env;

} CallbackData;

// forwarding changed callback: receives a JSON url_map string
void on_forwardings_changed_cb(pinggy_void_p_t user_data, pinggy_ref_t tunnel_ref, pinggy_const_char_p_t url_map)
{
    if (user_data == NULL)
    {
        fprintf(stderr, "[%s:%d] NULL user_data in on_forwarding_changed_cb\n", __FILE__, __LINE__);
        return;
    }

    CallbackData *cb_data = (CallbackData *)user_data;
    napi_env env = cb_data->env;
    napi_status status;
    if (env == NULL)
    {
        fprintf(stderr, "[%s:%d] NULL env in on_forwarding_changed_cb\n", __FILE__, __LINE__);
        return;
    }
    napi_handle_scope scope;
    napi_open_handle_scope(env, &scope);

    napi_value callback;
    napi_get_reference_value(env, cb_data->callback_ref, &callback);

    napi_value argv[2];
    status = napi_create_uint32(env, (uint32_t)tunnel_ref, &argv[0]);
    if (status != napi_ok)
    {
        napi_close_handle_scope(env, scope);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create tunnel argument", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }
    status = napi_create_string_utf8(env, url_map ? url_map : "", NAPI_AUTO_LENGTH, &argv[1]);
    if (status != napi_ok)
    {
        napi_close_handle_scope(env, scope);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create url_map argument", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }

    napi_value undefined;
    napi_get_undefined(env, &undefined);
    napi_value js_result;
    status = napi_call_function(env, undefined, callback, 2, argv, &js_result);
    if (status != napi_ok)
    {
        napi_close_handle_scope(env, scope);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to call callback", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }
    PINGGY_DEBUG_RET(js_result);
    napi_close_handle_scope(env, scope);
}

napi_value SetForwardingChangedCallback(napi_env env, napi_callback_info info)
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
    pinggy_bool_t result = pinggy_tunnel_set_on_forwardings_changed_callback(tunnel, on_forwardings_changed_cb, cb_data);
    PINGGY_DEBUG_INT(result);
    if (result != pinggy_true)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to set forwarding changed callback", __FILE__, __LINE__);
        napi_delete_reference(env, cb_data->callback_ref);
        free(cb_data);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    return NULL;
}

void on_usage_update_cb(pinggy_void_p_t user_data, pinggy_ref_t tunnel_ref, pinggy_const_char_p_t usages)
{
    CallbackData *cb_data = (CallbackData *)user_data;
    if (cb_data == NULL)
    {
        fprintf(stderr, "[%s:%d] NULL cb_data in on_usage_update_cb\n", __FILE__, __LINE__);
        return;
    }
    napi_env env = cb_data->env;
    if (env == NULL)
    {
        fprintf(stderr, "[%s:%d] NULL env in on_usage_update_cb\n", __FILE__, __LINE__);
        return;
    }
    napi_handle_scope scope;
    napi_status status = napi_open_handle_scope(env, &scope);
    if (status != napi_ok)
        return;

    napi_value callback;
    status = napi_get_reference_value(env, cb_data->callback_ref, &callback);
    if (status != napi_ok)
    {
        napi_close_handle_scope(env, scope);
        return;
    }

    napi_value argv[2];
    status = napi_create_uint32(env, (uint32_t)tunnel_ref, &argv[0]);
    if (status != napi_ok)
    {
        napi_close_handle_scope(env, scope);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create tunnel argument", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }
    status = napi_create_string_utf8(env, usages ? usages : "", NAPI_AUTO_LENGTH, &argv[1]);
    if (status != napi_ok)
    {
        napi_close_handle_scope(env, scope);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create usages argument", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }

    napi_value undefined;
    napi_get_undefined(env, &undefined);
    napi_value js_result;
    status = napi_call_function(env, undefined, callback, 2, argv, &js_result);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to call JavaScript callback", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        napi_close_handle_scope(env, scope);
        return;
    }
    PINGGY_DEBUG_RET(js_result);

    napi_close_handle_scope(env, scope);
}

napi_value TunnelSetUsageUpdateCallback(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 2)
    {
        napi_throw_error(env, NULL, "Expected tunnelRef and callback");
        return NULL;
    }

    uint32_t tunnelRef;
    napi_get_value_uint32(env, args[0], &tunnelRef);

    napi_valuetype cb_type;
    napi_typeof(env, args[1], &cb_type);
    if (cb_type != napi_function)
    {
        napi_throw_type_error(env, NULL, "Callback must be a function");
        return NULL;
    }

    CallbackData *cb_data = malloc(sizeof(CallbackData));
    if (cb_data == NULL)
    {
        napi_throw_error(env, NULL, "Failed to allocate callback data");
        return NULL;
    }
    cb_data->env = env;
    status = napi_create_reference(env, args[1], 1, &cb_data->callback_ref);
    if (status != napi_ok)
    {
        free(cb_data);
        napi_throw_error(env, NULL, "Failed to create reference");
        return NULL;
    }
    pinggy_bool_t result = pinggy_tunnel_set_on_usage_update_callback((pinggy_ref_t)tunnelRef, on_usage_update_cb, cb_data);
    if (!result)
    {
        napi_delete_reference(env, cb_data->callback_ref);
        free(cb_data);
        napi_throw_error(env, NULL, "Failed to set usage update callback");
        return NULL;
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

void on_reconnection_completed_cb(pinggy_void_p_t user_data, pinggy_ref_t tunnel_ref, pinggy_len_t num_urls, pinggy_char_p_p_t urls)
{
    CallbackData *cb_data = (CallbackData *)user_data;
    if (cb_data == NULL)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Callback data is NULL", __FILE__, __LINE__);
        napi_throw_error(NULL, NULL, error_message);
        return;
    }
    napi_env env = cb_data->env;
    if (env == NULL)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] N-API environment is NULL", __FILE__, __LINE__);
        napi_throw_error(NULL, NULL, error_message);
        return;
    }
    napi_handle_scope scope;
    napi_status status = napi_open_handle_scope(env, &scope);
    if (status != napi_ok)
    {
        return;
    }

    napi_value callback;
    status = napi_get_reference_value(env, cb_data->callback_ref, &callback);
    if (status != napi_ok)
    {
        napi_close_handle_scope(env, scope);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to get callback reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }

    napi_value argv[2];
    status = napi_create_uint32(env, (uint32_t)tunnel_ref, &argv[0]);
    if (status != napi_ok)
    {
        napi_close_handle_scope(env, scope);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create tunnel argument", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }

    napi_value arr;
    napi_create_array(env, &arr);
    for (int i = 0; i < num_urls; i++)
    {
        napi_value s;
        napi_create_string_utf8(env, urls[i] ? urls[i] : "", NAPI_AUTO_LENGTH, &s);
        napi_set_element(env, arr, i, s);
    }
    argv[1] = arr;

    napi_value undefined;
    napi_get_undefined(env, &undefined);
    napi_value js_result;
    status = napi_call_function(env, undefined, callback, 2, argv, &js_result);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to call JavaScript callback", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }
    PINGGY_DEBUG_RET(js_result);

    napi_close_handle_scope(env, scope);
}

napi_value TunnelSetReconnectionCompletedCallback(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    if (status != napi_ok || argc < 2)
    {
        napi_throw_error(env, NULL, "Expected tunnelRef and callback");
        return NULL;
    }

    uint32_t tunnelRef;
    napi_get_value_uint32(env, args[0], &tunnelRef);

    napi_valuetype cb_type;
    napi_typeof(env, args[1], &cb_type);
    if (cb_type != napi_function)
    {
        napi_throw_type_error(env, NULL, "Callback must be a function");
        return NULL;
    }

    CallbackData *cb_data = malloc(sizeof(CallbackData));
    if (cb_data == NULL)
    {
        napi_throw_error(env, NULL, "Failed to allocate callback data");
        return NULL;
    }
    cb_data->env = env;
    status = napi_create_reference(env, args[1], 1, &cb_data->callback_ref);
    if (status != napi_ok)
    {
        free(cb_data);
        napi_throw_error(env, NULL, "Failed to create reference");
        return NULL;
    }

    pinggy_bool_t result = pinggy_tunnel_set_on_reconnection_completed_callback((pinggy_ref_t)tunnelRef, on_reconnection_completed_cb, cb_data);
    if (!result)
    {
        napi_delete_reference(env, cb_data->callback_ref);
        free(cb_data);
        napi_throw_error(env, NULL, "Failed to set reconnection completed callback");
        return NULL;
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

void on_reconnection_failed_cb(pinggy_void_p_t user_data, pinggy_ref_t tunnel_ref, pinggy_uint16_t retry_cnt)
{
    napi_status status;
    CallbackData *cb_data = (CallbackData *)user_data;
    if (cb_data == NULL)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Callback data is NULL", __FILE__, __LINE__);
        napi_throw_error(NULL, NULL, error_message);
        return;
    }

    napi_env env = cb_data->env;
    if (env == NULL)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] N-API environment is NULL", __FILE__, __LINE__);
        napi_throw_error(NULL, NULL, error_message);
        return;
    }
    napi_handle_scope scope;
    status = napi_open_handle_scope(env, &scope);
    if (status != napi_ok)
        return;

    napi_value global;
    status = napi_get_global(env, &global);
    if (status != napi_ok)
    {
        napi_close_handle_scope(env, scope);
        return;
    }

    napi_value callback;
    status = napi_get_reference_value(env, cb_data->callback_ref, &callback);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to get callback reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }

    napi_value argv[2];
    status = napi_create_uint32(env, (uint32_t)tunnel_ref, &argv[0]);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create tunnel argument", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }
    status = napi_create_uint32(env, (uint32_t)retry_cnt, &argv[1]);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create retry count argument", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }

    napi_value undefined;
    napi_get_undefined(env, &undefined);
    napi_value js_result;
    status = napi_call_function(env, global, callback, 2, argv, &js_result);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to call JavaScript callback", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }
    PINGGY_DEBUG_RET(js_result);

    napi_close_handle_scope(env, scope);
}

napi_value TunnelSetReconnectionFailedCallback(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    if (status != napi_ok || argc < 2)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Wrong number of arguments", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    uint32_t tunnelRef;
    status = napi_get_value_uint32(env, args[0], &tunnelRef);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Invalid tunnel reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    napi_valuetype cb_type;
    napi_typeof(env, args[1], &cb_type);
    if (cb_type != napi_function)
    {
        napi_throw_type_error(env, NULL, "Callback must be a function");
        return NULL;
    }
    // store callback in a reference
    CallbackData *cb_data = malloc(sizeof(CallbackData));
    if (cb_data == NULL)
    {
        napi_throw_error(env, NULL, "Failed to allocate callback data");
        return NULL;
    }
    cb_data->env = env;
    status = napi_create_reference(env, args[1], 1, &cb_data->callback_ref);
    if (status != napi_ok)
    {
        free(cb_data);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Unable to create reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    pinggy_bool_t result = pinggy_tunnel_set_on_reconnection_failed_callback((pinggy_ref_t)tunnelRef, on_reconnection_failed_cb, cb_data);
    if (!result)
    {
        napi_delete_reference(env, cb_data->callback_ref);
        free(cb_data);
        napi_throw_error(env, NULL, "Failed to set reconnection failed callback");
        return NULL;
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

void on_will_reconnect_cb(pinggy_void_p_t user_data, pinggy_ref_t tunnel_ref, pinggy_const_char_p_t error, pinggy_len_t num_msgs, pinggy_char_p_p_t messages)
{
    CallbackData *cb_data = (CallbackData *)user_data;
    if (cb_data == NULL)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Callback data is NULL", __FILE__, __LINE__);
        napi_throw_error(NULL, NULL, error_message);
        return;
    }
    napi_env env = cb_data->env;
    napi_value js_callback, undefined, js_result;
    napi_status status;

    napi_handle_scope scope;
    napi_open_handle_scope(env, &scope);

    // Get the js callback function from the reference
    status = napi_get_reference_value(env, cb_data->callback_ref, &js_callback);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to get callback reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }
    // Get the tunnel reference as a JavaScript value
    napi_value argv[3];
    status = napi_create_uint32(env, (uint32_t)tunnel_ref, &argv[0]);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to create tunnel argument", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }
    napi_create_string_utf8(env, error ? error : "", NAPI_AUTO_LENGTH, &argv[1]);

    // Create array for messages
    napi_value msgs_array;
    napi_create_array(env, &msgs_array);
    for (pinggy_len_t i = 0; i < num_msgs; i++)
    {
        napi_value msg_str;
        napi_create_string_utf8(env, messages[i], NAPI_AUTO_LENGTH, &msg_str);
        napi_set_element(env, msgs_array, i, msg_str);
    }
    argv[2] = msgs_array;

    napi_get_undefined(env, &undefined);

    status = napi_call_function(env, undefined, js_callback, 3, argv, &js_result);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Failed to call JavaScript callback", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return;
    }
    PINGGY_DEBUG_RET(js_result);
    napi_close_handle_scope(env, scope);
}

napi_value TunnelSetWillReconnectCallback(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;
    // Extract arguments(tunnel reference & callback function)
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 2)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Wrong number of arguments", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    uint32_t tunnelRef;
    status = napi_get_value_uint32(env, args[0], &tunnelRef);
    if (status != napi_ok)
    {
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Invalid tunnel reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    napi_valuetype cb_type;
    napi_typeof(env, args[1], &cb_type);
    if (cb_type != napi_function)
    {
        napi_throw_type_error(env, NULL, "Callback must be a function");
        return NULL;
    }

    // store callback in a reference
    CallbackData *cb_data = malloc(sizeof(CallbackData));
    if (cb_data == NULL)
    {
        napi_throw_error(env, NULL, "Failed to allocate callback data");
        return NULL;
    }
    cb_data->env = env;
    status = napi_create_reference(env, args[1], 1, &cb_data->callback_ref);

    if (status != napi_ok)
    {
        free(cb_data);
        char error_message[256];
        snprintf(error_message, sizeof(error_message), "[%s:%d] Unable to create reference", __FILE__, __LINE__);
        napi_throw_error(env, NULL, error_message);
        return NULL;
    }

    pinggy_bool_t result = pinggy_tunnel_set_on_will_reconnect_callback(tunnelRef, on_will_reconnect_cb, cb_data);
    if (!result)
    {
        napi_delete_reference(env, cb_data->callback_ref);
        free(cb_data);
        napi_throw_error(env, NULL, "Failed to set will reconnect callback");
        return NULL;
    }
    napi_value js_result;
    napi_get_boolean(env, result, &js_result);
    return js_result;
}

// ================================= INITIALIZATION =================================

// Initialize the module and export the function
napi_value Init2(napi_env env, napi_value exports)
{
    napi_value
        tunnel_initiate_fn,
        tunnel_start_fn, tunnel_start_non_blocking_fn,
        tunnel_resume_fn, tunnel_stop_fn,
        tunnel_set_reverse_forwarding_done_callback_fn,
        tunnel_set_will_reconnect_callback_fn,
        tunnel_set_usage_update_callback_fn,
        tunnel_set_reconnection_completed_callback_fn,
        tunnel_set_reconnection_failed_callback_fn,
        tunnel_set_on_forwarding_changed_callback_fn,
        tunnel_connect_fn,
        tunnel_start_web_debugging_fn,
        tunnel_request_additional_forwarding_fn,
        tunnel_is_active_fn,
        tunnel_set_tunnel_failed_callback_fn,
        tunnel_set_established_callback_fn,
        tunnel_set_forwarding_changed_callback_fn,
        tunnel_set_additional_forwarding_succeeded_callback_fn,
        tunnel_set_additional_forwarding_failed_callback_fn,
        tunnel_set_on_disconnected_callback_fn,
        tunnel_set_on_tunnel_error_callback_fn,

        config_set_ssl_fn,
        tunnel_get_greet_message_fn,
        tunnel_start_usage_update_fn,
        tunnel_stop_usage_update_fn,
        tunnel_get_usages_fn,
        tunnel_resume_withtimeout_fn,
        tunnel_get_state_fn,
        tunnel_get_web_debugging_address_fn,
        tunnel_get_web_debugging_port_fn;

    napi_create_function(env, NULL, 0, TunnelInitiate, NULL, &tunnel_initiate_fn);
    napi_set_named_property(env, exports, "tunnelInitiate", tunnel_initiate_fn);

    napi_create_function(env, NULL, 0, TunnelStart, NULL, &tunnel_start_fn);
    napi_set_named_property(env, exports, "tunnelStart", tunnel_start_fn);

    napi_create_function(env, NULL, 0, TunnelStartNonBlocking, NULL, &tunnel_start_non_blocking_fn);
    napi_set_named_property(env, exports, "tunnelStartNonBlocking", tunnel_start_non_blocking_fn);

    napi_create_function(env, NULL, 0, TunnelResume, NULL, &tunnel_resume_fn);
    napi_set_named_property(env, exports, "tunnelResume", tunnel_resume_fn);

    napi_create_function(env, NULL, 0, TunnelResumeWithTimeout, NULL, &tunnel_resume_withtimeout_fn);
    napi_set_named_property(env, exports, "tunnelResumeWithTimeout", tunnel_resume_withtimeout_fn);

    napi_create_function(env, NULL, 0, TunnelStop, NULL, &tunnel_stop_fn);
    napi_set_named_property(env, exports, "tunnelStop", tunnel_stop_fn);

    napi_create_function(env, NULL, 0, TunnelStartWebDebugging, NULL, &tunnel_start_web_debugging_fn);
    napi_set_named_property(env, exports, "tunnelStartWebDebugging", tunnel_start_web_debugging_fn);

    napi_create_function(env, NULL, 0, TunnelIsActive, NULL, &tunnel_is_active_fn);
    napi_set_named_property(env, exports, "tunnelIsActive", tunnel_is_active_fn);

    napi_create_function(env, NULL, 0, GetTunnelState, NULL, &tunnel_get_state_fn);
    napi_set_named_property(env, exports, "getTunnelState", tunnel_get_state_fn);

    napi_create_function(env, NULL, 0, GetTunnelWebDebuggingAddress, NULL, &tunnel_get_web_debugging_address_fn);
    napi_set_named_property(env, exports, "getTunnelWebDebuggingAddress", tunnel_get_web_debugging_address_fn);

    napi_create_function(env, NULL, 0, GetTunnelWebDebuggingPort, NULL, &tunnel_get_web_debugging_port_fn);
    napi_set_named_property(env, exports, "getTunnelWebDebuggingPort", tunnel_get_web_debugging_port_fn);

    napi_create_function(env, NULL, 0, TunnelRequestAdditionalForwarding, NULL, &tunnel_request_additional_forwarding_fn);
    napi_set_named_property(env, exports, "tunnelRequestAdditionalForwarding", tunnel_request_additional_forwarding_fn);

    // Add the new function to exports
    napi_create_function(env, NULL, 0, SetOnTunnelFailedCallback, NULL, &tunnel_set_tunnel_failed_callback_fn);
    napi_set_named_property(env, exports, "tunnelSetOnTunnelFailedCallback", tunnel_set_tunnel_failed_callback_fn);

    napi_create_function(env, NULL, 0, SetOnTunnelEstablishedCallback, NULL, &tunnel_set_established_callback_fn);
    napi_set_named_property(env, exports, "tunnelSetEstablishedCallback", tunnel_set_established_callback_fn);

    napi_create_function(env, NULL, 0, SetOnTunnelForwardingChangedCallback, NULL, &tunnel_set_forwarding_changed_callback_fn);
    napi_set_named_property(env, exports, "tunnelSetOnTunnelForwardingChangedCallback", tunnel_set_forwarding_changed_callback_fn);

    napi_create_function(env, NULL, 0, SetAdditionalForwardingFailedCallback, NULL, &tunnel_set_additional_forwarding_failed_callback_fn);
    napi_set_named_property(env, exports, "tunnelSetAdditionalForwardingFailedCallback", tunnel_set_additional_forwarding_failed_callback_fn);

    napi_create_function(env, NULL, 0, SetAdditionalForwardingsucceededCallback, NULL, &tunnel_set_additional_forwarding_succeeded_callback_fn);
    napi_set_named_property(env, exports, "tunnelSetAdditionalForwardingsucceededCallback", tunnel_set_additional_forwarding_succeeded_callback_fn);

    napi_create_function(env, NULL, 0, TunnelSetWillReconnectCallback, NULL, &tunnel_set_will_reconnect_callback_fn);
    napi_set_named_property(env, exports, "tunnelSetOnWillReconnectCallback", tunnel_set_will_reconnect_callback_fn);

    napi_create_function(env, NULL, 0, TunnelSetReconnectionCompletedCallback, NULL, &tunnel_set_reconnection_completed_callback_fn);
    napi_set_named_property(env, exports, "tunnelSetOnReconnectionCompletedCallback", tunnel_set_reconnection_completed_callback_fn);

    napi_create_function(env, NULL, 0, TunnelSetReconnectionFailedCallback, NULL, &tunnel_set_reconnection_failed_callback_fn);
    napi_set_named_property(env, exports, "tunnelSetOnReconnectionFailedCallback", tunnel_set_reconnection_failed_callback_fn);

    napi_create_function(env, NULL, 0, TunnelSetUsageUpdateCallback, NULL, &tunnel_set_usage_update_callback_fn);
    napi_set_named_property(env, exports, "tunnelSetOnUsageUpdateCallback", tunnel_set_usage_update_callback_fn);

    napi_create_function(env, NULL, 0, SetForwardingChangedCallback, NULL, &tunnel_set_on_forwarding_changed_callback_fn);
    napi_set_named_property(env, exports, "tunnelSetOnForwardingChangedCallback", tunnel_set_on_forwarding_changed_callback_fn);

    napi_create_function(env, NULL, 0, TunnelSetDisconnectedCallback, NULL, &tunnel_set_on_disconnected_callback_fn);
    napi_set_named_property(env, exports, "tunnelSetOnDisconnectedCallback", tunnel_set_on_disconnected_callback_fn);

    napi_create_function(env, NULL, 0, TunnelSetErrorCallback, NULL, &tunnel_set_on_tunnel_error_callback_fn);
    napi_set_named_property(env, exports, "tunnelSetOnTunnelErrorCallback", tunnel_set_on_tunnel_error_callback_fn);

    napi_create_function(env, NULL, 0, ConfigSetSsl, NULL, &config_set_ssl_fn);
    napi_set_named_property(env, exports, "configSetSsl", config_set_ssl_fn);

    napi_create_function(env, NULL, 0, GetTunnelGreetMessage, NULL, &tunnel_get_greet_message_fn);
    napi_set_named_property(env, exports, "getTunnelGreetMessage", tunnel_get_greet_message_fn);

    napi_create_function(env, NULL, 0, startTunnelUsageUpdate, NULL, &tunnel_start_usage_update_fn);
    napi_set_named_property(env, exports, "startTunnelUsageUpdate", tunnel_start_usage_update_fn);

    napi_create_function(env, NULL, 0, stopTunnelUsageUpdate, NULL, &tunnel_stop_usage_update_fn);
    napi_set_named_property(env, exports, "stopTunnelUsageUpdate", tunnel_stop_usage_update_fn);

    napi_create_function(env, NULL, 0, GetTunnelUsages, NULL, &tunnel_get_usages_fn);
    napi_set_named_property(env, exports, "getTunnelUsages", tunnel_get_usages_fn);

    return exports;
}
