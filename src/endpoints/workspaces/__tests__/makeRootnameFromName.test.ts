import {makeRootnameFromName} from '../utils';

test('makeRootnameFromName', () => {
  const name = 'test-&$#@$%workspace&$#@$% name&$#@$%^&*() -=+ end_ropename';
  const expected = 'test-workspace-name-end_ropename';
  const result = makeRootnameFromName(name);
  expect(result).toBe(expected);
});
