#include <node_api.h>
#include <stdlib.h>
#include <stdio.h>
#include "../pinggy.h"
#include "debug.h"

// Binding for pinggy_set_log_path
napi_value SetLogPath(napi_env env, napi_callback_info info)
{
    // napi_env: the Node-API environment, it provides context in which the Node-Api call is invoked, it is used in almost all node-api function calls to maintain consistency and provide access to the JavaScript runtime.
    // napi_callback_info: This is an opaque pointer that contains information about the current function call. It allows the native fucntion to retrieve details about the javascript call, such as:
    // - the number and valus of arguments passed to the function
    // - the value of 'this' in the function
    // - any additional data associated with the callback
    // note: Opaque pointer is a pointer which points to a data structure whose contents are not exposed at the time of its definition.
    size_t argc = 1; // number of expected arguments
    napi_value args[1];
    napi_status status;
    napi_value result;

    // Parse the arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    // napi_status napi_get_cb_info(napi_env env,
    //                          napi_callback_info cbinfo,
    //                          size_t* argc,
    //                          napi_value* argv,
    //                          napi_value* this_arg,
    //                          void** data)
    // - env: the Node-API environment
    // - cbinfo: the callback passed into the callback function
    // - [in-out] argc: Specifies the length of the provided 'argv' array and receives the actual count of arguments. argc can optionally be ignored by passing NULL
    // - [out] argv: C array of napi_values to which the arguments will be copied. If there are more arguments then the provided count, only the requested no of arguments are copied. If there are fewer arguments provided than claimed, the rest of argv is filled with napi_value vales that represnt 'undefined'. 'argv' can also be optionally ignored.
    // - [out] this_arg: Receives the JavaScript 'this' argument for the call. Ignored in this case by passing NULL
    // - [out] data: Receives the data pointer for the callback. In this case ignore by passing NULL
    // Validating the arguments
    if (status != napi_ok || argc < 1)
    {
        napi_throw_error(env, NULL, "Expected one argument (log path string)");
        return NULL;
    }

    // Convert JavaScript string to C string
    size_t str_len;

    // napi_status napi_get_value_string_utf8(napi_env env,
    //                                    napi_value value,
    //                                    char* buf,
    //                                    size_t bufsize,
    //                                    size_t* result)
    // - [in] env: the Node-API environment
    // - [in] value: the JavaScript string to convert
    // - [in] buf: the buffer to store the converted string
    // - [in] bufsize: the size of the destination buffer. When this value is insufficient, the returned string is truncated and null-terminated.
    // - [out] result: Pointer to store the number of bytes copied
    status = napi_get_value_string_utf8(env, args[0], NULL, 0, &str_len);
    // if 'buf' is NULL, and 'bufsize' is 0, the function returns only the length of the string excluding the null terminator in `result`
    // if 'buf' is provided, it copies the string into the buffer
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to get string length");
        return NULL;
        // returns NULL if there is an error in getting the length
    }

    char *log_path = (char *)malloc(str_len + 1); // allocates memorey for the C string, including space for the null terminator.
    status = napi_get_value_string_utf8(env, args[0], log_path, str_len + 1, NULL);
    // args: the JavaScript string to convert
    // log_path: the pre-allocated buffer to store the converted string
    // str_len + 1: the size of the destination buffer (log_path)
    // NULL: the pointer to store the number of bytes copied, which we are not interested in here.
    if (status != napi_ok)
    {
        free(log_path);
        napi_throw_error(env, NULL, "Failed to get string value");
        return NULL;
    }

    // Call the library function
    pinggy_set_log_path(log_path);
    free(log_path);

    // Return undefined (as the function has no return value)
    napi_get_undefined(env, &result);
    return result;
}

napi_value SetLogEnable(napi_env env, napi_callback_info info)
{
    napi_status status;
    size_t argc = 1; // Expecting one argument
    napi_value args[1];

    // Retrieve arguments from JavaScript
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < 1)
    {
        napi_throw_error(env, NULL, "Expected one argument (boolean)");
        return NULL;
    }

    // Convert JavaScript boolean to C boolean (pinggy_bool_t)
    bool enable;
    status = napi_get_value_bool(env, args[0], &enable);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to convert argument to boolean");
        return NULL;
    }

    // Call the native function
    pinggy_set_log_enable(enable);

    // Return undefined (as the function has no return value)
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_create_config
// creates a new configuration object and returns a reference to it as a JavaScript number
napi_value CreateConfig(napi_env env, napi_callback_info info)
{
    // env: the Node-API environment
    // info: Structure containing information, including arguments. In this case it is not used as the function doesn't expect any arguments.

    napi_value result;
    // napi_value: a JavaScript value that will be returned to the calling JS code.
    pinggy_ref_t config_ref = pinggy_create_config();

    napi_create_uint32(env, config_ref, &result);
    // napi_status napi_create_uint32(napi_env env, uint32_t value, napi_value* result)
    // - [in] env: the Node-API environment
    // - [in] value: unsigned integer value to be represented in JS. 'config_ref' in this case
    // - [out] result: A napi_value representing a JS number
    // This API is used to convert from the C uint32_t type to the JS number type.
    return result;
}

