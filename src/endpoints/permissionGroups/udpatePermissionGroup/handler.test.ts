import {faker} from '@faker-js/faker';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {permissionGroupExtractor} from '../utils';
import updatePermissionGroup from './handler';
import {IUpdatePermissionGroupEndpointParams, IUpdatePermissionGroupInput} from './types';

/**
 * TODO:
 * - [Low] Test that hanlder fails if assigned permissionGroups doesn't exist
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('permissionGroup updated', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {permissionGroup: permissionGroup00} = await insertPermissionGroupForTest(
    context,
    userToken,
    workspace.resourceId
  );
  const {permissionGroup: permissionGroup01} = await insertPermissionGroupForTest(
    context,
    userToken,
    workspace.resourceId
  );
  const {permissionGroup: permissionGroup02} = await insertPermissionGroupForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const updatePermissionGroupInput: IUpdatePermissionGroupInput = {
    name: faker.lorem.words(2),
    description: faker.lorem.words(10),
  };
  const instData = RequestData.fromExpressRequest<IUpdatePermissionGroupEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      permissionGroupId: permissionGroup00.resourceId,
      data: updatePermissionGroupInput,
    }
  );

  const result = await updatePermissionGroup(context, instData);
  assertEndpointResultOk(result);

  const updatedPermissionGroup = await populateAssignedTags(
    context,
    workspace.resourceId,
    await context.data.permissionGroup.assertGetOneByQuery(
      EndpointReusableQueries.getByResourceId(permissionGroup00.resourceId)
    )
  );

  expect(permissionGroupExtractor(updatedPermissionGroup)).toMatchObject(result.permissionGroup);
  expect(updatedPermissionGroup.name).toEqual(updatePermissionGroupInput.name);
  expect(updatedPermissionGroup.description).toEqual(updatePermissionGroupInput.description);
});
