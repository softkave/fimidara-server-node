import assert from 'assert';
import {cloneDeep, isFunction, isObject} from 'lodash-es';
import {AnyFn, AnyObject} from 'softkave-js-utils';
import {mergeData} from './fns.js';

export function makeGetAccessor<T, K extends keyof T>(obj: T, k: K) {
  return () => {
    return obj[k];
  };
}

export function makeAssertGetAccessor<T, K extends keyof T>(obj: T, k: K) {
  return () => {
    const v = obj[k];
    assert(v, `${k.toString()} is not present`);
    return v as NonNullable<T[K]>;
  };
}

export function makeSetAccessor<T, K extends keyof T = keyof T>(obj: T, k: K) {
  return (v: T[K]) => {
    obj[k] = v;
    return obj;
  };
}

export function makeClone<T extends object>(cloneFrom: T) {
  return () => {
    return cloneDeep(cloneFrom);
  };
}

export const kClassAccessorsDefaultSkipFieldsWithPrefix = ['__'];

export function getClassAccessorFields(
  instance: AnyObject,
  skipFieldsWithPrefix = kClassAccessorsDefaultSkipFieldsWithPrefix
) {
  const accessorFields: string[] = [];
  for (const key in instance) {
    if (isFunction(instance[key])) continue;

    // TODO: could be a potential bottleneck but since we're using only for docs
    // for now, it should be okay
    if (skipFieldsWithPrefix.some(prefix => key.startsWith(prefix))) continue;

    accessorFields.push(key);
  }

  return accessorFields;
}

/**
 * `augmenter` is passed along with `skipFieldsWithPrefix` to all recursive
 * calls, meaning fields nested deep within with prefixes found in
 * `skipFieldsWithPrefix` will be omitted, and `augementer` will be called for
 * each one of them. So you should have a way of filtering or determining if you
 * want to augement an instance or not.
 */
export function accessorFieldsToObject(
  instance: any,
  skipFieldsWithPrefix = kClassAccessorsDefaultSkipFieldsWithPrefix,

  /**
   * `Param 0` is raw instance,
   * `Param 1` is extracted instance,
   * `Result` is object to merge with extracted instance.
   */
  augmenter: AnyFn<[AnyObject, AnyObject], AnyObject> = () => ({})
) {
  if (!isObject(instance)) return instance;

  const json: AnyObject = {};
  const accessorFields = getClassAccessorFields(instance, skipFieldsWithPrefix);
  accessorFields.forEach(key => {
    json[key] = accessorFieldsToObject(
      (instance as AnyObject)[key],
      skipFieldsWithPrefix,
      augmenter
    );
  });
  const augment = augmenter(instance, json);

  return mergeData(json, augment, {arrayUpdateStrategy: 'replace'});
}
