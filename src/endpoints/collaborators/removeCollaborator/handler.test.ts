import {AppResourceType} from '../../../definitions/system';
import {getResourceAssignedItems} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import {NotFoundError} from '../../errors';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getCollaborator from '../getCollaborator/handler';
import removeCollaborator from './handler';
import {IRemoveCollaboratorEndpointParams} from './types';

/**
 * TODO:
 * - Check that artifacts are removed
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('collaborator removed', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const instData =
    RequestData.fromExpressRequest<IRemoveCollaboratorEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId: workspace.resourceId,
        collaboratorId: user.resourceId,
      }
    );

  const result = await removeCollaborator(context, instData);
  assertEndpointResultOk(result);
  const assignedItems = await getResourceAssignedItems(
    context,
    workspace.resourceId,
    user.resourceId,
    AppResourceType.User
  );

  expect(
    assignedItems.findIndex(
      item => item.assignedToItemId === workspace.resourceId
    )
  ).toBe(-1);

  try {
    await getCollaborator(context, instData);
  } catch (error: any) {
    expect(error instanceof NotFoundError).toBeTruthy();
  }
});
