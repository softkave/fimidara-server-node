import {isUndefined, noop} from 'lodash';
import cast from './fns';

export type SingletonFnInit<Data> = () => Data;
export type SingletonFnDispose<Data> = (data: Data) => void | Promise<void>;

export interface ISingletonFn<Data> {
  // manually cleanup anything that needs to be cleaned
  // before calling invalidate
  invalidate: () => void;
  release: () => Promise<void>;
  (): Data;
}

export default function singletonFunc<Data>(
  init: SingletonFnInit<Data>,
  disposeFn: SingletonFnDispose<Data> = noop
): ISingletonFn<Data> {
  let data: Data | undefined = undefined;
  let refs = 0;

  // singleton function
  const fn = () => {
    refs++;
    console.log('singletonFunc: refs++ ', refs);
    if (isUndefined(data)) {
      data = init();
    }

    return data;
  };

  const invalidate = () => {
    data = undefined;
  };

  const release = async () => {
    refs--;
    console.log('singletonFunc: refs-- ', refs);
    if (refs === 0 && !isUndefined(data)) {
      await disposeFn(data);
      data = undefined;
    }
  };

  cast<ISingletonFn<Data>>(fn).invalidate = invalidate;
  cast<ISingletonFn<Data>>(fn).release = release;
  return cast<ISingletonFn<Data>>(fn);
}
