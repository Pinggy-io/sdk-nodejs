#include <node_api.h>
#include <stdlib.h>
#include <stdio.h>
#include "../pinggy.h"
#include "debug.h"
#include "helper_macro.h"

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
    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, server_address)");

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
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, token)");

    // Get the first argument: config (uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Get the second argument: token (string)
    size_t token_length;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &token_length);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid token argument");

    pinggy_char_p_t token = malloc(token_length + 1);
    NAPI_CHECK_CONDITION_THROW(env, token != NULL, "Memory allocation failed");

    status = napi_get_value_string_utf8(env, args[1], token, token_length + 1, &token_length);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to get token string");

    // Call the pinggy_config_set_token function
    pinggy_config_set_token(config, token);

    free(token);

    // Return undefined
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

napi_value ConfigAddForwardingSimple(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, forward_to)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Get the second argument: forward_to (string)
    size_t forward_to_length;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &forward_to_length);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid forward_to argument");

    pinggy_char_p_t forward_to = malloc(forward_to_length + 1);
    NAPI_CHECK_CONDITION_RETURN(env, forward_to != NULL, "Memory allocation failed");

    status = napi_get_value_string_utf8(env, args[1], forward_to, forward_to_length + 1, &forward_to_length);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to get forward_to string", free(forward_to));

    // Call the pinggy_config_add_forwarding_simple function
    pinggy_config_add_forwarding_simple(config, forward_to);

    // Free allocated memory
    free(forward_to);

    // Return undefined (as the C function returns void)
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

napi_value ConfigAddForwarding(napi_env env, napi_callback_info info)
{
    size_t argc = 4;
    napi_value args[4];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 4, "Expected four arguments (config, forwarding_type, binding_url, forward_to)");
    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Get the second argument: forwarding_type (string) Example: "http", "tcp", "udp", "tls", "tlstcp".
    size_t forwarding_type_length;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &forwarding_type_length);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid forwarding_type argument");

    pinggy_char_p_t forwarding_type = malloc(forwarding_type_length + 1);
    NAPI_CHECK_CONDITION_THROW(env, forwarding_type != NULL, "Memory allocation failed");

    status = napi_get_value_string_utf8(env, args[1], forwarding_type, forwarding_type_length + 1, &forwarding_type_length);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to get forwarding_type string", free(forwarding_type));
    // Get the third argument: binding_url (string)  Examples: "example.pinggy.io", "example.pinggy.io:8080", ":80".
    size_t binding_url_length;
    status = napi_get_value_string_utf8(env, args[2], NULL, 0, &binding_url_length);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid binding_url argument");

    pinggy_char_p_t binding_url = malloc(binding_url_length + 1);
    NAPI_CHECK_CONDITION_THROW(env, binding_url != NULL, "Memory allocation failed");
    status = napi_get_value_string_utf8(env, args[2], binding_url, binding_url_length + 1, &binding_url_length);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to get binding_url string", free(binding_url));

    // Get the 4th argument: forward_to (string) Examples: "http://localhost:3000"), an IP address (e.g., "127.0.0.1:8000"), or just a port (e.g., ":5000").
    size_t forward_to_length;
    status = napi_get_value_string_utf8(env, args[3], NULL, 0, &forward_to_length);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid forward_to argument");

    pinggy_char_p_t forward_to = malloc(forward_to_length + 1);
    NAPI_CHECK_CONDITION_THROW(env, forward_to != NULL, "Memory allocation failed");

    status = napi_get_value_string_utf8(env, args[3], forward_to, forward_to_length + 1, &forward_to_length);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to get forward_to string", free(forward_to));

    // Call the pinggy_config_add_forwarding function
    pinggy_config_add_forwarding(config, forwarding_type, binding_url, forward_to);

    // Free allocated memory
    free(forward_to);

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
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, force)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Get the second argument: force (pinggy_bool_t / uint8_t)
    bool force;
    status = napi_get_value_bool(env, args[1], &force);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid force argument");

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
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, argument)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Get the second argument: argument (string)
    size_t argument_length;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &argument_length);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid argument");

    // Allocate memory for the argument string
    pinggy_char_p_t argument = malloc(argument_length + 1);
    NAPI_CHECK_CONDITION_THROW(env, argument != NULL, "Memory allocation failed");

    status = napi_get_value_string_utf8(env, args[1], argument, argument_length + 1, &argument_length);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to get argument string", free(argument));

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
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, ssl)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Get the second argument: ssl (pinggy_bool_t / uint8_t)
    bool ssl;
    status = napi_get_value_bool(env, args[1], &ssl);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid ssl argument");

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
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, insecure)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Get the second argument: insecure (pinggy_bool_t / uint8_t)
    bool insecure;
    status = napi_get_value_bool(env, args[1], &insecure);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid insecure argument");

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
    napi_status status; // return value for JS

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    // napi_status napi_get_cb_info(napi_env env,
    //                          napi_callback_info cbinfo,
    //                          size_t* argc,
    //                          napi_value* argv,
    //                          napi_value* thisArg,
    //                          void** data)
    // [in] env: the Node-API environment
    // [in] cbinfo: the callback info passed into the callback function
    // [in-out] argc: specifies number of expected parameters and receives the actual count of arguments. argc can optionally be ignored by passing NULL
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");
    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    // Get the first argument: config (uint32_t)
    uint32_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    // napi_status napi_get_value_uint32(napi_env env,
    //                               napi_value value,
    //                               uint32_t* result)
    // [in] env: the Node-API environment
    // [in] value: the JavaScript number to convert, received as the first argument
    // [out] result: C primitive equivalent of the given napi_value as a uint32_t, since JS numbers are to double type
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");
    // Allocate buffer for the server address
    pinggy_capa_t buffer_len = 0; // Example buffer length
    pinggy_const_int_t rc = pinggy_config_get_server_address_len(config, 0, NULL, &buffer_len);
    NAPI_CHECK_CONDITION_THROW(env, rc >= 0 && buffer_len > 0, "Failed to get required length for server address");
    // Allocate a buffer of the required length
    pinggy_char_p_t buffer = malloc(buffer_len + 1); // +1 for null terminator
    NAPI_CHECK_CONDITION_THROW(env, buffer != NULL, "Memory allocation failed");

    // Call the pinggy_config_get_server_address function
    int copied_len = pinggy_config_get_server_address(config, buffer_len + 1, buffer);
    // get the length from the JS function preferabbly as a parameter

    // Handle errors (if the copied length is negative, assuming it indicates an error)
    NAPI_CHECK_CONDITION_THROW(env, copied_len >= 0, "Failed to get server address");
    napi_value result;
    // Convert the buffer to a JavaScript string
    status = napi_create_string_utf8(env, buffer, copied_len, &result);
    // napi_status napi_create_string_utf8(napi_env env,
    //                                  const char* str,
    //                                  size_t length,
    //                                  napi_value* result)
    // [in] env: the Node-API environment
    // [in] str: Character buffer representing a UTF-8 encoded string
    // [in] length: the length of the string in bytes, or NAPI_AUTO_LENGTH if the string is null-terminated
    // [out] result: the JavaScript string value
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to create string");
    free(buffer); // Free the allocated buffer

    return result;
}

