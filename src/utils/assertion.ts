import {isString} from 'lodash';
import {logger} from '../endpoints/globalUtils';
import {ServerError} from './errors';
import OperationError from './OperationError';
import {reuseableErrors} from './reusableErrors';
import {AnyFn} from './types';

export function appAssert(
  value: any,
  response: string | Error | AnyFn = new ServerError(),
  logMessage?: string
): asserts value {
  if (!value) {
    if (logMessage) {
      logger.error(logMessage);
    }

    if (isString(response)) {
      throw new OperationError(response);
    } else if (response instanceof Error) {
      throw response;
    } else if (response) {
      response();
    } else {
      throw new Error('Assertion failed');
    }
  }
}

export function assertNotFound<T>(item?: T): asserts item {
  appAssert(item, reuseableErrors.common.notFound());
}
