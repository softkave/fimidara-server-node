import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {kSemanticModels} from '../../contexts/injection/injectables';
import EndpointReusableQueries from '../../queries';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {permissionGroupExtractor} from '../utils';
import updatePermissionGroup from './handler';
import {UpdatePermissionGroupEndpointParams, UpdatePermissionGroupInput} from './types';

/**
 * TODO:
 * - [Low] Test that hanlder fails if assigned permissionGroups doesn't exist
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('permissionGroup updated', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {permissionGroup: permissionGroup00} = await insertPermissionGroupForTest(
    userToken,
    workspace.resourceId
  );
  await insertPermissionGroupForTest(userToken, workspace.resourceId);
  await insertPermissionGroupForTest(userToken, workspace.resourceId);

  const updatePermissionGroupInput: UpdatePermissionGroupInput = {
    name: faker.lorem.words(2),
    description: faker.lorem.words(10),
  };
  const instData = RequestData.fromExpressRequest<UpdatePermissionGroupEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      permissionGroupId: permissionGroup00.resourceId,
      data: updatePermissionGroupInput,
    }
  );

  const result = await updatePermissionGroup(instData);
  assertEndpointResultOk(result);

  const updatedPermissionGroup = await populateAssignedTags(
    workspace.resourceId,
    await kSemanticModels
      .permissionGroup()
      .assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(permissionGroup00.resourceId)
      )
  );

  expect(permissionGroupExtractor(updatedPermissionGroup)).toMatchObject(
    result.permissionGroup
  );
  expect(updatedPermissionGroup.name).toEqual(updatePermissionGroupInput.name);
  expect(updatedPermissionGroup.description).toEqual(
    updatePermissionGroupInput.description
  );
});
