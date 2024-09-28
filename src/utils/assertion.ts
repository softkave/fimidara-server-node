import {isString} from 'lodash-es';
import {kUtilsInjectables} from '../contexts/injection/injectables.js';
import {ServerError} from './errors.js';
import {kReuseableErrors} from './reusableErrors.js';
import {AnyFn} from './types.js';

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
      throw new Error(response);
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