// Wrapper for pinggy_config_get_sni_server_name
napi_value ConfigGetSniServerName(napi_env env, napi_callback_info info)
{
    // env: the Node-API environment pointer
    // info: contains information about the function call including arguments

    size_t argc = 1;    // Number of expected arguments
    napi_value args[1]; // Array to store the JS arguments (passed to cb_info function)
    napi_status status; // return value for JS

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    // [in] env: the Node-api environment
    // [in] info: the callback info passed into the callback function
    // [in-out] argc: specifies number of expected parameters and recieves the actual count of arguments. argc can optionally be ignored by passing NULL
    // [out] args: C array of napi_values to which the arguments will be copied. If there are more arguments than the provided count, only the requested no of arguments are copied. If ther are fewer arguments provided than claimed, the rest of args is filled with napi_value values that represent 'undefined'. 'args' can also be optionally ignored.
    // [out] NULL: thisArg, the JavaScript 'this' argument for the call. Ignored in this case by passing NULL
    // [out] NULL: the pointer to store the number of bytes copied, which we are not interested in here.
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");
    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    // Get the first argument: config (uint32_t)
    uint32_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Allocate buffer for the SNI server name
    pinggy_capa_t required_len = 0;
    pinggy_const_int_t rc = pinggy_config_get_sni_server_name_len(config, 0, NULL, &required_len);
    NAPI_CHECK_CONDITION_THROW(env, rc >= 0 && required_len > 0, "Failed to get required length for SNI server name");
    pinggy_char_p_t buffer = malloc(required_len + 1);
    NAPI_CHECK_CONDITION_THROW(env, buffer != NULL, "Memory allocation failed");
    // Call the pinggy_config_get_sni_server_name function
    int copied_len = pinggy_config_get_sni_server_name(config, required_len + 1, buffer);

    // Handle errors (if the copied length is negative, assuming it indicates an error)
    NAPI_CHECK_CONDITION_THROW(env, copied_len >= 0, "Failed to get SNI server name");
    napi_value result;
    // Convert the buffer to a JavaScript string
    status = napi_create_string_utf8(env, buffer, copied_len, &result);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to create string");
    free(buffer); // Free the allocated buffer

    return result;
}

// Wrapper for pinggy_config_get_advanced_parsing
napi_value ConfigGetAdvancedParsing(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_value result;
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");
    // Get the first argument: config (uint32_t)
    uint32_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Call the pinggy_config_get_advanced_parsing function
    pinggy_bool_t advanced_parsing = pinggy_config_get_advanced_parsing(config);

    // Return the boolean value (advanced_parsing) as a JavaScript boolean
    status = napi_get_boolean(env, advanced_parsing, &result);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to create boolean");
    return result;
}

napi_value ConfigGetToken(napi_env env, napi_callback_info info)
{
    size_t argc = 1;    // Number of expected arguments
    napi_value args[1]; // Array to store the JS arguments (passed to cb_info function)
    napi_value result;  // return value for JS
    napi_status status; // return value for JS

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    // Get the first argument: config (uint32_t)
    uint32_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Allocate buffer for the token
    pinggy_capa_t required_len = 0; // Example buffer length
    pinggy_const_int_t rc = pinggy_config_get_token_len(config, 0, NULL, &required_len);
    NAPI_CHECK_CONDITION_THROW(env, rc >= 0, "Failed to get required length for token");

    if (required_len == 0)
    {
        // If the required length is 0, return an empty string
        status = napi_create_string_utf8(env, "", NAPI_AUTO_LENGTH, &result);
        return result;
    }
    pinggy_char_p_t buffer = malloc(required_len + 1);
    NAPI_CHECK_CONDITION_THROW(env, buffer != NULL, "Memory allocation failed");

    // Call the pinggy_config_get_token function
    pinggy_const_int_t copied_len = pinggy_config_get_token(config, required_len + 1, buffer);

    // Handle errors (if the copied length is negative, assuming it indicates an error)
    NAPI_CHECK_CONDITION_THROW(env, copied_len >= 0, "Failed to get token");

    // Convert the buffer to a JavaScript string
    status = napi_create_string_utf8(env, buffer, copied_len, &result);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to create string", free(buffer));

    free(buffer);
    return result;
}

