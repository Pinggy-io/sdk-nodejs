import fs from "fs";
import path from "path";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  ERROR = 2,
}

export class Logger {
  private static logFilePath: string = path.join(
    __dirname,
    "../../logs/pinggy.log"
  );
  private static logDir: string = path.dirname(Logger.logFilePath);

  // Debug state management
  private static debugEnabled: boolean = false;
  private static level: LogLevel = LogLevel.INFO; // Default: INFO

  public static setLevel(level: LogLevel = LogLevel.INFO): void {
    Logger.level = level;
  }

  public static setDebugEnabled(enabled: boolean): void {
    Logger.debugEnabled = enabled;
  }

  public static isDebugEnabled(): boolean {
    return Logger.debugEnabled;
  }

  private static ensureLogDirectory(): void {
    if (!fs.existsSync(Logger.logDir)) {
      fs.mkdirSync(Logger.logDir, { recursive: true });
    }
  }

  private static getISTTimestamp(): string {
    const now = new Date();
    const ISTOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const ISTTime = new Date(now.getTime() + ISTOffset)
      .toISOString()
      .replace("T", " ")
      .split(".")[0];
    return ISTTime;
  }

  private static log(
    level: LogLevel,
    message: string,
    error: Error | null = null
  ): void {

    // Log only if debugEnabled and matches the current log level
    if (!Logger.debugEnabled || level < Logger.level) return;

    const timestamp = Logger.getISTTimestamp();
    const errorMessage = error
      ? `\nError: ${error.stack || error.message}`
      : "";
    // Get file and line number from stack trace
    const stack = new Error().stack?.split("\n");
    let location = "";
    if (stack && stack.length > 3) {
      // stack[3] is the caller of Logger.info/error
      const match = stack[3].match(/\(([^)]+)\)/);
      if (match && match[1]) {
        location = match[1];
      } else {
        location = stack[3].trim();
      }
    }
    const levelName = LogLevel[level];
    const logMessage = `[${timestamp}] [${levelName.toUpperCase()}] [${location}] ${message}${errorMessage}\n`;

    // Ensure log directory exists before writing
    Logger.ensureLogDirectory();

    fs.appendFile(Logger.logFilePath, logMessage, (err) => {
      if (err) console.error("Failed to write to log file:", err);
    });

    const color = Logger.getColor(level);
    const reset = "\x1b[0m";
    const coloredLevel = color(`[${levelName}]`);
    console.log(`${coloredLevel} ${message}${reset}`);

    if (error) console.error(color(error.message));
  }

  private static getColor(level: LogLevel): (msg: string) => string {
    const reset = "\x1b[0m";
    const colors: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: "\x1b[33m", // cyan
      [LogLevel.INFO]: "\x1b[36m",  // yellow
      [LogLevel.ERROR]: "\x1b[31m", // red
    };
    const colorCode = colors[level] || "\x1b[0m";
    return (msg: string) => `${colorCode}${msg}${reset}`;
  }

  public static info(message: string): void {
    // Only log info messages if debug logging is enabled
    if (Logger.isDebugEnabled()) {
      this.log(LogLevel.INFO, message);
    }
  }

  public static debug(message: string): void {
    // Only log info messages if debug logging is enabled
    if (Logger.isDebugEnabled()) {
      this.log(LogLevel.DEBUG, message);
    }
  }

  public static error(message: string, error?: Error): void {
    if (Logger.isDebugEnabled()) {
      this.log(LogLevel.ERROR, message, error || null);
    }

  }
}
