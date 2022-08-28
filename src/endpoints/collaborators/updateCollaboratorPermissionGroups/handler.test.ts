import {SessionAgentType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import UserQueries from '../../user/UserQueries';
import {extractCollaborator} from '../extractCollaborator';
import updateCollaboratorPermissionGroups from './handler';
import {IUpdateCollaboratorPermissionGroupsEndpointParams} from './types';

/**
 * TODO:
 * - Test that hanlder fails if permissionGroup doesn't exist
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('collaborator permission groups updated', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
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

  const instData =
    RequestData.fromExpressRequest<IUpdateCollaboratorPermissionGroupsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId: workspace.resourceId,
        collaboratorId: user.resourceId,
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
      }
    );

  const result = await updateCollaboratorPermissionGroups(context, instData);
  assertEndpointResultOk(result);

  const updatedCollaborator = await extractCollaborator(
    context,
    await context.data.user.assertGetItem(UserQueries.getById(user.resourceId)),
    workspace.resourceId
  );

  expect(updatedCollaborator).toMatchObject(result.collaborator);
  expect(updatedCollaborator.permissionGroups).toBeTruthy();
  expect(updatedCollaborator.permissionGroups.length).toBeGreaterThan(0);
  expect(updatedCollaborator.permissionGroups[0]).toMatchObject({
    permissionGroupId: permissionGroup01.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 1,
  });

  expect(updatedCollaborator.permissionGroups[1]).toMatchObject({
    permissionGroupId: permissionGroup02.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 2,
  });
});
