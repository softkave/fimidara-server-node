import {isString} from 'lodash';
import {kUtilsInjectables} from '../endpoints/contexts/injection/injectables';
import OperationError from './OperationError';
import {ServerError} from './errors';
import {kReuseableErrors} from './reusableErrors';
import {AnyFn} from './types';

export function appAssert(
  value: unknown,
  response: string | Error | AnyFn = new ServerError(),
  logMessage?: string
): asserts value {
  if (!value) {
    if (logMessage) {
      kUtilsInjectables.logger().error(logMessage);
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
  appAssert(item, kReuseableErrors.common.notFound());
}