// Wrapper for pinggy_config_set_server_address
napi_value ConfigSetServerAddress(napi_env env, napi_callback_info info)
{
    // env: the Node-API environment pointer
    // info: contains information about the function call including arguments

    size_t argc = 2;    // Number of expected arguments
    napi_value args[2]; // Array to store the JS arguments
    napi_value result;  // return value for JS

    // Parse arguments
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    // napi_status napi_get_cb_info(napi_env env,
    //                          napi_callback_info cbinfo,
    //                          size_t* argc,
    //                          napi_value* argv,
    //                          napi_value* thisArg,
    //                          void** data)
    // [in] env: the Node-API environment
    // [in] cbinfo: the callback info passed into the callback function
    // [in-out] argc: specifies the length of the provided 'argv' array and receives the actual count of arguments. argc can optionally be ignored by passing NULL
    // [out] argv: C array of napi_values to which the arguments will be copied. If there are more arguments then the provided count, only the requested no of arguments are copied. If there are fewer arguments provided than claimed, the rest of argv is filled with napi_value vales that represent 'undefined'. 'argv' can also be optionally ignored.

    // Validate the number of arguments
    if (argc < 2) // check the received number of arguments
    {
        napi_throw_type_error(env, NULL, "Expected two arguments (config, server_address)");
        return NULL;
    }

    // Get the first argument: config (uint32_t)
    uint32_t config;
    napi_get_value_uint32(env, args[0], &config);
    // napi_status napi_get_value_uint32(napi_env env,
    //                               napi_value value,
    //                               uint32_t* result)
    // [in] env: the Node-API environment
    // [in] value: the JavaScript number to convert
    // [out] result: C primitive equivalent of the given napi_value as a uint32_t

    // the conversion is needed because
    // - In JavaScript, all numbers (whether integer or floating-point) are represented as double-precision floating-point numbers.
    // - In C, we have distinct types for integers (int, uint32_t, etc.) and floating-point numbers (float, double).

    // Get the second argument: server_address (string)
    size_t str_len;
    napi_get_value_string_utf8(env, args[1], NULL, 0, &str_len);
    // returns only the length of the string excluding the null terminator in `result`

    char *server_address = (char *)malloc(str_len + 1); // Allocate memory for the C string
    napi_get_value_string_utf8(env, args[1], server_address, str_len + 1, NULL);
    // copies the string into the buffer

    // Call the pinggy_config_set_server_address function
    pinggy_config_set_server_address(config, server_address);

    // Free allocated memory
    free(server_address);

    // Return undefined (as the function has no return value)
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_set_sni_server_name
napi_value ConfigSetSniServerName(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_value result;

    // Parse arguments
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    // Validate the number of arguments
    if (argc < 2)
    {
        napi_throw_type_error(env, NULL, "Expected two arguments (config, sni_server_name)");
        return NULL;
    }

    // Get the first argument: config (uint32_t)
    uint32_t config;
    napi_get_value_uint32(env, args[0], &config);
    // convert the JS number(which of double tyep) to C uint32_t

    // Get the second argument: sni_server_name (string)
    size_t str_read;
    char sni_server_name[512]; // Buffer for the SNI server name
    napi_get_value_string_utf8(env, args[1], sni_server_name, sizeof(sni_server_name), &str_read);
    // convert the JS string to C string

    // Call the pinggy_config_set_sni_server_name function
    pinggy_config_set_sni_server_name(config, sni_server_name);

    // Return undefined (void return type in C)
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_set_advanced_parsing
napi_value ConfigSetAdvancedParsing(napi_env env, napi_callback_info info)
{
    size_t argc = 2;    // two arguments expected
    napi_value args[2]; // array to store the arguments
    napi_value result;  // return value to JS

    // Parse arguments
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    // napi_status napi_get_cb_info(napi_env env,
    //                          napi_callback_info cbinfo,
    //                          size_t* argc,
    //                          napi_value* argv,
    //                          napi_value* this_arg,
    //                          void** data)
    // [in] env: the Node-API environment
    // [in] cbinfo: the callback info passed into the callback function
    // [in-out] argc: specifies number of expected parameters and recieves the actual count of arguments. argc can optionally be ignored by passing NULL
    // [out] argv: C array of napi_values to which the arguments will be copied. If there are more arguments than the provided count, only the requested no of arguments are copied. If ther are fewer arguments provided than claimed, the rest of argv is filled with napi_value values that represent 'undefined'. 'argv' can also be optionally ignored.
    // [out] NULL: thisArg, the JavaScript 'this' argument for the call. Ignored in this case by passing NULL
    // [out] NULL: the pointer to store the number of bytes copied, which we are not interested in here.

    // Validate the number of arguments
    if (argc < 2)
    {
        napi_throw_type_error(env, NULL, "Expected two arguments (config, advanced_parsing)");
        return NULL;
    }

    // Get the first argument: config (uint32_t)
    uint32_t config;
    napi_get_value_uint32(env, args[0], &config);
    // convert the JS number(which of double type) to C uint32_t

    // Get the second argument: advanced_parsing (boolean)
    bool advanced_parsing;
    napi_get_value_bool(env, args[1], &advanced_parsing);
    // convert the JS boolean to C bool

    // Call the pinggy_config_set_advanced_parsing function
    pinggy_config_set_advanced_parsing(config, advanced_parsing);

    // Return undefined (void return type in C)
    napi_get_undefined(env, &result);
    return result;
}

napi_value ConfigSetToken(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
        return NULL;
    }

    // Validate the number of arguments
    if (argc < 2)
    {
        napi_throw_type_error(env, NULL, "Expected two arguments (config, token)");
        return NULL;
    }

    // Get the first argument: config (uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid config argument");
        return NULL;
    }

    // Get the second argument: token (string)
    size_t token_length;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &token_length);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid token argument");
        return NULL;
    }

    pinggy_char_p_t token = malloc(token_length + 1);
    if (token == NULL)
    {
        napi_throw_error(env, NULL, "Memory allocation failed");
        return NULL;
    }

    status = napi_get_value_string_utf8(env, args[1], token, token_length + 1, &token_length);
    if (status != napi_ok)
    {
        free(token);
        napi_throw_type_error(env, NULL, "Failed to get token string");
        return NULL;
    }

    // Call the pinggy_config_set_token function
    pinggy_config_set_token(config, token);

    free(token);

    // Return undefined
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Set the tunnel type. the value must be among `tcp`, `http` or `tls`
napi_value ConfigSetType(napi_env env, napi_callback_info info)
{
    // Declare variables to hold our function arguments
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Step 1: Retrieve the function arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
        return NULL;
    }

    // Step 2: Check if we received the correct number of arguments
    if (argc < 2)
    {
        napi_throw_type_error(env, NULL, "Wrong number of arguments. Expected 2 (config, type)");
        return NULL;
    }

    // Step 3: Extract the first argument (config) as a uint32
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid config argument");
        return NULL;
    }

    // Step 4: Extract the second argument (type) as a string
    size_t type_length;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &type_length);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid type argument");
        return NULL;
    }

    // Step 5: Allocate memory for the type string
    pinggy_char_p_t type = malloc(type_length + 1);
    if (type == NULL)
    {
        napi_throw_error(env, NULL, "Memory allocation failed");
        return NULL;
    }

    // Step 6: Copy the type string from the JavaScript value
    status = napi_get_value_string_utf8(env, args[1], type, type_length + 1, &type_length);
    if (status != napi_ok)
    {
        free(type);
        napi_throw_type_error(env, NULL, "Failed to get type string");
        return NULL;
    }

    // Step 7: Call the Pinggy SDK function
    pinggy_config_set_type(config, type);

    // Step 8: Free the allocated memory
    free(type);

    // Step 9: Return undefined (as the C function returns void)
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Set the tunnel udp type
napi_value ConfigSetUdpType(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
        return NULL;
    }

    // Validate the number of arguments
    if (argc < 2)
    {
        napi_throw_type_error(env, NULL, "Expected two arguments (config, udp_type)");
        return NULL;
    }

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid config argument");
        return NULL;
    }

    // Get the second argument: udp_type (string)
    size_t udp_type_length;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &udp_type_length);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid udp_type argument");
        return NULL;
    }

    pinggy_char_p_t udp_type = malloc(udp_type_length + 1);
    if (udp_type == NULL)
    {
        napi_throw_error(env, NULL, "Memory allocation failed");
        return NULL;
    }

    status = napi_get_value_string_utf8(env, args[1], udp_type, udp_type_length + 1, &udp_type_length);
    if (status != napi_ok)
    {
        free(udp_type);
        napi_throw_type_error(env, NULL, "Failed to get udp_type string");
        return NULL;
    }

    // Call the pinggy_config_set_udp_type function
    pinggy_config_set_udp_type(config, udp_type);

    // Free allocated memory
    free(udp_type);

    // Return undefined (as the C function returns void)
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

