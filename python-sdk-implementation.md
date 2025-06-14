Here is the order in which functions are called and callbacks are registered in `pinggy/pylib.py`:

---

### 1. **Order of Function Calls (at Tunnel Connection)**

When you create and use a `Tunnel` object, the main flow is:

1. **Tunnel Initialization (`Tunnel.__init__`)**

   - Initializes internal state, creates config and tunnel references via the native `core` module.
   - Registers callback function pointers for tunnel events (see below).
   - Calls `self.__setup_callbacks()` to register all event callbacks with the native code.

2. **Tunnel Connection (`Tunnel.connect()` or indirectly via `Tunnel.start()`)**

   - Calls `Tunnel.__connect_tunnel()` (also called by `Tunnel.start()`).
   - Inside `__connect_tunnel()`:
     - Calls `self.__prepare_n_setargument()` to prepare and set CLI-style arguments.
     - Calls `core.pinggy_tunnel_connect` to connect the tunnel.

3. **Primary Forwarding (`Tunnel.request_primary_forwarding()` or via `Tunnel.start()`)**

   - Calls `Tunnel.__internal_request_primary_forwarding()`, which:
     - Calls `core.pinggy_tunnel_request_primary_forwarding` to request forwarding.
     - Calls `self.__resume()` to start/resume event polling via `core.pinggy_tunnel_resume`.

4. **Serving Tunnel (`Tunnel.serve_tunnel()` or via `Tunnel.start()`)**
   - Calls `Tunnel.__start_serving()`, which also calls `self.__resume()`.

---

### 2. **Callback Registration Order**

In `Tunnel.__init__` and `Tunnel.__setup_callbacks`, the following callbacks are registered (in this order):

1. `core.pinggy_tunnel_set_on_connected_callback` → `self.__connected_cb` → `self.__func_connected`
2. `core.pinggy_tunnel_set_on_authenticated_callback` → `self.__authenticated_cb` → `self.__func_authenticated`
3. `core.pinggy_tunnel_set_on_authentication_failed_callback` → `self.__authentication_failed_cb` → `self.__func_authentication_failed`
4. `core.pinggy_tunnel_set_on_primary_forwarding_succeeded_callback` → `self.__primary_forwarding_succeeded_cb` → `self.__func_primary_forwarding_succeeded`
5. `core.pinggy_tunnel_set_on_primary_forwarding_failed_callback` → `self.__primary_forwarding_failed_cb` → `self.__func_primary_forwarding_failed`
6. `core.pinggy_tunnel_set_on_additional_forwarding_succeeded_callback` → `self.__additional_forwarding_succeeded_cb` → `self.__func_additional_forwarding_succeeded`
7. `core.pinggy_tunnel_set_on_additional_forwarding_failed_callback` → `self.__additional_forwarding_failed_cb` → `self.__func_additional_forwarding_failed`
8. `core.pinggy_tunnel_set_on_disconnected_callback` → `self.__disconnected_cb` → `self.__func_disconnected`
9. `core.pinggy_tunnel_set_on_tunnel_error_callback` → `self.__tunnel_error_cb` → `self.__func_tunnel_error`
10. `core.pinggy_tunnel_set_on_new_channel_callback` → `self.__new_channel_cb` → `self.__func_new_channel`

---

### 3. **Channel Callback Registration**

When a `Channel` object is created, its `__init__` registers four callbacks:

- Data received (`core.pinggy_tunnel_channel_set_data_received_callback`)
- Ready to send (`core.pinggy_tunnel_channel_set_ready_to_send_callback`)
- Error (`core.pinggy_tunnel_channel_set_error_callback`)
- Cleanup (`core.pinggy_tunnel_channel_set_cleanup_callback`)

---

### 4. **Summary Table**

| Step | Function Called / Callback Registered                | Purpose                                   |
| ---- | ---------------------------------------------------- | ----------------------------------------- |
| 1    | `Tunnel.__init__`                                    | Initialize tunnel and register callbacks  |
| 2    | `Tunnel.__setup_callbacks`                           | Register tunnel event callbacks           |
| 3    | `Tunnel.connect()` or `Tunnel.start()`               | Prepare, connect, and authenticate tunnel |
| 4    | `Tunnel.request_primary_forwarding()`                | Request forwarding/assign URLs            |
| 5    | `Tunnel.serve_tunnel()` / `Tunnel.__start_serving()` | Enter event loop for tunnel operation     |
| 6    | (When data channel is created) `Channel.__init__`    | Register channel event callbacks          |

---

**In summary:**

- Callbacks are registered during initialization, before any connection or event handling.
- The connection flow is: `__init__` → `__setup_callbacks` → `connect`/`start` → (callbacks trigger) → `request_primary_forwarding` → serving.
- For channel handling, similar callback registration occurs when a `Channel` is created.

If you want a diagram or a specific sequence for a particular entrypoint (e.g., `start_tunnel()`), let me know!
