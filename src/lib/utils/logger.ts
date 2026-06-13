export const PRETTY_OPTS = { colorize: true, ignore: 'hostname' };

const isBrowser = typeof window !== 'undefined';

interface BrowserLogger {
  level: string;
  trace: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  fatal: (...args: unknown[]) => void;
  child: () => BrowserLogger;
}

function createLogger(): BrowserLogger {
  if (isBrowser) {
    const levelStyles: Record<string, string> = {
      trace: 'color:#888',
      debug: 'color:#3b82f6',
      info: 'color:#22c55e',
      warn: 'color:#eab308',
      error: 'color:#ef4444',
      fatal: 'color:#dc2626;font-weight:bold',
    };

    const log = (level: string, style: string, ...args: unknown[]) => {
      const ts = new Date().toISOString().slice(11, 19);
      (console[level === 'fatal' ? 'error' : (level as keyof Console)] as Console['log'])(
        `%c${ts} %c${level.toUpperCase().padEnd(5)}%c`,
        'color:#888',
        style,
        '',
        ...args,
      );
    };

    return {
      level: 'trace',
      trace: (...args: unknown[]) => log('trace', levelStyles.trace, ...args),
      debug: (...args: unknown[]) => log('debug', levelStyles.debug, ...args),
      info: (...args: unknown[]) => log('info', levelStyles.info, ...args),
      warn: (...args: unknown[]) => log('warn', levelStyles.warn, ...args),
      error: (...args: unknown[]) => log('error', levelStyles.error, ...args),
      fatal: (...args: unknown[]) => log('fatal', levelStyles.fatal, ...args),
      child: () => createLogger(),
    };
  }

  return {
    level: 'info',
    trace: console.trace.bind(console),
    debug: console.debug.bind(console),
    info: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    fatal: console.error.bind(console),
    child: () => createLogger(),
  };
}

const logger = createLogger();

export default logger;