napi_value ConfigSetTcpForwardTo(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
        return NULL;
    }

    // Validate the number of arguments
    if (argc < 2)
    {
        napi_throw_type_error(env, NULL, "Expected two arguments (config, tcp_forward_to)");
        return NULL;
    }

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid config argument");
        return NULL;
    }

    // Get the second argument: tcp_forward_to (string)
    size_t tcp_forward_to_length;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &tcp_forward_to_length);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid tcp_forward_to argument");
        return NULL;
    }

    pinggy_char_p_t tcp_forward_to = malloc(tcp_forward_to_length + 1);
    if (tcp_forward_to == NULL)
    {
        napi_throw_error(env, NULL, "Memory allocation failed");
        return NULL;
    }

    status = napi_get_value_string_utf8(env, args[1], tcp_forward_to, tcp_forward_to_length + 1, &tcp_forward_to_length);
    if (status != napi_ok)
    {
        free(tcp_forward_to);
        napi_throw_type_error(env, NULL, "Failed to get tcp_forward_to string");
        return NULL;
    }

    // Call the pinggy_config_set_tcp_forward_to function
    pinggy_config_set_tcp_forward_to(config, tcp_forward_to);

    // Free allocated memory
    free(tcp_forward_to);

    // Return undefined (as the C function returns void)
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

