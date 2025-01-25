#include <node_api.h>
#include <stdlib.h>
#include <stdio.h>
#include "../pinggy.h"

// Binding for pinggy_set_log_path
napi_value SetLogPath(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1];
    napi_status status;
    napi_value result;

    // Parse the arguments
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    // Validating the arguments
    if (status != napi_ok || argc < 1)
    {
        napi_throw_error(env, NULL, "Expected one argument (log path string)");
        return NULL;
    }

    // Convert JavaScript string to C string
    size_t str_len;
    status = napi_get_value_string_utf8(env, args[0], NULL, 0, &str_len);
    if (status != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to get string length");
        return NULL;
    }

    char *log_path = (char *)malloc(str_len + 1);
    status = napi_get_value_string_utf8(env, args[0], log_path, str_len + 1, NULL);
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
napi_value CreateConfig(napi_env env, napi_callback_info info)
{
    napi_value result;

    pinggy_ref_t config_ref = pinggy_create_config();

    napi_create_uint32(env, config_ref, &result);

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
