import {NoopLogger} from './noop';
import {Logger, LoggerType, kLoggerTypes} from './types';

export function getLogger(type: LoggerType = kLoggerTypes.noop): Logger {
  switch (type) {
    case kLoggerTypes.console:
      return console;
    case kLoggerTypes.noop:
      return new NoopLogger();
  }
}