napi_value ConfigSetUdpForwardTo(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
        return NULL;
    }

    // Validate the number of arguments
    if (argc < 2)
    {
        napi_throw_type_error(env, NULL, "Expected two arguments (config, udp_forward_to)");
        return NULL;
    }

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid config argument");
        return NULL;
    }

    // Get the second argument: udp_forward_to (string)
    size_t udp_forward_to_length;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &udp_forward_to_length);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid udp_forward_to argument");
        return NULL;
    }

    pinggy_char_p_t udp_forward_to = malloc(udp_forward_to_length + 1);
    if (udp_forward_to == NULL)
    {
        napi_throw_error(env, NULL, "Memory allocation failed");
        return NULL;
    }

    status = napi_get_value_string_utf8(env, args[1], udp_forward_to, udp_forward_to_length + 1, &udp_forward_to_length);
    if (status != napi_ok)
    {
        free(udp_forward_to);
        napi_throw_type_error(env, NULL, "Failed to get udp_forward_to string");
        return NULL;
    }

    // Call the pinggy_config_set_udp_forward_to function
    pinggy_config_set_udp_forward_to(config, udp_forward_to);

    // Free allocated memory
    free(udp_forward_to);

    // Return undefined (as the C function returns void)
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

napi_value ConfigSetForce(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
        return NULL;
    }

    // Validate the number of arguments
    if (argc < 2)
    {
        napi_throw_type_error(env, NULL, "Expected two arguments (config, force)");
        return NULL;
    }

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid config argument");
        return NULL;
    }

    // Get the second argument: force (pinggy_bool_t / uint8_t)
    bool force;
    status = napi_get_value_bool(env, args[1], &force);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid force argument");
        return NULL;
    }

    // Call the pinggy_config_set_force function
    pinggy_config_set_force(config, (pinggy_bool_t)force);

    // Return undefined (as the C function returns void)
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

napi_value ConfigSetArgument(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
        return NULL;
    }

    // Validate the number of arguments
    if (argc < 2)
    {
        napi_throw_type_error(env, NULL, "Expected two arguments (config, argument)");
        return NULL;
    }

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid config argument");
        return NULL;
    }

    // Get the second argument: argument (string)
    size_t argument_length;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &argument_length);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid argument");
        return NULL;
    }

    // Allocate memory for the argument string
    pinggy_char_p_t argument = malloc(argument_length + 1);
    if (argument == NULL)
    {
        napi_throw_error(env, NULL, "Memory allocation failed");
        return NULL;
    }

    status = napi_get_value_string_utf8(env, args[1], argument, argument_length + 1, &argument_length);
    if (status != napi_ok)
    {
        free(argument);
        napi_throw_type_error(env, NULL, "Failed to get argument string");
        return NULL;
    }

    // Call the pinggy_config_set_argument function
    pinggy_config_set_argument(config, argument);

    // Free allocated memory
    free(argument);

    // Return undefined (as the C function returns void)
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

napi_value ConfigSetSSL(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
        return NULL;
    }

    // Validate the number of arguments
    if (argc < 2)
    {
        napi_throw_type_error(env, NULL, "Expected two arguments (config, ssl)");
        return NULL;
    }

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid config argument");
        return NULL;
    }

    // Get the second argument: ssl (pinggy_bool_t / uint8_t)
    bool ssl;
    status = napi_get_value_bool(env, args[1], &ssl);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid ssl argument");
        return NULL;
    }

    // Call the pinggy_config_set_ssl function
    pinggy_config_set_ssl(config, (pinggy_bool_t)ssl);

    // Return undefined (since the function returns void)
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