napi_value ConfigGetForwardings(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_CONDITION_THROW(env, status == napi_ok, "Invalid config argument");

    pinggy_capa_t required_len = 0;
    pinggy_const_int_t rc = pinggy_config_get_forwardings_len(config, 0, NULL, &required_len);
    NAPI_CHECK_CONDITION_THROW(env, rc >= 0 && required_len > 0, "Failed to get required length for forwarding_rules");

    // Create a buffer to hold the forwarding rules
    pinggy_char_p_t forwarding_rules = malloc(required_len + 1);
    NAPI_CHECK_CONDITION_THROW(env, forwarding_rules != NULL, "Memory allocation failed");

    // Call the pinggy function to Retrieves the forwarding rules (as a JSON string) from the tunnel config.
    pinggy_const_int_t copied_length = pinggy_config_get_forwardings(config, required_len + 1, forwarding_rules);
    NAPI_CHECK_CONDITION_THROW(env, copied_length >= 0, "Failed to get forwarding_rules");
    // Return the forwarding_rules as a JavaScript string
    napi_value result;
    status = napi_create_string_utf8(env, forwarding_rules, copied_length, &result);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to create string from forwarding_rules", free(forwarding_rules));

    // Free the allocated memory for udp_forward_to
    free(forwarding_rules);

    return result;
}

napi_value ConfigGetForce(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Call the pinggy function to get the force status
    pinggy_const_bool_t force = pinggy_config_get_force(config);

    // Return the force status as a JavaScript boolean
    napi_value result;
    status = napi_get_boolean(env, force, &result);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to create boolean");

    return result;
}

napi_value ConfigGetArgument(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Determine buffer size (assuming a reasonable buffer length for now)
    pinggy_capa_t buffer_len = 1024; // You can make this dynamic based on your use case

    // Allocate buffer
    pinggy_char_p_t buffer = malloc(buffer_len);
    NAPI_CHECK_CONDITION_THROW(env, buffer != NULL, "Memory allocation failed");

    // Call the pinggy function to get the argument
    pinggy_const_int_t length = pinggy_config_get_argument(config, buffer_len, buffer);

    // If length is 0, return undefined as no argument was retrieved
    NAPI_CHECK_CONDITION_RETURN_UNDEFINED_AND_CLEANUP(env, length >= 0, free(buffer));

    // Create JavaScript string from the buffer
    napi_value result;
    status = napi_create_string_utf8(env, buffer, length, &result);
    free(buffer); // Free buffer after usage
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to create string from argument");

    return result;
}

napi_value ConfigGetSsl(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

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
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Call the pinggy_config_get_insecure function
    pinggy_bool_t insecure_enabled = pinggy_config_get_insecure(config);

    // Return the boolean value (insecure_enabled) as a JavaScript boolean
    napi_value result;
    napi_get_boolean(env, insecure_enabled, &result);
    return result;
}

// N-API wrapper for pinggy_version
napi_value GetPinggyVersion(napi_env env, napi_callback_info info)
{
    napi_status status;
    napi_value result;
    // No arguments needed
    size_t buffer_len = 128; // Should be enough for version string
    char buffer[128];

    // Call the macro-based function
    pinggy_const_int_t len = pinggy_version(buffer_len, buffer);
    NAPI_CHECK_CONDITION_RETURN(env, len >= 0, "Failed to get Pinggy version");
    status = napi_create_string_utf8(env, buffer, len, &result);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to create version string");
    return result;
}

// Wrapper for pinggy_config_set_https_only
napi_value ConfigSetHttpsOnly(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, https_only)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Get the second argument: https_only (pinggy_bool_t / bool)
    bool https_only;
    status = napi_get_value_bool(env, args[1], &https_only);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid https_only argument");

    // Call the pinggy_config_set_https_only function
    pinggy_config_set_https_only(config, (pinggy_bool_t)https_only);

    // Return undefined
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_get_https_only
napi_value ConfigGetHttpsOnly(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Call the pinggy_config_get_https_only function
    pinggy_bool_t https_only = pinggy_config_get_https_only(config);

    // Return the boolean value as a JavaScript boolean
    napi_value result;
    napi_get_boolean(env, https_only, &result);
    return result;
}

// Wrapper for pinggy_config_set_allow_preflight
napi_value ConfigSetAllowPreflight(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, allow_preflight)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Get the second argument: allow_preflight (pinggy_bool_t / bool)
    bool allow_preflight;
    status = napi_get_value_bool(env, args[1], &allow_preflight);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid allow_preflight argument");

    // Call the pinggy_config_set_allow_preflight function
    pinggy_config_set_allow_preflight(config, (pinggy_bool_t)allow_preflight);

    // Return undefined
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_get_allow_preflight
napi_value ConfigGetAllowPreflight(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Call the pinggy_config_get_allow_preflight function
    pinggy_bool_t allow_preflight = pinggy_config_get_allow_preflight(config);

    // Return the boolean value as a JavaScript boolean
    napi_value result;
    napi_get_boolean(env, allow_preflight, &result);
    return result;
}

// Wrapper for pinggy_config_set_x_forwarded_for
napi_value ConfigSetXForwardedFor(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, x_forwarded_for)");

    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    bool x_forwarded_for;
    status = napi_get_value_bool(env, args[1], &x_forwarded_for);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid x_forwarded_for argument");

    pinggy_config_set_x_forwarded_for(config, (pinggy_bool_t)x_forwarded_for);

    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_get_x_forwarded_for
