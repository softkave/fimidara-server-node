import {noop} from 'lodash-es';
import {Logger} from './types.js';

export class NoopLogger implements Logger {
  log: (...args: unknown[]) => void = noop;
  error: (...args: unknown[]) => void = noop;
}
