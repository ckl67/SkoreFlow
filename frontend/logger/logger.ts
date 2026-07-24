import { LogLevel, parseLevel } from './levels';

type LevelConfig = {
  name: string;
  color: string;
  background?: string;
  console: (...data: unknown[]) => void;
};

class Logger {
  private moduleLevels = new Map<string, LogLevel>();

  private defaultLevel = LogLevel.INFO;

  private readonly levelConfig = new Map<LogLevel, LevelConfig>([
    [
      LogLevel.DEBUG,
      {
        name: 'DEBUG',
        color: '#FF9E9E',
        console: console.debug,
      },
    ],
    [
      LogLevel.INFO,
      {
        name: 'INFO',
        color: '#2196F3',
        console: console.info,
      },
    ],
    [
      LogLevel.WARN,
      {
        name: 'WARN',
        color: '#FF9800',
        console: console.warn,
      },
    ],
    [
      LogLevel.ERROR,
      {
        name: 'ERROR',
        color: '#F44336',
        console: console.error,
      },
    ],
    [
      LogLevel.FATAL,
      {
        name: 'FATAL',
        color: '#FFFFFF',
        background: '#B71C1C',
        console: console.error,
      },
    ],
  ]);

  private getTime(): string {
    return new Date().toLocaleTimeString('fr-FR', {
      hour12: false,
    });
  }

  setModuleLevel(module: string, level: string): void {
    this.moduleLevels.set(module, parseLevel(level));
  }

  getModuleLevel(module: string): LogLevel {
    return this.moduleLevels.get(module) ?? this.defaultLevel;
  }

  private log(level: LogLevel, module: string, message: string, ...args: unknown[]): void {
    if (level > this.getModuleLevel(module)) {
      return;
    }

    const config = this.levelConfig.get(level);

    if (!config) {
      return;
    }

    const time = this.getTime();

    let style = `
      color:${config.color};
      font-weight:bold;
    `;

    if (config.background) {
      style += `
        background:${config.background};
        padding:2px 4px;
        border-radius:3px;
      `;
    }

    config.console(`%c${time} ${config.name.padEnd(5)} [${module}]`, style, message, ...args);
  }

  debug(module: string, message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, module, message, ...args);
  }

  info(module: string, message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, module, message, ...args);
  }

  warn(module: string, message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, module, message, ...args);
  }

  error(module: string, message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, module, message, ...args);
  }

  fatal(module: string, message: string, ...args: unknown[]): void {
    this.log(LogLevel.FATAL, module, message, ...args);
  }
}

export const logger = new Logger();
