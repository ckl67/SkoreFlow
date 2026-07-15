export enum LogLevel {
  FATAL = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

export function parseLevel(level: string): LogLevel {
  switch (level.toLowerCase()) {
    case 'fatal':
      return LogLevel.FATAL;

    case 'error':
      return LogLevel.ERROR;

    case 'warn':
      return LogLevel.WARN;

    case 'info':
      return LogLevel.INFO;

    case 'debug':
      return LogLevel.DEBUG;

    default:
      return LogLevel.INFO;
  }
}
