import assert = require('assert');
import {isFunction, isObject} from 'lodash';
import {capitalizeFirstLetter, cast} from './fns';
import {AnyFn, AnyObject, ClassConstructor} from './types';

type IsAccessorFnKey<F> = F extends `set${infer Unused}`
  ? true
  : F extends `get${infer Unused}`
  ? true
  : F extends `assertGet${infer Unused}`
  ? true
  : F extends 'clone'
  ? true
  : false;

type OmitAccessPrefix = '__';
type HasOmitAccessorPrefix<F> = F extends `${OmitAccessPrefix}${infer Unused}` ? true : false;

export type ClassFieldsWithAccessorFields<TClass> =
  | {
      [Key in keyof TClass]: Key extends string
        ? TClass[Key] extends AnyFn
          ? Key
          : IsAccessorFnKey<Key> extends true
          ? Key
          : HasOmitAccessorPrefix<Key> extends true
          ? Key
          : `set${Capitalize<Key>}` | `get${Capitalize<Key>}` | `assertGet${Capitalize<Key>}` | Key
        : Key;
    }[keyof TClass]
  | 'clone';

export type ClassFieldsWithAccessorsMixin<TClass> = {
  [Key in ClassFieldsWithAccessorFields<TClass>]: Key extends `set${infer OriginalField}`
    ? Uncapitalize<OriginalField> extends keyof TClass
      ? /** @ts-ignore */
        // TODO: find a fix for indexing with Uncapitalize<F> without using ts-ignore
        (value: TClass[Uncapitalize<OriginalField>]) => ClassFieldsWithAccessorsMixin<TClass>
      : never
    : Key extends `get${infer OriginalField}`
    ? Uncapitalize<OriginalField> extends keyof TClass
      ? () => TClass[Uncapitalize<OriginalField>]
      : never
    : Key extends `assertGet${infer OriginalField}`
    ? Uncapitalize<OriginalField> extends keyof TClass
      ? () => NonNullable<TClass[Uncapitalize<OriginalField>]>
      : never
    : Key extends 'clone'
    ? () => ClassFieldsWithAccessorsMixin<TClass>
    : Key extends keyof TClass
    ? TClass[Key]
    : never;
};

export function makeGetAccessor<T, K extends keyof T>(obj: T, k: K) {
  return () => {
    return obj[k];
  };
}

export function makeAssertGetAccessor<T, K extends keyof T>(obj: T, k: K) {
  return () => {
    assert(obj[k], `${k.toString()} is not present`);
    return obj[k] as NonNullable<T[K]>;
  };
}

export function makeSetAccessor<T, K extends keyof T>(obj: T, k: K) {
  return (v: T[K]) => {
    obj[k] = v;
    return obj;
  };
}

/**
 * Expects that contrcutor params are not required.
 */
export function makeClone<T extends ClassConstructor>(
  cloneFrom: InstanceType<T>,
  addAccessors = true
) {
  return () => {
    assert(cloneFrom.constructor);
    const clone: InstanceType<T> = new cloneFrom.constructor();
    for (const key in cloneFrom) {
      if (isFunction(cloneFrom[key])) continue;
      clone[key] = cloneFrom[key];
    }

    if (addAccessors) {
      addClassAccessors(clone);
    }

    return clone;
  };
}

export const CLASS_ACCESSORS_DEFAULT_SKIP_FIELDS_WITH_PREFIX = ['__'];

export function getClassAccessorFields(
  instance: AnyObject,
  skipFieldsWithPrefix = CLASS_ACCESSORS_DEFAULT_SKIP_FIELDS_WITH_PREFIX
) {
  const accessorFields: string[] = [];
  for (const key in instance) {
    if (isFunction(instance[key])) continue;

    // TODO: could be a potential bottleneck but since we're using only for docs
    // for now, it should be okays
    if (skipFieldsWithPrefix.some(prefix => key.startsWith(prefix))) continue;

    accessorFields.push(key);
  }

  return accessorFields;
}

export function addClassAccessors(
  instance: AnyObject,
  skipFieldsWithPrefix = CLASS_ACCESSORS_DEFAULT_SKIP_FIELDS_WITH_PREFIX
) {
  const accessorFields = getClassAccessorFields(instance, skipFieldsWithPrefix);
  accessorFields.forEach(key => {
    const setAccessorName = `set${capitalizeFirstLetter(key)}`;
    const getAccessorName = `get${capitalizeFirstLetter(key)}`;
    const assertGetAccessorName = `assertGet${capitalizeFirstLetter(key)}`;

    if (!instance[setAccessorName]) instance[setAccessorName] = makeSetAccessor(instance, key);
    if (!instance[getAccessorName]) instance[getAccessorName] = makeGetAccessor(instance, key);
    if (!instance[assertGetAccessorName])
      instance[assertGetAccessorName] = makeAssertGetAccessor(instance, key);
  });

  const cloneName = 'clone';
  instance[cloneName] = makeClone(instance);
}

export function accessorFieldsToObject(
  instance: any,
  skipFieldsWithPrefix = CLASS_ACCESSORS_DEFAULT_SKIP_FIELDS_WITH_PREFIX
) {
  if (!isObject(instance)) return instance;

  const json: AnyObject = {};
  const accessorFields = getClassAccessorFields(instance, skipFieldsWithPrefix);
  accessorFields.forEach(key => {
    json[key] = accessorFieldsToObject((instance as AnyObject)[key], skipFieldsWithPrefix);
  });

  return json;
}

// TODO: look into using applyMixins function in './fns.ts' file
export function withClassAccessors<TClass extends ClassConstructor>(classType: TClass) {
  return cast<
    new (...args: ConstructorParameters<TClass>) => ClassFieldsWithAccessorsMixin<
      InstanceType<TClass>
    >
  >(
    class extends classType {
      constructor(...props: any[]) {
        super(...props);
        addClassAccessors(this);
      }
    }
  );
}

export abstract class AccessorConstruct {
  static construct<TClass extends ClassConstructor>(
    ClassType: TClass
  ): ClassFieldsWithAccessorsMixin<TClass> {
    const instance = new ClassType();
    addClassAccessors(instance);
    return instance as unknown as ClassFieldsWithAccessorsMixin<TClass>;
  }

  static makeConstruct<TClass extends ClassConstructor>(ClassType: TClass) {
    return () => AccessorConstruct.construct(ClassType);
  }

  static wrap<T>(instance: T) {
    addClassAccessors(instance as any);
    return instance as unknown as ClassFieldsWithAccessorsMixin<T>;
  }
}
