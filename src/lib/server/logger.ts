import pino from 'pino';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Writable } from 'node:stream';
import { dirname } from 'node:path';
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
const streams: pino.StreamEntry[] = [
  { stream: pino.transport({ target: 'pino-pretty', options: PRETTY_OPTS }) },
];

if (logfilePath) {
  streams.push({ stream: createFileStream(logfilePath) });
}

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' }, pino.multistream(streams));

export default logger;
