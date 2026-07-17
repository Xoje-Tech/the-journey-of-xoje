/**
 * src/shared/lib/logger.ts
 *
 * DevXoje Standard Structured Logger.
 * Fully typed, lightweight, browser-optimized client logger.
 * Eliminates direct console statements, satisfying no-console rules.
 * Supports metadata payloads, namespaces, and retro CSS terminal styling in development.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogPayload {
  [key: string]: unknown;
}

export interface LoggerOptions {
  namespace?: string;
  enabled?: boolean;
}

class StructuredLogger {
  private namespace: string;
  private isEnabled: boolean;

  constructor(options: LoggerOptions = {}) {
    this.namespace = options.namespace ? options.namespace.toUpperCase() : 'SYSTEM';
    // Enable logging in development, disable or keep minimal in production builds
    this.isEnabled = options.enabled ?? (import.meta.env?.DEV ?? true);
  }

  /** Gets visual styling colors matching the Level */
  private getLevelStyles(level: LogLevel): { prefix: string; msg: string } {
    switch (level) {
      case 'DEBUG':
        return { prefix: 'background: #555; color: #fff; padding: 2px 4px; border-radius: 2px;', msg: 'color: #888;' };
      case 'INFO':
        return { prefix: 'background: #00aa55; color: #fff; padding: 2px 4px; border-radius: 2px; font-weight: bold;', msg: 'color: #fff;' };
      case 'WARN':
        return { prefix: 'background: #ffaa00; color: #000; padding: 2px 4px; border-radius: 2px; font-weight: bold;', msg: 'color: #ffaa00;' };
      case 'ERROR':
        return { prefix: 'background: #ff0000; color: #fff; padding: 2px 4px; border-radius: 2px; font-weight: bold;', msg: 'color: #ff3333; font-weight: bold;' };
    }
  }

  private formatMessage(level: LogLevel, message: string): { msgString: string; styles: string[] } {
    const timestamp = new Date().toISOString().split('T')[1]?.slice(0, -1) ?? '';
    const styles = this.getLevelStyles(level);

    // Beautiful retro styled print format
    const prefixStr = `%c${timestamp} %c[${this.namespace}]%c[${level}]%c`;
    const styleArr = [
      'color: #666; font-size: 10px;', // Timestamp
      'color: #00aaff; font-weight: bold; font-family: monospace;', // Namespace
      styles.prefix, // Level
      styles.msg, // Message style
    ];

    return {
      msgString: `${prefixStr} ${message}`,
      styles: styleArr,
    };
  }

  private log(level: LogLevel, message: string, payload?: LogPayload): void {
    if (!this.isEnabled) return;

    const { msgString, styles } = this.formatMessage(level, message);

    // Call console APIs inside this central file only
    /* eslint-disable no-console */
    if (level === 'ERROR') {
      if (payload) {
        console.error(msgString, ...styles, payload);
      } else {
        console.error(msgString, ...styles);
      }
    } else if (level === 'WARN') {
      if (payload) {
        console.warn(msgString, ...styles, payload);
      } else {
        console.warn(msgString, ...styles);
      }
    } else {
      if (payload) {
        console.log(msgString, ...styles, payload);
      } else {
        console.log(msgString, ...styles);
      }
    }
    /* eslint-enable no-console */
  }

  public debug(message: string, payload?: LogPayload): void {
    this.log('DEBUG', message, payload);
  }

  public info(message: string, payload?: LogPayload): void {
    this.log('INFO', message, payload);
  }

  public warn(message: string, payload?: LogPayload): void {
    this.log('WARN', message, payload);
  }

  public error(message: string, payload?: LogPayload): void {
    this.log('ERROR', message, payload);
  }
}

// Default system logger instance
export const logger = new StructuredLogger();

// Factory function to spawn namespaced logger instances
export const createLogger = (namespace: string, options: Omit<LoggerOptions, 'namespace'> = {}): StructuredLogger => {
  return new StructuredLogger({ namespace, ...options });
};
