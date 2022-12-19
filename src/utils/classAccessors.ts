import {capitalize} from 'lodash';
import {cast} from './fns';
import {AnyFn, AnyObject, ClassConstructor} from './types';

export type ClassFieldsWithAccessorFields<Klass> = {
  [Key in keyof Klass]: Key extends string
    ? Key extends AnyFn
      ? Key
      : `set${Capitalize<Key>}` | `get${Capitalize<Key>}` | Key
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
    : Key extends keyof Class
    ? Class[Key]
    : never;
};

export function addClassAccessors(klass: AnyObject) {
  for (const key in klass) {
    klass[`set${capitalize(key)}`] = (value: any) => {
      klass[key] = value;
      return klass;
    };

    klass[`get${capitalize(key)}`] = () => klass[key];
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
