// src/utils/logger.js
const fs = require("fs");
const path = require("path");

class Logger {
  static logFilePath = path.join(__dirname, "../../logs/pinggy.log");

  static getISTTimestamp() {
    const now = new Date();
    const ISTOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const ISTTime = new Date(now.getTime() + ISTOffset).toISOString().replace("T", " ").split(".")[0];
    return ISTTime;
  }

  static log(level, message, error = null) {
    const timestamp = Logger.getISTTimestamp();
    const errorMessage = error ? `\nError: ${error.stack || error.message}` : "";
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}${errorMessage}\n`;

    fs.appendFile(Logger.logFilePath, logMessage, (err) => {
      if (err) console.error("Failed to write to log file:", err);
    });
    console[level](message, error || "");
  }

  static info(message) {
    this.log("info", message);
  }

  static error(message, error) {
    this.log("error", message, error);
  }
}

module.exports = Logger;
