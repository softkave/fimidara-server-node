import {logger} from '../endpoints/contexts/logger';
import {AnyFn} from '../utilities/types';

export function logScriptMessage(fn: AnyFn, message: string) {
  logger.info(`script ${fn.name}: ${message}`);
}

export function logScriptStarted(fn: AnyFn) {
  logScriptMessage(fn, 'started');
}

export function logScriptSuccessful(fn: AnyFn) {
  logScriptMessage(fn, 'succeeded');
}

export function logScriptFailed(fn: AnyFn, error?: Error) {
  logScriptMessage(fn, 'failed');
  if (error) {
    logger.error(error);
  }
}