napi_value ConfigSetInsecure(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
        return NULL;
    }

    // Validate the number of arguments
    if (argc < 2)
    {
        napi_throw_type_error(env, NULL, "Expected two arguments (config, insecure)");
        return NULL;
    }

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid config argument");
        return NULL;
    }

    // Get the second argument: insecure (pinggy_bool_t / uint8_t)
    bool insecure;
    status = napi_get_value_bool(env, args[1], &insecure);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid insecure argument");
        return NULL;
    }

    // Call the pinggy_config_set_insecure function
    pinggy_config_set_insecure(config, (pinggy_bool_t)insecure);

    // Return undefined (since the function returns void)
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_get_server_address
napi_value ConfigGetServerAddress(napi_env env, napi_callback_info info)
{
    // env: the Node-API environment pointer
    // info: contains information about the function call including arguments

    size_t argc = 1;    // Number of expected arguments
    napi_value args[1]; // Array to store the JS arguments (passed to cb_info function)
    napi_value result;  // return value for JS

    // Parse arguments
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    // napi_status napi_get_cb_info(napi_env env,
    //                          napi_callback_info cbinfo,
    //                          size_t* argc,
    //                          napi_value* argv,
    //                          napi_value* thisArg,
    //                          void** data)
    // [in] env: the Node-API environment
    // [in] cbinfo: the callback info passed into the callback function
    // [in-out] argc: specifies number of expected parameters and receives the actual count of arguments. argc can optionally be ignored by passing NULL

    // Validate the number of arguments
    if (argc < 1) // check the received number of arguments
    {
        napi_throw_type_error(env, NULL, "Expected one argument (config)");
        return NULL;
    }

    // Get the first argument: config (uint32_t)
    uint32_t config;
    napi_get_value_uint32(env, args[0], &config);
    // napi_status napi_get_value_uint32(napi_env env,
    //                               napi_value value,
    //                               uint32_t* result)
    // [in] env: the Node-API environment
    // [in] value: the JavaScript number to convert, received as the first argument
    // [out] result: C primitive equivalent of the given napi_value as a uint32_t, since JS numbers are to double type

    // Allocate buffer for the server address
    pinggy_capa_t buffer_len = 512; // Example buffer length
    char buffer[512];               // Fixed-size character array for simplicity

    // Call the pinggy_config_get_server_address function
    int copied_len = pinggy_config_get_server_address(config, buffer_len, buffer);
    // get the length from the JS function preferabbly as a parameter

    // Handle errors (if the copied length is negative, assuming it indicates an error)
    if (copied_len < 0)
    {
        napi_throw_error(env, NULL, "Failed to get server address");
        return NULL;
    }

    // Convert the buffer to a JavaScript string
    napi_create_string_utf8(env, buffer, copied_len, &result);
    // napi_status napi_create_string_utf8(napi_env env,
    //                                  const char* str,
    //                                  size_t length,
    //                                  napi_value* result)
    // [in] env: the Node-API environment
    // [in] str: Character buffer representing a UTF-8 encoded string
    // [in] length: the length of the string in bytes, or NAPI_AUTO_LENGTH if the string is null-terminated
    // [out] result: the JavaScript string value
    return result;
}

// Wrapper for pinggy_config_get_sni_server_name
napi_value ConfigGetSniServerName(napi_env env, napi_callback_info info)
{
    // env: the Node-API environment pointer
    // info: contains information about the function call including arguments

    size_t argc = 1;    // Number of expected arguments
    napi_value args[1]; // Array to store the JS arguments (passed to cb_info function)
    napi_value result;  // return value for JS

    // Parse arguments
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    // [in] env: the Node-api environment
    // [in] info: the callback info passed into the callback function
    // [in-out] argc: specifies number of expected parameters and recieves the actual count of arguments. argc can optionally be ignored by passing NULL
    // [out] args: C array of napi_values to which the arguments will be copied. If there are more arguments than the provided count, only the requested no of arguments are copied. If ther are fewer arguments provided than claimed, the rest of args is filled with napi_value values that represent 'undefined'. 'args' can also be optionally ignored.
    // [out] NULL: thisArg, the JavaScript 'this' argument for the call. Ignored in this case by passing NULL
    // [out] NULL: the pointer to store the number of bytes copied, which we are not interested in here.

    // Validate the number of arguments
    if (argc < 1)
    {
        napi_throw_type_error(env, NULL, "Expected one argument (config)");
        return NULL;
    }

    // Get the first argument: config (uint32_t)
    uint32_t config;
    napi_get_value_uint32(env, args[0], &config);

    // Allocate buffer for the SNI server name
    pinggy_capa_t buffer_len = 512; // Example buffer length
    char buffer[512];               // Fixed-size character array for simplicity

    // Call the pinggy_config_get_sni_server_name function
    int copied_len = pinggy_config_get_sni_server_name(config, buffer_len, buffer);

    // Handle errors (if the copied length is negative, assuming it indicates an error)
    if (copied_len < 0)
    {
        napi_throw_error(env, NULL, "Failed to get SNI server name");
        return NULL;
    }

    // Convert the buffer to a JavaScript string
    napi_create_string_utf8(env, buffer, copied_len, &result);
    return result;
}

// Wrapper for pinggy_config_get_advanced_parsing
napi_value ConfigGetAdvancedParsing(napi_env env, napi_callback_info info)
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

    // Get the first argument: config (uint32_t)
    uint32_t config;
    napi_get_value_uint32(env, args[0], &config);

    // Call the pinggy_config_get_advanced_parsing function
    pinggy_bool_t advanced_parsing = pinggy_config_get_advanced_parsing(config);

    // Return the boolean value (advanced_parsing) as a JavaScript boolean
    napi_get_boolean(env, advanced_parsing, &result);
    return result;
}

napi_value ConfigGetToken(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
        return NULL;
    }

    // Validate the number of arguments
    if (argc < 2)
    {
        napi_throw_type_error(env, NULL, "Expected two arguments (config, buffer_len)");
        return NULL;
    }

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid config argument");
        return NULL;
    }

    // Get the second argument: buffer_len (pinggy_capa_t / uint32_t)
    pinggy_capa_t buffer_len;
    status = napi_get_value_uint32(env, args[1], &buffer_len);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid buffer_len argument");
        return NULL;
    }

    // Allocate buffer for token
    char *buffer = malloc(buffer_len);
    if (buffer == NULL)
    {
        napi_throw_error(env, NULL, "Memory allocation failed");
        return NULL;
    }

    // Call the function
    pinggy_const_int_t token_length = pinggy_config_get_token(config, buffer_len, buffer);

    // Convert token to a JavaScript string
    napi_value token_string;
    status = napi_create_string_utf8(env, buffer, token_length, &token_string);

    // Free allocated memory
    free(buffer);

    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to create return string");
        return NULL;
    }

    return token_string;
}