napi_value ConfigGetXForwardedFor(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    pinggy_bool_t x_forwarded_for = pinggy_config_get_x_forwarded_for(config);

    napi_value result;
    napi_get_boolean(env, x_forwarded_for, &result);
    return result;
}

// Wrapper for pinggy_config_set_reverse_proxy
napi_value ConfigSetReverseProxy(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, reverse_proxy)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Get the second argument: reverse_proxy (pinggy_bool_t / bool)
    bool reverse_proxy;
    status = napi_get_value_bool(env, args[1], &reverse_proxy);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid reverse_proxy argument");

    // Call the pinggy_config_set_reverse_proxy function
    pinggy_config_set_reverse_proxy(config, (pinggy_bool_t)reverse_proxy);

    // Return undefined
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_get_reverse_proxy
napi_value ConfigGetReverseProxy(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Call the pinggy_config_get_reverse_proxy function
    pinggy_bool_t reverse_proxy = pinggy_config_get_reverse_proxy(config);

    // Return the boolean value as a JavaScript boolean
    napi_value result;
    napi_get_boolean(env, reverse_proxy, &result);
    return result;
}

// Wrapper for pinggy_config_set_original_request_url
napi_value ConfigSetOriginalRequestUrl(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, original_request_url)");

    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    bool original_request_url;
    status = napi_get_value_bool(env, args[1], &original_request_url);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid original_request_url argument");

    pinggy_config_set_original_request_url(config, (pinggy_bool_t)original_request_url);

    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_get_original_request_url
napi_value ConfigGetOriginalRequestUrl(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    pinggy_bool_t original_request_url = pinggy_config_get_original_request_url(config);

    napi_value result;
    napi_get_boolean(env, original_request_url, &result);
    return result;
}

// Wrapper for pinggy_config_set_ip_white_list
napi_value ConfigSetIpWhiteList(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, ip_white_list)");

    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // determines the length of the ip_white_list string
    size_t ip_len;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &ip_len);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid ip_white_list argument");

    pinggy_char_p_t ip_white_list = malloc(ip_len + 1); // +1 for null terminator
    NAPI_CHECK_CONDITION_THROW(env, ip_white_list != NULL, "Memory allocation failed");

    status = napi_get_value_string_utf8(env, args[1], ip_white_list, ip_len + 1, &ip_len);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to get ip_white_list string", free(ip_white_list));

    pinggy_config_set_ip_white_list(config, ip_white_list);
    free(ip_white_list);

    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_get_ip_white_list
napi_value ConfigGetIpWhiteList(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // First call the _len variant to get required buffer size
    pinggy_capa_t required_len = 0;
    pinggy_const_int_t rc = pinggy_config_get_ip_white_list_len(config, 0, NULL, &required_len);
    NAPI_CHECK_CONDITION_THROW(env, rc >= 0 && required_len > 0, "Failed to determine ip_white_list length");

    pinggy_char_p_t ip_white_list = malloc(required_len + 1);
    NAPI_CHECK_CONDITION_THROW(env, ip_white_list != NULL, "Memory allocation failed");

    // Call the pinggy function to get the ip_white_list
    pinggy_const_int_t copied = pinggy_config_get_ip_white_list(config, required_len + 1, ip_white_list);
    NAPI_CHECK_CONDITION_THROW(env, copied >= 0, "Failed to get ip_white_list");

    // Return the ip_white_list as a JavaScript string
    napi_value result;
    status = napi_create_string_utf8(env, ip_white_list, copied, &result);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to create JS string from ip_white_list", free(ip_white_list));

    free(ip_white_list);
    return result;
}

// Wrapper for pinggy_config_set_basic_auths
napi_value ConfigSetBasicAuths(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, basic_auths)");

    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // determine length of the basic_auths string
    size_t auth_len;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &auth_len);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid basic_auths argument");

    pinggy_char_p_t basic_auths = malloc(auth_len + 1);
    NAPI_CHECK_CONDITION_THROW(env, basic_auths != NULL, "Memory allocation failed");

    status = napi_get_value_string_utf8(env, args[1], basic_auths, auth_len + 1, &auth_len);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to get basic_auths string", free(basic_auths));

    pinggy_config_set_basic_auths(config, basic_auths);
    free(basic_auths);

    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_get_basic_auths
napi_value ConfigGetBasicAuths(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Call the _len variant to get the required buffer size
    pinggy_capa_t required_len = 0;
    pinggy_const_int_t rc = pinggy_config_get_basic_auths_len(config, 0, NULL, &required_len);
    NAPI_CHECK_CONDITION_THROW(env, rc >= 0 && required_len > 0, "Failed to determine basic_auths length");

    pinggy_char_p_t basic_auths = malloc(required_len + 1);
    NAPI_CHECK_CONDITION_THROW(env, basic_auths != NULL, "Memory allocation failed");

    pinggy_const_int_t copied = pinggy_config_get_basic_auths(config, required_len + 1, basic_auths);
    NAPI_CHECK_CONDITION_THROW(env, copied >= 0, "Failed to get basic_auths");

    napi_value result;
    status = napi_create_string_utf8(env, basic_auths, copied, &result);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to create JS string from basic_auths", free(basic_auths));

    free(basic_auths);
    return result;
}

