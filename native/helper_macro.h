#ifndef NAPI_HELPERS_H
#define NAPI_HELPERS_H

// Macro to check napi_status and return error on failure
#define NAPI_CHECK_STATUS_RETURN(env, status, msg)                                                   \
    do                                                                                               \
    {                                                                                                \
        if ((status) != napi_ok)                                                                     \
        {                                                                                            \
            napi_value result;                                                                       \
            char error_message[256];                                                                 \
            snprintf(error_message, sizeof(error_message), "[%s:%d] %s", __FILE__, __LINE__, (msg)); \
            napi_create_string_utf8((env), error_message, NAPI_AUTO_LENGTH, &result);                \
            return result;                                                                           \
        }                                                                                            \
    } while (0)

#define NAPI_CHECK_CONDITION_RETURN_UNDEFINED_AND_CLEANUP(env, condition, cleanup) \
    do                                                                             \
    {                                                                              \
        if (!(condition))                                                          \
        {                                                                          \
            napi_value result;                                                     \
            cleanup;                                                               \
            napi_get_undefined((env), &result);                                    \
            return result;                                                         \
        }                                                                          \
    } while (0)

// Macro to check a condition and return error if false
#define NAPI_CHECK_CONDITION_RETURN(env, condition, msg)                                             \
    do                                                                                               \
    {                                                                                                \
        if (!(condition))                                                                            \
        {                                                                                            \
            napi_value result;                                                                       \
            char error_message[256];                                                                 \
            snprintf(error_message, sizeof(error_message), "[%s:%d] %s", __FILE__, __LINE__, (msg)); \
            napi_create_string_utf8((env), error_message, NAPI_AUTO_LENGTH, &result);                \
            return result;                                                                           \
        }                                                                                            \
    } while (0)
    
#define NAPI_CHECK_CONDITION_RETURN_VOID(env, condition, msg)                      \
    do                                                                           \
    {                                                                            \
        if (!(condition))                                                        \
        {                                                                        \
            char error_message[256];                                             \
            snprintf(error_message, sizeof(error_message), "[%s:%d] %s", __FILE__, __LINE__, (msg)); \
            napi_throw_error((env), NULL, error_message);                        \
            return;                                                             \
        }                                                                        \
    } while (0)

// Macro to throw a JavaScript error and return undefined
#define NAPI_THROW_ERROR(env, msg)                                                               \
    do                                                                                           \
    {                                                                                            \
        char error_message[256];                                                                 \
        snprintf(error_message, sizeof(error_message), "[%s:%d] %s", __FILE__, __LINE__, (msg)); \
        napi_throw_error((env), NULL, error_message);                                            \
        return NULL;                                                                             \
    } while (0)

#define NAPI_CHECK_STATUS_THROW(env, status, msg) \
    do                                            \
    {                                             \
        if ((status) != napi_ok)                  \
        {                                         \
            NAPI_THROW_ERROR((env), (msg));       \
        }                                         \
    } while (0)

#define NAPI_CHECK_STATUS_THROW_VOID(env, status, msg) \
    do                                                \
    {                                                \
        if ((status) != napi_ok)                     \
        {                                            \
            char error_message[256];                 \
            snprintf(error_message, sizeof(error_message), "[%s:%d] %s", __FILE__, __LINE__, (msg)); \
            napi_throw_error((env), NULL, error_message); \
            return;                                  \
        }                                            \
    } while (0)


#define NAPI_CHECK_CONDITION_THROW(env, condition, msg) \
    do                                                  \
    {                                                   \
        if (!(condition))                               \
        {                                               \
            NAPI_THROW_ERROR((env), (msg));             \
        }                                               \
    } while (0)

#define NAPI_CHECK_CONDITION_THROW_AND_CLEANUP(env, condition, msg, cleanup) \
    do                                                                       \
    {                                                                        \
        if (!(condition))                                                    \
        {                                                                    \
            cleanup;                                                         \
            NAPI_THROW_ERROR((env), (msg));                                  \
        }                                                                    \
    } while (0)

#define NAPI_CHECK_STATUS_THROW_CLEANUP(env, status, msg, cleanup) \
    do                                                             \
    {                                                              \
        if ((status) != napi_ok)                                   \
        {                                                          \
            cleanup;                                               \
            NAPI_THROW_ERROR((env), (msg));                        \
        }                                                          \
    } while (0)

#endif // NAPI_HELPERS_H