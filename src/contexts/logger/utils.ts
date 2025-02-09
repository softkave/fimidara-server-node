import {ConsoleLogger} from './console.js';
import {NoopLogger} from './noop.js';
import {Logger, LoggerType, kLoggerTypes} from './types.js';

export function getLogger(type: LoggerType = kLoggerTypes.noop): Logger {
  switch (type) {
    case kLoggerTypes.console:
      return new ConsoleLogger();
    case kLoggerTypes.noop:
      return new NoopLogger();
  }
}
