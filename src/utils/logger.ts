import fs from "fs";
import path from "path";

export class Logger {
  private static logFilePath: string = path.join(
    __dirname,
    "../../logs/pinggy.log"
  );
  private static logDir: string = path.dirname(Logger.logFilePath);

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
    level: "info" | "error",
    message: string,
    error: Error | null = null
  ): void {
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
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${location}] ${message}${errorMessage}\n`;

    // Ensure log directory exists before writing
    Logger.ensureLogDirectory();

    fs.appendFile(Logger.logFilePath, logMessage, (err) => {
      if (err) console.error("Failed to write to log file:", err);
    });
    console[level](`[${location}] ${message}`, error || "");
  }

  public static info(message: string): void {
    this.log("info", message);
  }

  public static error(message: string, error?: Error): void {
    this.log("error", message, error || null);
  }
}
