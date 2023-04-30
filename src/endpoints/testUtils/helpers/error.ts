import assert = require('assert');
import {isArray} from 'lodash';
import {AnyFn} from '../../../utils/types';

export function assertErrorHasName(error: any, expectedErrorNames: string[]) {
  const errorList = isArray(error) ? error : [error];
  const matchedTypes = expectedErrorNames.map(name => errorList.find(item => item?.name === name));
  const missingTypes: string[] = [];
  expectedErrorNames.forEach((name, i) => {
    if (!matchedTypes[i]) {
      missingTypes.push(name);
    }
  });

  assert(
    missingTypes.length === 0,
    new Error(`${missingTypes.join(', ')} not found in \n${JSON.stringify(error, null, 4)}`)
  );
}

export async function expectErrorThrown(
  fn: AnyFn,
  expectedErrorNames?: string[],
  finallyFn?: AnyFn
) {
  try {
    await fn();
    assert.fail('Error not thrown.');
  } catch (error) {
    if (expectedErrorNames) assertErrorHasName(error, expectedErrorNames);
  } finally {
    if (finallyFn) finallyFn();
  }
}
