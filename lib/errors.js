class ConfigError extends Error {
    constructor(message) {
        super(message); // Calls the parent class (Error) constructor with the error message
        this.name = 'ConfigError';
    }
}

class TunnelError extends Error {
    constructor(message) {
        super(message); // Calls the parent class (Error) constructor with the error message
        this.name = 'TunnelError';
    }
}

module.exports = { ConfigError, TunnelError };