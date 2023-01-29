import {IBaseContext} from '../../contexts/types';
import {assertContext, initTestBaseContext} from '../../test-utils/test-utils';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('getEntityAssignedPermissionGroups', () => {
  test("entity's assigned permissionGroups returned", async () => {
    assertContext(context);
  });

  test('pagination', async () => {
    assertContext(context);
  });
});
