import {isFunction} from 'lodash-es';
import {AnyObject} from 'softkave-js-utils';
import {vi} from 'vitest';

export function mockWith(source: AnyObject, dest: AnyObject) {
  for (const key in source) {
    let value = source[key];

    if (isFunction(value)) {
      value = vi.fn(value).mockName(key);
    }

    dest[key] = value;
  }
}
