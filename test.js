const addon = require('./build/Release/addon');

// Create a new config
const config = addon.createConfig();
console.log(config); // This will be an external value representing the config