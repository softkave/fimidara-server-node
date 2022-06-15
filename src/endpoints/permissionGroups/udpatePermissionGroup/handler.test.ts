import {faker} from '@faker-js/faker';
import {AppResourceType, SessionAgentType} from '../../../definitions/system';
import {withAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import PermissionGroupQueries from '../queries';
import {permissionGroupExtractor} from '../utils';
import updatePermissionGroup from './handler';
import {
  IUpdatePermissionGroupEndpointParams,
  IUpdatePermissionGroupInput,
} from './types';

/**
 * TODO:
 * - [Low] Test that hanlder fails if assigned permissionGroups doesn't exist
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('permissionGroup updated', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {permissionGroup: permissionGroup00} =
    await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );

  const {permissionGroup: permissionGroup01} =
    await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );

  const {permissionGroup: permissionGroup02} =
    await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );

  const updatePermissionGroupInput: IUpdatePermissionGroupInput = {
    name: faker.lorem.words(2),
    description: faker.lorem.words(10),
    permissionGroups: [
      {
        permissionGroupId: permissionGroup01.resourceId,
        order: 1,
      },
      {
        permissionGroupId: permissionGroup02.resourceId,
        order: 2,
      },
    ],
  };

  const instData =
    RequestData.fromExpressRequest<IUpdatePermissionGroupEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        permissionGroupId: permissionGroup00.resourceId,
        permissionGroup: updatePermissionGroupInput,
      }
    );

  const result = await updatePermissionGroup(context, instData);
  assertEndpointResultOk(result);

  const updatedPermissionGroup = await withAssignedPermissionGroupsAndTags(
    context,
    workspace.resourceId,
    await context.data.permissiongroup.assertGetItem(
      PermissionGroupQueries.getById(permissionGroup00.resourceId)
    ),
    AppResourceType.PermissionGroup
  );

  expect(permissionGroupExtractor(updatedPermissionGroup)).toMatchObject(
    result.permissionGroup
  );
  expect(updatedPermissionGroup.name).toEqual(updatePermissionGroupInput.name);
  expect(updatedPermissionGroup.description).toEqual(
    updatePermissionGroupInput.description
  );
  expect(result.permissionGroup.permissionGroups.length).toEqual(2);
  expect(result.permissionGroup.permissionGroups[0]).toMatchObject({
    permissionGroupId: permissionGroup01.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 1,
  });

  expect(result.permissionGroup.permissionGroups[1]).toMatchObject({
    permissionGroupId: permissionGroup02.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 2,
  });
});
