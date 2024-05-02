import {DisposableResource} from '../../../utils/disposables.js';
import {ObjectValues} from '../../../utils/types.js';

export interface Logger extends DisposableResource {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export const kLoggerTypes = {
  console: 'console',
  noop: 'noop',
} as const;

export type LoggerType = ObjectValues<typeof kLoggerTypes>;