napi_value ConfigGetType(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
        return NULL;
    }

    // Validate the number of arguments
    if (argc < 2)
    {
        napi_throw_type_error(env, NULL, "Expected two arguments (config, buffer_len)");
        return NULL;
    }

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid config argument");
        return NULL;
    }

    // Get the second argument: buffer_len (pinggy_capa_t / uint32_t)
    pinggy_capa_t buffer_len;
    status = napi_get_value_uint32(env, args[1], &buffer_len);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid buffer_len argument");
        return NULL;
    }

    // Allocate buffer for type
    char *buffer = malloc(buffer_len);
    if (buffer == NULL)
    {
        napi_throw_error(env, NULL, "Memory allocation failed");
        return NULL;
    }

    // Call the function
    pinggy_const_int_t type_length = pinggy_config_get_type(config, buffer_len, buffer);

    // Convert type to a JavaScript string
    napi_value type_string;
    status = napi_create_string_utf8(env, buffer, type_length, &type_string);

    // Free allocated memory
    free(buffer);

    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to create return string");
        return NULL;
    }

    return type_string;
}

napi_value ConfigGetUdpType(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
        return NULL;
    }

    // Validate the number of arguments
    if (argc < 1)
    {
        napi_throw_type_error(env, NULL, "Expected one argument (config)");
        return NULL;
    }

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid config argument");
        return NULL;
    }

    // Create a buffer to hold the udp type
    size_t buffer_len = 256; // Or a size you expect the string to fit in
    pinggy_char_p_t udp_type = malloc(buffer_len);
    if (udp_type == NULL)
    {
        napi_throw_error(env, NULL, "Memory allocation failed");
        return NULL;
    }

    // Call the pinggy function to get the udp type
    pinggy_const_int_t copied_length = pinggy_config_get_udp_type(config, buffer_len, udp_type);

    // Return the udp type as a JavaScript string
    napi_value result;
    status = napi_create_string_utf8(env, udp_type, copied_length, &result);
    if (status != napi_ok)
    {
        free(udp_type);
        napi_throw_error(env, NULL, "Failed to create string from UDP type");
        return NULL;
    }

    // Free the allocated memory for udp_type
    free(udp_type);

    return result;
}

napi_value ConfigGetTcpForwardTo(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
        return NULL;
    }

    // Validate the number of arguments
    if (argc < 1)
    {
        napi_throw_type_error(env, NULL, "Expected one argument (config)");
        return NULL;
    }

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid config argument");
        return NULL;
    }

    // Create a buffer to hold the TCP forwarding address
    size_t buffer_len = 256; // Or a size you expect the string to fit in
    pinggy_char_p_t tcp_forward_to = malloc(buffer_len);
    if (tcp_forward_to == NULL)
    {
        napi_throw_error(env, NULL, "Memory allocation failed");
        return NULL;
    }

    // Call the pinggy function to get the TCP forwarding address
    pinggy_const_int_t copied_length = pinggy_config_get_tcp_forward_to(config, buffer_len, tcp_forward_to);

    // Return the TCP forwarding address as a JavaScript string
    napi_value result;
    status = napi_create_string_utf8(env, tcp_forward_to, copied_length, &result);
    if (status != napi_ok)
    {
        free(tcp_forward_to);
        napi_throw_error(env, NULL, "Failed to create string from TCP forwarding address");
        return NULL;
    }

    // Free the allocated memory for tcp_forward_to
    free(tcp_forward_to);

    return result;
}

napi_value ConfigGetUdpForwardTo(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
        return NULL;
    }

    // Validate the number of arguments
    if (argc < 1)
    {
        napi_throw_type_error(env, NULL, "Expected one argument (config)");
        return NULL;
    }

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid config argument");
        return NULL;
    }

    // Create a buffer to hold the UDP forwarding address
    size_t buffer_len = 256; // Or any length you expect the string to fit in
    pinggy_char_p_t udp_forward_to = malloc(buffer_len);
    if (udp_forward_to == NULL)
    {
        napi_throw_error(env, NULL, "Memory allocation failed");
        return NULL;
    }

    // Call the pinggy function to get the UDP forwarding address
    pinggy_const_int_t copied_length = pinggy_config_get_udp_forward_to(config, buffer_len, udp_forward_to);

    // Return the UDP forwarding address as a JavaScript string
    napi_value result;
    status = napi_create_string_utf8(env, udp_forward_to, copied_length, &result);
    if (status != napi_ok)
    {
        free(udp_forward_to);
        napi_throw_error(env, NULL, "Failed to create string from UDP forwarding address");
        return NULL;
    }

    // Free the allocated memory for udp_forward_to
    free(udp_forward_to);

    return result;
}

