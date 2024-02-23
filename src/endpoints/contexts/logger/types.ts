import {DisposableResource} from '../../../utils/disposables';
import {ObjectValues} from '../../../utils/types';

export interface Logger extends DisposableResource {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export const kLoggerTypes = {
  console: 'console',
  noop: 'noop',
} as const;

export type LoggerType = ObjectValues<typeof kLoggerTypes>;
