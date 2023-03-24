import {getResourceAssignedItems} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import {NotFoundError} from '../../errors';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
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
  await completeTest({context});
});

test('collaborator removed', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const instData = RequestData.fromExpressRequest<IRemoveCollaboratorEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
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
    user.resourceId
  );
  expect(assignedItems.findIndex(item => item.assigneeId === workspace.resourceId)).toBe(-1);

  try {
    await getCollaborator(context, instData);
  } catch (error: any) {
    expect(error instanceof NotFoundError).toBeTruthy();
  }
});