napi_value ConfigGetForce(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
        return NULL;
    }

    // Validate the number of arguments
    if (argc < 1)
    {
        napi_throw_type_error(env, NULL, "Expected one argument (config)");
        return NULL;
    }

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid config argument");
        return NULL;
    }

    // Call the pinggy function to get the force status
    pinggy_const_bool_t force = pinggy_config_get_force(config);

    // Return the force status as a JavaScript boolean
    napi_value result;
    status = napi_get_boolean(env, force, &result);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to create boolean from force status");
        return NULL;
    }

    return result;
}

napi_value ConfigGetArgument(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
        return NULL;
    }

    // Validate the number of arguments
    if (argc < 1)
    {
        napi_throw_type_error(env, NULL, "Expected one argument (config)");
        return NULL;
    }

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid config argument");
        return NULL;
    }

    // Determine buffer size (assuming a reasonable buffer length for now)
    pinggy_capa_t buffer_len = 1024; // You can make this dynamic based on your use case

    // Allocate buffer
    pinggy_char_p_t buffer = malloc(buffer_len);
    if (buffer == NULL)
    {
        napi_throw_error(env, NULL, "Memory allocation failed");
        return NULL;
    }

    // Call the pinggy function to get the argument
    pinggy_const_int_t length = pinggy_config_get_argument(config, buffer_len, buffer);

    // If length is 0, return undefined as no argument was retrieved
    if (length == 0)
    {
        free(buffer);
        napi_value result;
        napi_get_undefined(env, &result);
        return result;
    }

    // Create JavaScript string from the buffer
    napi_value result;
    status = napi_create_string_utf8(env, buffer, length, &result);
    free(buffer); // Free buffer after usage
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to create string from argument");
        return NULL;
    }

    return result;
}

napi_value ConfigGetSsl(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
        return NULL;
    }

    // Validate the number of arguments
    if (argc < 1)
    {
        napi_throw_type_error(env, NULL, "Expected one argument (config)");
        return NULL;
    }

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid config argument");
        return NULL;
    }

    // Call the pinggy_config_get_ssl function
    pinggy_bool_t ssl_enabled = pinggy_config_get_ssl(config);

    // Return the boolean value (ssl_enabled) as a JavaScript boolean
    napi_value result;
    napi_get_boolean(env, ssl_enabled, &result);
    return result;
}

napi_value ConfigGetInsecure(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
        return NULL;
    }

    // Validate the number of arguments
    if (argc < 1)
    {
        napi_throw_type_error(env, NULL, "Expected one argument (config)");
        return NULL;
    }

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    if (status != napi_ok)
    {
        napi_throw_type_error(env, NULL, "Invalid config argument");
        return NULL;
    }

    // Call the pinggy_config_get_insecure function
    pinggy_bool_t insecure_enabled = pinggy_config_get_insecure(config);

    // Return the boolean value (insecure_enabled) as a JavaScript boolean
    napi_value result;
    napi_get_boolean(env, insecure_enabled, &result);
    return result;
}

