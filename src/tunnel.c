#include <node_api.h>
#include <stdlib.h>
#include <stdio.h>
#include "../pinggy.h"

// Wrapper for pinggy_tunnel_request_remote_forwarding
napi_value TunnelRequestRemoteForwarding(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_value result;

    // Parse arguments
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    // Validate the number of arguments
    if (argc < 1)
    {
        napi_throw_type_error(env, NULL, "Expected one argument (tunnel)");
        return NULL;
    }

    // Get the first argument: tunnel (uint32_t)
    uint32_t tunnel;
    napi_get_value_uint32(env, args[0], &tunnel);

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

    // Parse arguments
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    // Validate the number of arguments
    if (argc < 1)
    {
        napi_throw_type_error(env, NULL, "Expected one argument (tunnel)");
        return NULL;
    }

    // Get the first argument: tunnel (pinggy_ref_t)
    uint32_t tunnel;
    napi_get_value_uint32(env, args[0], &tunnel);

    // Call the pinggy_tunnel_start function
    pinggy_bool_t success = pinggy_tunnel_start(tunnel);

    // Return the boolean value (success) as a JavaScript boolean
    napi_get_boolean(env, success, &result);
    return result;
}

// Initialize the module and export the function
napi_value Init2(napi_env env, napi_value exports)
{
    napi_value request_remote_forwarding_fn, tunnel_initiate_fn, tunnel_start_fn;

    napi_create_function(env, NULL, 0, TunnelRequestRemoteForwarding, NULL, &request_remote_forwarding_fn);
    napi_set_named_property(env, exports, "tunnelRequestRemoteForwarding", request_remote_forwarding_fn);

    napi_create_function(env, NULL, 0, tunnelInitiate, NULL, &tunnel_initiate_fn);
    napi_set_named_property(env, exports, "tunnelInitiate", tunnel_initiate_fn);

    napi_create_function(env, NULL, 0, tunnelStart, NULL, &tunnel_start_fn);
    napi_set_named_property(env, exports, "tunnelStart", tunnel_start_fn);

    return exports;
}