// Wrapper for pinggy_config_set_bearer_token_auths
napi_value ConfigSetBearerTokenAuths(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, bearer_token_auths)");

    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // determine length of the bearer_token_auths string
    size_t auth_len;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &auth_len);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid bearer_token_auths argument");

    pinggy_char_p_t bearer_token_auths = malloc(auth_len + 1);
    NAPI_CHECK_CONDITION_THROW(env, bearer_token_auths != NULL, "Memory allocation failed");

    status = napi_get_value_string_utf8(env, args[1], bearer_token_auths, auth_len + 1, &auth_len);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to get bearer_token_auths string", free(bearer_token_auths));

    pinggy_config_set_bearer_token_auths(config, bearer_token_auths);
    free(bearer_token_auths);

    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_get_bearer_token_auths
napi_value ConfigGetBearerTokenAuths(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    pinggy_capa_t required_len = 0;
    pinggy_const_int_t rc = pinggy_config_get_bearer_token_auths_len(config, 0, NULL, &required_len);
    NAPI_CHECK_CONDITION_THROW(env, rc >= 0 && required_len > 0, "Failed to determine bearer_token_auths length");

    pinggy_char_p_t bearer_token_auths = malloc(required_len + 1);
    NAPI_CHECK_CONDITION_THROW(env, bearer_token_auths != NULL, "Memory allocation failed");

    pinggy_const_int_t copied = pinggy_config_get_bearer_token_auths(config, required_len + 1, bearer_token_auths);
    NAPI_CHECK_CONDITION_THROW(env, copied >= 0, "Failed to get bearer_token_auths");

    napi_value result;
    status = napi_create_string_utf8(env, bearer_token_auths, copied, &result);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to create JS string from bearer_token_auths", free(bearer_token_auths));

    free(bearer_token_auths);
    return result;
}
// Wrapper for pinggy_config_set_header_modification
napi_value ConfigSetHeaderModification(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, header_modification)");

    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // determine length of the header_modification string
    size_t header_len;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &header_len);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid header_modification argument");

    pinggy_char_p_t header_modification = malloc(header_len + 1);
    NAPI_CHECK_CONDITION_THROW(env, header_modification != NULL, "Memory allocation failed");

    status = napi_get_value_string_utf8(env, args[1], header_modification, header_len + 1, &header_len);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to get header_modification string", free(header_modification));

    pinggy_config_set_header_manipulations(config, header_modification);
    free(header_modification);

    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_get_header_modification
napi_value ConfigGetHeaderModification(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    pinggy_capa_t required_len = 0;
    pinggy_const_int_t rc = pinggy_config_get_header_manipulations_len(config, 0, NULL, &required_len);
    NAPI_CHECK_CONDITION_THROW(env, rc >= 0 && required_len > 0, "Failed to determine header_modification length");

    pinggy_char_p_t header_modification = malloc(required_len + 1);
    NAPI_CHECK_CONDITION_THROW(env, header_modification != NULL, "Memory allocation failed");

    pinggy_const_int_t copied = pinggy_config_get_header_manipulations(config, required_len + 1, header_modification);
    NAPI_CHECK_CONDITION_THROW(env, copied >= 0, "Failed to get header_modification");

    napi_value result;
    status = napi_create_string_utf8(env, header_modification, copied, &result);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to create JS string from header_modification", free(header_modification));

    free(header_modification);
    return result;
}

// Wrapper for pinggy_config_set_local_server_tls
napi_value ConfigSetLocalServerTls(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, local_server_tls)");

    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    size_t len;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &len);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid local_server_tls argument");

    pinggy_char_p_t local_server_tls = malloc(len + 1);
    NAPI_CHECK_CONDITION_THROW(env, local_server_tls != NULL, "Memory allocation failed");

    status = napi_get_value_string_utf8(env, args[1], local_server_tls, len + 1, &len);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to get local_server_tls string", free(local_server_tls));

    pinggy_config_set_local_server_tls(config, local_server_tls);
    free(local_server_tls);

    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_get_local_server_tls
napi_value ConfigGetLocalServerTls(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    pinggy_capa_t required_len = 0;
    pinggy_const_int_t rc = pinggy_config_get_local_server_tls_len(config, 0, NULL, &required_len);
    NAPI_CHECK_CONDITION_THROW(env, rc >= 0, "Failed to determine local_server_tls length");

    if (required_len == 0)
    {
        // If the length is zero, return an empty string
        napi_value result;
        status = napi_create_string_utf8(env, "", 0, &result);
        return result;
    }

    pinggy_char_p_t local_server_tls = malloc(required_len + 1);
    NAPI_CHECK_CONDITION_THROW(env, local_server_tls != NULL, "Memory allocation failed");

    pinggy_const_int_t copied = pinggy_config_get_local_server_tls(config, required_len + 1, local_server_tls);
    NAPI_CHECK_CONDITION_THROW(env, copied >= 0, "Failed to get local_server_tls");

    napi_value result;
    status = napi_create_string_utf8(env, local_server_tls, copied, &result);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to create JS string from local_server_tls", free(local_server_tls));

    free(local_server_tls);
    return result;
}
// Wrapper for pinggy_config_set_auto_reconnect
napi_value ConfigSetAutoReconnect(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, autoReconnect)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Get the second argument: autoReconnect (pinggy_bool_t / uint8_t)
    bool autoReconnect;
    status = napi_get_value_bool(env, args[1], &autoReconnect);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid autoReconnect argument");

    // Call the pinggy_config_set_auto_reconnect function
    pinggy_config_set_auto_reconnect(config, (pinggy_bool_t)autoReconnect);

    // Return undefined (as the C function returns void)
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_get_auto_reconnect
napi_value ConfigGetAutoReconnect(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Call the pinggy function to get the autoReconnect status
    pinggy_const_bool_t autoReconnect = pinggy_config_get_auto_reconnect(config);

    // Return the autoReconnect status as a JavaScript boolean
    napi_value result;
    status = napi_get_boolean(env, autoReconnect, &result);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to create boolean from autoReconnect status");

    return result;
}