// Initialize the module and export the function
napi_value Init1(napi_env env, napi_value exports)
{
    napi_value create_config_fn;

    napi_value set_log_path_fn,
        set_log_enable_fn,
        set_server_address_fn,
        set_sni_server_name_fn,
        set_advanced_parsing_fn,
        set_token_fn,
        set_type_fn,
        set_force_fn,
        set_argument_fn,
        set_ssl_fn,
        set_udp_type_fn,
        set_tcp_forward_to_fn,
        set_udp_forward_to_fn,
        set_insecure_fn;

    napi_value get_server_address_fn,
        get_sni_server_name_fn,
        get_advanced_parsing_fn,
        get_token_fn,
        get_type_fn,
        get_udp_type_fn,
        get_tcp_forward_to_fn,
        get_udp_forward_to_fn,
        get_force_fn,
        get_argument_fn,
        get_ssl_fn,
        get_insecure_fn;

    napi_create_function(env, NULL, 0, SetLogPath, NULL, &set_log_path_fn);
    // napi_create_function(napi_env env,
    //                              const char* utf8name,
    //                              size_t length,
    //                              napi_callback cb,
    //                              void* data,
    //                              napi_value* result);
    // - [in] env: the Node-API environment
    // - [in] utf8name: Optional name of the function encoded as UTF8. This is visible within JavaScript as the new function object's name property.
    // - [in] length: Length of the utf8name string. Pass 0 if utf8name is NULL.
    // - [in] cb: The C function to be called when this function is invoked in JavaScript.
    // - [in] data: User-provided data context. This will be passed back into the function when invoked later.
    // - [out] result: The new function object.

    napi_set_named_property(env, exports, "setLogPath", set_log_path_fn);
    // napi_status napi_set_named_property(napi_env env,
    //                                  napi_value object,
    //                                  const char* utf8name,
    //                                  napi_value value)
    // - [in] env: the Node-API environment
    // - [in] object: the object to which the property is to be added
    // - [in] utf8name: the name of the property to add
    // - [in] value: the value of the property to add

    napi_create_function(env, NULL, 0, SetLogEnable, NULL, &set_log_enable_fn);
    napi_set_named_property(env, exports, "setLogEnable", set_log_enable_fn);

    napi_create_function(env, NULL, 0, CreateConfig, NULL, &create_config_fn);
    napi_set_named_property(env, exports, "createConfig", create_config_fn);

    napi_create_function(env, NULL, 0, ConfigSetServerAddress, NULL, &set_server_address_fn);
    napi_set_named_property(env, exports, "configSetServerAddress", set_server_address_fn);

    napi_create_function(env, NULL, 0, ConfigGetServerAddress, NULL, &get_server_address_fn);
    napi_set_named_property(env, exports, "configGetServerAddress", get_server_address_fn);

    napi_create_function(env, NULL, 0, ConfigGetSniServerName, NULL, &get_sni_server_name_fn);
    napi_set_named_property(env, exports, "configGetSniServerName", get_sni_server_name_fn);

    napi_create_function(env, NULL, 0, ConfigSetSniServerName, NULL, &set_sni_server_name_fn);
    napi_set_named_property(env, exports, "configSetSniServerName", set_sni_server_name_fn);

    napi_create_function(env, NULL, 0, ConfigSetAdvancedParsing, NULL, &set_advanced_parsing_fn);
    napi_set_named_property(env, exports, "configSetAdvancedParsing", set_advanced_parsing_fn);

    napi_create_function(env, NULL, 0, ConfigGetAdvancedParsing, NULL, &get_advanced_parsing_fn);
    napi_set_named_property(env, exports, "configGetAdvancedParsing", get_advanced_parsing_fn);

    napi_create_function(env, NULL, 0, ConfigSetToken, NULL, &set_token_fn);
    napi_set_named_property(env, exports, "configSetToken", set_token_fn);

    napi_create_function(env, NULL, 0, ConfigSetType, NULL, &set_type_fn);
    napi_set_named_property(env, exports, "configSetType", set_type_fn);

    napi_create_function(env, NULL, 0, ConfigGetUdpType, NULL, &get_udp_type_fn);
    napi_set_named_property(env, exports, "configGetUdpType", get_udp_type_fn);

    napi_create_function(env, NULL, 0, ConfigGetTcpForwardTo, NULL, &get_tcp_forward_to_fn);
    napi_set_named_property(env, exports, "configGetTcpForwardTo", get_tcp_forward_to_fn);

    napi_create_function(env, NULL, 0, ConfigGetUdpForwardTo, NULL, &get_udp_forward_to_fn);
    napi_set_named_property(env, exports, "configGetUdpForwardTo", get_udp_forward_to_fn);

    napi_create_function(env, NULL, 0, ConfigSetForce, NULL, &set_force_fn);
    napi_set_named_property(env, exports, "configSetForce", set_force_fn);

    napi_create_function(env, NULL, 0, ConfigGetForce, NULL, &get_force_fn);
    napi_set_named_property(env, exports, "configGetForce", get_force_fn);

    napi_create_function(env, NULL, 0, ConfigSetArgument, NULL, &set_argument_fn);
    napi_set_named_property(env, exports, "configSetArgument", set_argument_fn);

    napi_create_function(env, NULL, 0, ConfigGetArgument, NULL, &get_argument_fn);
    napi_set_named_property(env, exports, "configGetArgument", get_argument_fn);

    napi_create_function(env, NULL, 0, ConfigSetSSL, NULL, &set_ssl_fn);
    napi_set_named_property(env, exports, "configSetSSL", set_ssl_fn);

    napi_create_function(env, NULL, 0, ConfigSetUdpType, NULL, &set_udp_type_fn);
    napi_set_named_property(env, exports, "configSetUdpType", set_udp_type_fn);

    napi_create_function(env, NULL, 0, ConfigSetTcpForwardTo, NULL, &set_tcp_forward_to_fn);
    napi_set_named_property(env, exports, "configSetTcpForwardTo", set_tcp_forward_to_fn);

    napi_create_function(env, NULL, 0, ConfigSetUdpForwardTo, NULL, &set_udp_forward_to_fn);
    napi_set_named_property(env, exports, "configSetUdpForwardTo", set_udp_forward_to_fn);

    napi_create_function(env, NULL, 0, ConfigSetInsecure, NULL, &set_insecure_fn);
    napi_set_named_property(env, exports, "configSetInsecure", set_insecure_fn);

    napi_create_function(env, NULL, 0, ConfigGetToken, NULL, &get_token_fn);
    napi_set_named_property(env, exports, "configGetToken", get_token_fn);

    napi_create_function(env, NULL, 0, ConfigGetType, NULL, &get_type_fn);
    napi_set_named_property(env, exports, "configGetType", get_type_fn);

    napi_create_function(env, NULL, 0, ConfigGetSsl, NULL, &get_ssl_fn);
    napi_set_named_property(env, exports, "configGetSsl", get_ssl_fn);

    napi_create_function(env, NULL, 0, ConfigGetInsecure, NULL, &get_insecure_fn);
    napi_set_named_property(env, exports, "configGetInsecure", get_insecure_fn);

    return exports;
}
