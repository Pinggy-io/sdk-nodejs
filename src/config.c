#include <node_api.h>
#include <stdlib.h>
#include <stdio.h>
#include "../pinggy.h"

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
    size_t argc = 2;
    napi_value args[2];
    napi_value result;

    // Parse arguments
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    // Validate the number of arguments
    if (argc < 2)
    {
        napi_throw_type_error(env, NULL, "Expected two arguments (config, server_address)");
        return NULL;
    }

    // Get the first argument: config (uint32_t)
    uint32_t config;
    napi_get_value_uint32(env, args[0], &config);

    // Get the second argument: server_address (string)
    size_t str_len;
    napi_get_value_string_utf8(env, args[1], NULL, 0, &str_len);
    char *server_address = (char *)malloc(str_len + 1); // Allocate memory for the C string
    napi_get_value_string_utf8(env, args[1], server_address, str_len + 1, NULL);

    // Call the pinggy_config_set_server_address function
    pinggy_config_set_server_address(config, server_address);

    // Free allocated memory
    free(server_address);

    // Return undefined (as the function has no return value)
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_get_server_address
napi_value ConfigGetServerAddress(napi_env env, napi_callback_info info)
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

    // Allocate buffer for the server address
    pinggy_capa_t buffer_len = 256; // Example buffer length
    char buffer[256];               // Fixed-size character array for simplicity

    // Call the pinggy_config_get_server_address function
    int copied_len = pinggy_config_get_server_address(config, buffer_len, buffer);

    // Handle errors (if the copied length is negative, assuming it indicates an error)
    if (copied_len < 0)
    {
        napi_throw_error(env, NULL, "Failed to get server address");
        return NULL;
    }

    // Convert the buffer to a JavaScript string
    napi_create_string_utf8(env, buffer, copied_len, &result);
    return result;
}

// Wrapper for pinggy_config_get_sni_server_name
napi_value ConfigGetSniServerName(napi_env env, napi_callback_info info)
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

    // Allocate buffer for the SNI server name
    pinggy_capa_t buffer_len = 256; // Example buffer length
    char buffer[256];               // Fixed-size character array for simplicity

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

    // Get the second argument: sni_server_name (string)
    size_t str_read;
    char sni_server_name[256]; // Buffer for the SNI server name
    napi_get_value_string_utf8(env, args[1], sni_server_name, sizeof(sni_server_name), &str_read);

    // Call the pinggy_config_set_sni_server_name function
    pinggy_config_set_sni_server_name(config, sni_server_name);

    // Return undefined (void return type in C)
    napi_get_undefined(env, &result);
    return result;
}

// Wrapper for pinggy_config_set_advanced_parsing
napi_value ConfigSetAdvancedParsing(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value args[2];
    napi_value result;

    // Parse arguments
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    // Validate the number of arguments
    if (argc < 2)
    {
        napi_throw_type_error(env, NULL, "Expected two arguments (config, advanced_parsing)");
        return NULL;
    }

    // Get the first argument: config (uint32_t)
    uint32_t config;
    napi_get_value_uint32(env, args[0], &config);

    // Get the second argument: advanced_parsing (boolean)
    bool advanced_parsing;
    napi_get_value_bool(env, args[1], &advanced_parsing);

    // Call the pinggy_config_set_advanced_parsing function
    pinggy_config_set_advanced_parsing(config, advanced_parsing);

    // Return undefined (void return type in C)
    napi_get_undefined(env, &result);
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

// Initialize the module and export the function
napi_value Init1(napi_env env, napi_value exports)
{
    napi_value set_log_path_fn, create_config_fn, set_server_address_fn, get_server_address_fn, get_sni_server_name_fn, set_sni_server_name_fn, set_advanced_parsing_fn, get_advanced_parsing_fn;

    napi_create_function(env, NULL, 0, SetLogPath, NULL, &set_log_path_fn);
    napi_set_named_property(env, exports, "setLogPath", set_log_path_fn);

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

    return exports;
}
