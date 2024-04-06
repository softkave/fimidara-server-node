import {isObject} from 'lodash';
import {FimidaraWorkerMessage} from './types';

export function isFimidaraWorkerMessage(
  message: unknown
): message is FimidaraWorkerMessage {
  return isObject(message) && !!(message as FimidaraWorkerMessage).type;
}
