import assert = require('assert');
import {isFunction} from 'lodash';
import {capitalizeFirstLetter, cast} from './fns';
import {AnyFn, AnyObject, ClassConstructor} from './types';

type IsAccessorFnKey<F> = F extends `set${infer F1}`
  ? true
  : F extends `get${infer F1}`
  ? true
  : F extends `assertGet${infer F1}`
  ? true
  : F extends 'clone'
  ? true
  : false;

export type ClassFieldsWithAccessorFields<Klass> =
  | {
      [Key in keyof Klass]: Key extends string
        ? Key extends AnyFn
          ? Key
          : IsAccessorFnKey<Key> extends true
          ? Key
          : `set${Capitalize<Key>}` | `get${Capitalize<Key>}` | `assertGet${Capitalize<Key>}` | Key
        : Key;
    }[keyof Klass]
  | 'clone';

export type ClassFieldsWithAccessorsMixin<Class> = {
  [Key in ClassFieldsWithAccessorFields<Class>]: Key extends `set${infer OriginalField}`
    ? Uncapitalize<OriginalField> extends keyof Class
      ? /** @ts-ignore */
        // TODO: find a fix for indexing with Uncapitalize<F> without using ts-ignore
        (value: Class[Uncapitalize<OriginalField>]) => ClassFieldsWithAccessorsMixin<Class>
      : never
    : Key extends `get${infer OriginalField}`
    ? Uncapitalize<OriginalField> extends keyof Class
      ? () => Class[Uncapitalize<OriginalField>]
      : never
    : Key extends `assertGet${infer OriginalField}`
    ? Uncapitalize<OriginalField> extends keyof Class
      ? () => NonNullable<Class[Uncapitalize<OriginalField>]>
      : never
    : Key extends 'clone'
    ? () => ClassFieldsWithAccessorsMixin<Class>
    : Key extends keyof Class
    ? Class[Key]
    : never;
};

export function makeGetAccessor<T, K extends keyof T>(obj: T, k: K) {
  return () => {
    return obj[k];
  };
}

export function makeAssertGetAccessor<T, K extends keyof T>(obj: T, k: K) {
  return () => {
    assert(obj[k]);
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
export function makeClone<T extends ClassConstructor>(klass: T, cloneFrom: InstanceType<T>, addAccessors = true) {
  return () => {
    const clone = new klass();
    for (const key in cloneFrom) {
      if (isFunction(cloneFrom[key])) continue;
      clone[key] = cloneFrom[key];
    }

    if (addAccessors) {
      addClassAccessors(clone, klass);
    }

    return clone;
  };
}

export function addClassAccessors(instance: AnyObject, klass: ClassConstructor) {
  for (const key in instance) {
    if (isFunction(instance[key])) continue;

    const setAccessorName = `set${capitalizeFirstLetter(key)}`;
    const getAccessorName = `get${capitalizeFirstLetter(key)}`;
    const assertGetAccessorName = `assertGet${capitalizeFirstLetter(key)}`;

    if (!instance[setAccessorName]) {
      instance[setAccessorName] = makeSetAccessor(instance, key);
    }

    if (!instance[getAccessorName]) {
      instance[getAccessorName] = makeGetAccessor(instance, key);
    }

    if (!instance[assertGetAccessorName]) {
      instance[assertGetAccessorName] = makeAssertGetAccessor(instance, key);
    }
  }

  const cloneName = 'clone';
  if (!instance[cloneName]) {
    instance[cloneName] = makeClone(klass, instance);
  }
}

export function withClassAccessors<Klass extends ClassConstructor>(klass: Klass) {
  return cast<new (...args: ConstructorParameters<Klass>) => ClassFieldsWithAccessorsMixin<InstanceType<Klass>>>(
    class extends klass {
      constructor(...props: any[]) {
        super(...props);
        addClassAccessors(this, klass);
      }
    }
  );
}
