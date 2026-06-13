import pino from 'pino';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Writable } from 'node:stream';
import { dirname } from 'node:path';
import { dev } from '$app/environment';
import { PRETTY_OPTS } from '$lib/utils/logger';

const MAX_LINES = 1000;

function createFileStream(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true });

  let lineCount = 0;
  try {
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      lineCount = content.split('\n').filter(Boolean).length;
    }
  } catch {
    /* ignore */
  }

  return new Writable({
    write(chunk, _encoding, callback) {
      const str = chunk.toString();
      const newLines = str.split('\n').length - 1;

      if (lineCount + newLines > MAX_LINES) {
        writeFileSync(filePath, str);
        lineCount = newLines;
      } else {
        writeFileSync(filePath, str, { flag: 'a' });
        lineCount += newLines;
      }
      callback();
    },
  });
}

const logfilePath = process.env.KANTSUSHA_LOGFILE_PATH;
const level = process.env.KANTSUSHA_LOG_LEVEL ?? 'info';

let logger: pino.Logger;

if (dev) {
  const transport = pino.transport({ target: 'pino-pretty', options: PRETTY_OPTS });
  logger = logfilePath
    ? pino(
        { level },
        pino.multistream([
          { stream: transport, level },
          { stream: createFileStream(logfilePath), level },
        ]),
      )
    : pino({ level }, transport);
} else if (logfilePath) {
  logger = pino(
    { level },
    pino.multistream([
      { stream: pino.destination(1), level },
      { stream: createFileStream(logfilePath), level },
    ]),
  );
} else {
  logger = pino({ level });
}

export default logger;
