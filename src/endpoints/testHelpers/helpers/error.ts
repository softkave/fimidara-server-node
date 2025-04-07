import assert from 'assert';
import {isArray, isFunction, isObject, isUndefined} from 'lodash-es';
import {format} from 'util';
import {AnyFn} from '../../../utils/types.js';

export function assertErrorHasName(
  error: unknown,
  expectedErrorNames: string[]
) {
  const errorList = isArray(error) ? error : [error];
  const matchedTypes = expectedErrorNames.map(name =>
    errorList.find(item => item?.name === name)
  );
  const missingTypes: string[] = [];
  expectedErrorNames.forEach((name, i) => {
    if (!matchedTypes[i]) {
      missingTypes.push(name);
    }
  });

  const missingError = new Error(
    `${missingTypes.join(', ')} not found in \n${format(error)}`
  );

  assert(missingTypes.length === 0, missingError);
}

export async function expectErrorThrown(
  fn: AnyFn,
  expected?: string[] | AnyFn<[unknown], Error | boolean | void>,
  finallyFn?: AnyFn
) {
  try {
    await fn();
    assert.fail('Error not thrown');
  } catch (error) {
    if (isFunction(expected)) {
      const assertionResult = expected(error);

      if (!isUndefined(assertionResult)) {
        assert(
          assertionResult,
          isObject(assertionResult) ? assertionResult : 'Expectation not met'
        );
      }
    } else if (expected) {
      assertErrorHasName(error, expected);
    }
  } finally {
    if (finallyFn) {
      finallyFn();
    }
  }
}