// Wrapper for pinggy_config_set_reconnect_interval
napi_value ConfigSetReconnectInterval(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, reconnectInterval)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Get the second argument: reconnectInterval (pinggy_uint32_t / uint32_t)
    uint32_t reconnectInterval;
    status = napi_get_value_uint32(env, args[1], &reconnectInterval);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid reconnectInterval argument");

    // Call the pinggy_config_set_reconnect_interval function
    pinggy_config_set_reconnect_interval(config, (pinggy_uint16_t)reconnectInterval);

    // Return undefined (as the C function returns void)
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_get_reconnect_interval
napi_value ConfigGetReconnectInterval(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Call the pinggy function to get the reconnect interval
    pinggy_uint16_t interval = pinggy_config_get_reconnect_interval(config);

    // Return the interval as a JavaScript number
    napi_value result;
    status = napi_create_uint32(env, (uint32_t)interval, &result);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to create result");

    return result;
}

// Wrapper for pinggy_config_set_max_reconnect_attempts
napi_value ConfigSetMaxReconnectAttempts(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, maxReconnectAttempts)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Get the second argument: MaxReconnectAttempts (pinggy_uint32_t / uint32_t)
    uint32_t maxReconnectAttempts;
    status = napi_get_value_uint32(env, args[1], &maxReconnectAttempts);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid maxReconnectAttempts argument");

    // Call the pinggy_config_set_max_reconnect_attempts function
    pinggy_config_set_max_reconnect_attempts(config, (pinggy_uint32_t)maxReconnectAttempts);

    // Return undefined (as the C function returns void)
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_get_max_reconnect_attempts
napi_value ConfigGetMaxReconnectAttempts(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Call the pinggy function to get the max reconnect attempts
    pinggy_uint32_t maxReconnectAttempts = pinggy_config_get_max_reconnect_attempts(config);

    // Return the maxReconnectAttempts as a JavaScript number
    napi_value result;
    status = napi_create_uint32(env, (uint32_t)maxReconnectAttempts, &result);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to create result");

    return result;
}
// Wrapper for pinggy_config_set_forwardings
napi_value ConfigSetForwardings(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, forwardings)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Get the second argument: forwardings (string)
    size_t forwardings_len;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &forwardings_len);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid forwardings argument");

    pinggy_char_p_t forwardings = malloc(forwardings_len + 1);
    NAPI_CHECK_CONDITION_THROW(env, forwardings != NULL, "Memory allocation failed");

    status = napi_get_value_string_utf8(env, args[1], forwardings, forwardings_len + 1, &forwardings_len);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to get forwardings string", free(forwardings));

    // Call the pinggy_config_set_forwardings function
    pinggy_config_set_forwardings(config, forwardings);

    // Free allocated memory
    free(forwardings);

    // Return undefined (as the C function returns void)
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_reset_forwardings
napi_value ConfigResetForwardings(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    // Validate the number of arguments
    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    // Get the first argument: config (pinggy_ref_t / uint32_t)
    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    // Call the pinggy_config_reset_forwardings function
    pinggy_config_reset_forwardings(config);

    // Return undefined (as the C function returns void)
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_set_webdebugger_addr. Sets the port for the web debugger.
napi_value ConfigSetWebdebuggerAddr(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, addr)");

    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    size_t addr_len;
    status = napi_get_value_string_utf8(env, args[1], NULL, 0, &addr_len);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid addr argument");

    pinggy_char_p_t addr = malloc(addr_len + 1);
    NAPI_CHECK_CONDITION_THROW(env, addr != NULL, "Memory allocation failed");

    status = napi_get_value_string_utf8(env, args[1], addr, addr_len + 1, &addr_len);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to get addr string", free(addr));

    pinggy_config_set_webdebugger_addr(config, addr);
    free(addr);

    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_set_webdebugger. Enables or disables the web debugger for the tunnel.
napi_value ConfigSetWebdebugger(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_status status;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    NAPI_CHECK_CONDITION_THROW(env, argc >= 2, "Expected two arguments (config, enable)");

    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    bool enable;
    status = napi_get_value_bool(env, args[1], &enable);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid enable argument");

    pinggy_config_set_webdebugger(config, (pinggy_bool_t)enable);

    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_get_webdebugger. Checks whether the web debugger is enabled in the tunnel config.
napi_value ConfigGetWebdebugger(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    pinggy_bool_t webdebugger_enabled = pinggy_config_get_webdebugger(config);

    napi_value result;
    napi_get_boolean(env, webdebugger_enabled, &result);
    return result;
}

// Wrapper for pinggy_config_get_webdebugger_addr. Retrieves the web debugger bindaddress from the tunnel config.
napi_value ConfigGetWebdebuggerAddr(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;

    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    NAPI_CHECK_STATUS_THROW(env, status, "Failed to parse arguments");

    NAPI_CHECK_CONDITION_THROW(env, argc >= 1, "Expected one argument (config)");

    pinggy_ref_t config;
    status = napi_get_value_uint32(env, args[0], &config);
    NAPI_CHECK_STATUS_THROW(env, status, "Invalid config argument");

    pinggy_capa_t required_len = 0;
    pinggy_const_int_t rc = pinggy_config_get_webdebugger_addr_len(config, 0, NULL, &required_len);
    NAPI_CHECK_CONDITION_THROW(env, rc >= 0 && required_len > 0, "Failed to determine webdebugger_addr length");

    pinggy_char_p_t webdebugger_addr = malloc(required_len + 1);
    NAPI_CHECK_CONDITION_THROW(env, webdebugger_addr != NULL, "Memory allocation failed");

    pinggy_const_int_t copied = pinggy_config_get_webdebugger_addr(config, required_len + 1, webdebugger_addr);
    NAPI_CHECK_CONDITION_THROW(env, copied >= 0, "Failed to get webdebugger_addr");

    napi_value result;
    status = napi_create_string_utf8(env, webdebugger_addr, copied, &result);
    NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, "Failed to create JS string from webdebugger_addr", free(webdebugger_addr));

    free(webdebugger_addr);
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
        set_force_fn,
        set_argument_fn,
        set_ssl_fn,
        set_insecure_fn,
        set_ip_white_list_fn,
        set_basic_auths_fn,
        set_bearer_token_auths_fn,
        set_allow_preflight_fn,
        set_https_only_fn,
        set_x_forwarded_for_fn,
        set_original_request_url_fn,
        set_header_manipulations_fn,
        set_local_server_tls_fn,
        set_reconnect_interval_fn,
        set_auto_reconnect_fn,
        set_max_reconnect_attempts_fn,
        set_reverse_proxy_fn,
        set_forwarding_simple_fn,
        set_forwarding_fn,
        set_forwardings,
        set_reset_forwardings,
        set_webdebugger_addr_fn,
        set_webdebugger_fn;

    napi_value get_server_address_fn,
        get_sni_server_name_fn,
        get_advanced_parsing_fn,
        get_token_fn,
        get_force_fn,
        get_argument_fn,
        get_ssl_fn,
        get_ip_white_list_fn,
        get_basic_auths_fn,
        get_bearer_token_auths_fn,
        get_insecure_fn,
        get_https_only_fn,
        get_allow_preflight_fn,
        get_reverse_proxy_fn,
        get_x_forwarded_for_fn,
        get_original_request_url_fn,
        get_header_manipulations_fn,
        get_local_server_tls_fn,
        get_reconnect_interval_fn,
        get_auto_reconnect_fn,
        get_max_reconnect_attempts_fn,
        get_pinggy_version_fn,
        get_forwarding_fn,
        get_webdebugger_fn,
        get_webdebugger_addr_fn;

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

    napi_create_function(env, NULL, 0, ConfigGetForwardings, NULL, &get_forwarding_fn);
    napi_set_named_property(env, exports, "configGetForwarding", get_forwarding_fn);

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

    napi_create_function(env, NULL, 0, ConfigSetWebdebuggerAddr, NULL, &set_webdebugger_addr_fn);
    napi_set_named_property(env, exports, "configSetWebdebuggerAddr", set_webdebugger_addr_fn);

    napi_create_function(env, NULL, 0, ConfigSetWebdebugger, NULL, &set_webdebugger_fn);
    napi_set_named_property(env, exports, "configSetWebdebugger", set_webdebugger_fn);

    napi_create_function(env, NULL, 0, ConfigResetForwardings, NULL, &set_reset_forwardings);
    napi_set_named_property(env, exports, "configResetForwardings", set_reset_forwardings);

    napi_create_function(env, NULL, 0, ConfigSetForwardings, NULL, &set_forwardings);
    napi_set_named_property(env, exports, "configSetForwardings", set_forwardings);

    napi_create_function(env, NULL, 0, ConfigAddForwarding, NULL, &set_forwarding_fn);
    napi_set_named_property(env, exports, "configAddForwarding", set_forwarding_fn);

    napi_create_function(env, NULL, 0, ConfigAddForwardingSimple, NULL, &set_forwarding_simple_fn);
    napi_set_named_property(env, exports, "configAddForwardingSimple", set_forwarding_simple_fn);

    napi_create_function(env, NULL, 0, ConfigSetInsecure, NULL, &set_insecure_fn);
    napi_set_named_property(env, exports, "configSetInsecure", set_insecure_fn);

    napi_create_function(env, NULL, 0, ConfigGetWebdebuggerAddr, NULL, &get_webdebugger_addr_fn);
    napi_set_named_property(env, exports, "configGetWebdebuggerAddr", get_webdebugger_addr_fn);

    napi_create_function(env, NULL, 0, ConfigGetWebdebugger, NULL, &get_webdebugger_fn);
    napi_set_named_property(env, exports, "configGetWebdebugger", get_webdebugger_fn);

    napi_create_function(env, NULL, 0, ConfigGetToken, NULL, &get_token_fn);
    napi_set_named_property(env, exports, "configGetToken", get_token_fn);

    napi_create_function(env, NULL, 0, ConfigGetSsl, NULL, &get_ssl_fn);
    napi_set_named_property(env, exports, "configGetSsl", get_ssl_fn);

    napi_create_function(env, NULL, 0, ConfigGetInsecure, NULL, &get_insecure_fn);
    napi_set_named_property(env, exports, "configGetInsecure", get_insecure_fn);

    napi_create_function(env, NULL, 0, GetPinggyVersion, NULL, &get_pinggy_version_fn);
    napi_set_named_property(env, exports, "getPinggyVersion", get_pinggy_version_fn);

    napi_create_function(env, NULL, 0, ConfigSetHttpsOnly, NULL, &set_https_only_fn);
    napi_set_named_property(env, exports, "configSetHttpsOnly", set_https_only_fn);

    napi_create_function(env, NULL, 0, ConfigGetHttpsOnly, NULL, &get_https_only_fn);
    napi_set_named_property(env, exports, "configGetHttpsOnly", get_https_only_fn);

    napi_create_function(env, NULL, 0, ConfigSetIpWhiteList, NULL, &set_ip_white_list_fn);
    napi_set_named_property(env, exports, "configSetIpWhiteList", set_ip_white_list_fn);

    napi_create_function(env, NULL, 0, ConfigGetIpWhiteList, NULL, &get_ip_white_list_fn);
    napi_set_named_property(env, exports, "configGetIpWhiteList", get_ip_white_list_fn);

    napi_create_function(env, NULL, 0, ConfigSetAllowPreflight, NULL, &set_allow_preflight_fn);
    napi_set_named_property(env, exports, "configSetAllowPreflight", set_allow_preflight_fn);

    napi_create_function(env, NULL, 0, ConfigGetAllowPreflight, NULL, &get_allow_preflight_fn);
    napi_set_named_property(env, exports, "configGetAllowPreflight", get_allow_preflight_fn);

    napi_create_function(env, NULL, 0, ConfigSetXForwardedFor, NULL, &set_x_forwarded_for_fn);
    napi_set_named_property(env, exports, "configSetXForwardedFor", set_x_forwarded_for_fn);

    napi_create_function(env, NULL, 0, ConfigGetXForwardedFor, NULL, &get_x_forwarded_for_fn);
    napi_set_named_property(env, exports, "configGetXForwardedFor", get_x_forwarded_for_fn);

    napi_create_function(env, NULL, 0, ConfigSetReverseProxy, NULL, &set_reverse_proxy_fn);
    napi_set_named_property(env, exports, "configSetReverseProxy", set_reverse_proxy_fn);

    napi_create_function(env, NULL, 0, ConfigGetReverseProxy, NULL, &get_reverse_proxy_fn);
    napi_set_named_property(env, exports, "configGetReverseProxy", get_reverse_proxy_fn);

    napi_create_function(env, NULL, 0, ConfigSetOriginalRequestUrl, NULL, &set_original_request_url_fn);
    napi_set_named_property(env, exports, "configSetOriginalRequestUrl", set_original_request_url_fn);

    napi_create_function(env, NULL, 0, ConfigGetOriginalRequestUrl, NULL, &get_original_request_url_fn);
    napi_set_named_property(env, exports, "configGetOriginalRequestUrl", get_original_request_url_fn);

    napi_create_function(env, NULL, 0, ConfigGetBasicAuths, NULL, &get_basic_auths_fn);
    napi_set_named_property(env, exports, "configGetBasicAuths", get_basic_auths_fn);

    napi_create_function(env, NULL, 0, ConfigSetBasicAuths, NULL, &set_basic_auths_fn);
    napi_set_named_property(env, exports, "configSetBasicAuths", set_basic_auths_fn);

    napi_create_function(env, NULL, 0, ConfigGetBearerTokenAuths, NULL, &get_bearer_token_auths_fn);
    napi_set_named_property(env, exports, "configGetBearerTokenAuths", get_bearer_token_auths_fn);

    napi_create_function(env, NULL, 0, ConfigSetBearerTokenAuths, NULL, &set_bearer_token_auths_fn);
    napi_set_named_property(env, exports, "configSetBearerTokenAuths", set_bearer_token_auths_fn);

    napi_create_function(env, NULL, 0, ConfigSetHeaderModification, NULL, &set_header_manipulations_fn);
    napi_set_named_property(env, exports, "configSetHeaderModification", set_header_manipulations_fn);

    napi_create_function(env, NULL, 0, ConfigGetHeaderModification, NULL, &get_header_manipulations_fn);
    napi_set_named_property(env, exports, "configGetHeaderModification", get_header_manipulations_fn);

    napi_create_function(env, NULL, 0, ConfigSetLocalServerTls, NULL, &set_local_server_tls_fn);
    napi_set_named_property(env, exports, "configSetLocalServerTls", set_local_server_tls_fn);

    napi_create_function(env, NULL, 0, ConfigGetLocalServerTls, NULL, &get_local_server_tls_fn);
    napi_set_named_property(env, exports, "configGetLocalServerTls", get_local_server_tls_fn);

    napi_create_function(env, NULL, 0, ConfigSetAutoReconnect, NULL, &set_auto_reconnect_fn);
    napi_set_named_property(env, exports, "configSetAutoReconnect", set_auto_reconnect_fn);

    napi_create_function(env, NULL, 0, ConfigGetAutoReconnect, NULL, &get_auto_reconnect_fn);
    napi_set_named_property(env, exports, "configGetAutoReconnect", get_auto_reconnect_fn);

    napi_create_function(env, NULL, 0, ConfigSetMaxReconnectAttempts, NULL, &set_max_reconnect_attempts_fn);
    napi_set_named_property(env, exports, "configSetMaxReconnectAttempts", set_max_reconnect_attempts_fn);

    napi_create_function(env, NULL, 0, ConfigGetMaxReconnectAttempts, NULL, &get_max_reconnect_attempts_fn);
    napi_set_named_property(env, exports, "configGetMaxReconnectAttempts", get_max_reconnect_attempts_fn);

    napi_create_function(env, NULL, 0, ConfigSetReconnectInterval, NULL, &set_reconnect_interval_fn);
    napi_set_named_property(env, exports, "configSetReconnectInterval", set_reconnect_interval_fn);

    napi_create_function(env, NULL, 0, ConfigGetReconnectInterval, NULL, &get_reconnect_interval_fn);
    napi_set_named_property(env, exports, "configGetReconnectInterval", get_reconnect_interval_fn);

    return exports;
}
