import assert from 'assert';
import {isArray} from 'lodash';
import {AnyFn} from '../../../utilities/types';

export function assertResultErrorsIncludes(
  error: any,
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

  assert(
    missingTypes.length === 0,
    new Error(`${missingTypes.join(', ')} not found in ${error}`)
  );
}

export async function expectErrorThrown(
  fn: AnyFn,
  expectedErrorNames: string[]
) {
  try {
    await fn();
  } catch (error) {
    assertResultErrorsIncludes(error, expectedErrorNames);
  }
}
