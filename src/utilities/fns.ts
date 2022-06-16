import {compact, isString} from 'lodash';
import OperationError from './OperationError';
import {AnyFn, AnyObject} from './types';

export default function cast<ToType>(resource: any): ToType {
  return resource as unknown as ToType;
}

export function isObjectEmpty(data: Record<string | number, any>) {
  return Object.keys(data).length === 0;
}

export function getFirstArg<T extends any[]>(...args: T): T[0] {
  return args[0];
}

/* eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
export async function noopAsync(...args: any) {}

export function applyMixins(derivedConstructors: any, baseConstructors: any[]) {
  baseConstructors.forEach(baseConstructor => {
    Object.getOwnPropertyNames(baseConstructor.prototype).forEach(name => {
      if (name !== 'constructor') {
        derivedConstructors.prototype[name] = baseConstructor.prototype[name];
      }
    });
  });
}

export function applyMixins02<C1, C2>(
  derivedConstructors: C1,
  baseConstructors: [C2]
): C1 & C2 {
  return cast(applyMixins(derivedConstructors, baseConstructors));
}

export function applyMixins03<C1, C2, C3>(
  derivedConstructors: C1,
  baseConstructors: [C2, C3]
): C1 & C2 & C3 {
  return cast(applyMixins(derivedConstructors, baseConstructors));
}

export function applyMixins04<C1, C2, C3, C4>(
  derivedConstructors: C1,
  baseConstructors: [C2, C3, C4]
): C1 & C2 & C3 & C4 {
  return cast(applyMixins(derivedConstructors, baseConstructors));
}

export function findItemWithField<T>(
  items: T[],
  val: any,
  field: keyof T
): T | undefined {
  return items.find(item => {
    return item[field] === val;
  });
}

export function appAssert(
  value: any,
  response?: string | Error | AnyFn,
  logMessage?: string
): asserts value {
  if (!value) {
    if (logMessage) {
      console.error(logMessage);
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

export function makeKey(fields: any[], separator = '-', omitFalsy = true) {
  if (omitFalsy) {
    fields = compact(fields);
  }

  return fields.join(separator);
}

export function objectHasData(data: AnyObject) {
  return Object.keys(data).length > 0;
}

export function waitTimeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
