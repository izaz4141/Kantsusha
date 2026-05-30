import pino from 'pino';

export const PRETTY_OPTS = { colorize: true, ignore: 'hostname' };

const isBrowser = typeof window !== 'undefined';

const logger = isBrowser
  ? pino({ browser: {} })
  : pino({
      transport: {
        target: 'pino-pretty',
        options: PRETTY_OPTS,
      },
    });

export default logger;
