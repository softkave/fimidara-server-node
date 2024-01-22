import {isFunction} from 'lodash';
import {AnyObject} from '../../../utils/types';
import {ITestFilePersistenceProviderContext} from '../context/types';

export function mockWith(source: AnyObject, dest: AnyObject) {
  for (const key in source) {
    let value = source[key];

    if (isFunction(value)) {
      value = jest.fn(value).mockName(key);
    }

    dest[key as keyof ITestFilePersistenceProviderContext] = value;
  }
}
