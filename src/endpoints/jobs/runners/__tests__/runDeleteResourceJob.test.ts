import {noop} from 'lodash';
import {completeTests} from '../../../testUtils/helpers/testFns';
import {initTests} from '../../../testUtils/testUtils';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('runDeleteResourceJob', () => {
  test('deletes', () => {
    noop();
  });
});
