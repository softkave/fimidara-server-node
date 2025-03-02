import {isFunction, isObject, isString} from 'lodash-es';
import {kIjxUtils} from '../contexts/ijx/injectables.js';
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
      kIjxUtils.logger().error(logMessage);
    }

    if (isString(response)) {
      throw new Error(response);
    } else if (isFunction(response)) {
      response();
    } else if (isObject(response)) {
      throw response;
    } else {
      throw new Error('Assertion failed');
    }
  }
}

export function assertNotFound<T>(item?: T): asserts item {
  appAssert(item, kReuseableErrors.common.notFound());
}
