import {isFunction} from 'lodash-es';
import {vi} from 'vitest';
import {AnyObject} from '../../../utils/types.js';

export function mockWith(source: AnyObject, dest: AnyObject) {
  for (const key in source) {
    let value = source[key];

    if (isFunction(value)) {
      value = vi.fn(value).mockName(key);
    }

    dest[key] = value;
  }
}
