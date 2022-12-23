import assert = require('assert');
import {capitalize} from 'lodash';
import {cast} from './fns';
import {AnyFn, AnyObject, ClassConstructor} from './types';

export type ClassFieldsWithAccessorFields<Klass> = {
  [Key in keyof Klass]: Key extends string
    ? Key extends AnyFn
      ? Key
      : `set${Capitalize<Key>}` | `get${Capitalize<Key>}` | `assertGet${Capitalize<Key>}` | Key
    : Key;
}[keyof Klass];

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
    return obj[k];
  };
}

export function makeSetAccessor<T, K extends keyof T>(obj: T, k: K) {
  return (v: T[K]) => {
    obj[k] = v;
    return obj;
  };
}

export function addClassAccessors(klass: AnyObject) {
  for (const key in klass) {
    const setAccessorName = `set${capitalize(key)}`;
    const getAccessorName = `get${capitalize(key)}`;
    const assertGetAccessorName = `assertGet${capitalize(key)}`;
    if (!klass[setAccessorName]) {
      klass[setAccessorName] = (value: any) => {
        klass[key] = value;
        return klass;
      };
    }

    if (!klass[getAccessorName]) {
      klass[getAccessorName] = () => klass[key];
    }

    if (!klass[assertGetAccessorName]) {
      klass[assertGetAccessorName] = () => {
        assert(klass[key]);
        return klass[key];
      };
    }
  }
}

export function withClassAccessors<Klass extends ClassConstructor>(klass: Klass) {
  return cast<new (...args: ConstructorParameters<Klass>) => ClassFieldsWithAccessorsMixin<InstanceType<Klass>>>(
    class extends klass {
      constructor(...props: any[]) {
        super(...props);
        addClassAccessors(this);
      }
    }
  );
}
