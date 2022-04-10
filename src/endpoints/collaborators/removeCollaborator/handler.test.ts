import {AppResourceType} from '../../../definitions/system';
import {getResourceAssignedItems} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import {NotFoundError} from '../../errors';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import UserQueries from '../../user/UserQueries';
import getCollaborator from '../getCollaborator/handler';
import removeCollaborator from './handler';
import {IRemoveCollaboratorEndpointParams} from './types';

/**
 * TODO:
 * - Check that artifacts are removed
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('collaborator removed', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const instData =
    RequestData.fromExpressRequest<IRemoveCollaboratorEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        organizationId: organization.resourceId,
        collaboratorId: user.resourceId,
      }
    );

  const result = await removeCollaborator(context, instData);
  assertEndpointResultOk(result);
  const assignedItems = await getResourceAssignedItems(
    context,
    organization.resourceId,
    user.resourceId,
    AppResourceType.User
  );

  expect(
    assignedItems.findIndex(
      item => item.assignedToItemId === organization.resourceId
    )
  ).toBe(-1);

  try {
    await getCollaborator(context, instData);
  } catch (error: any) {
    expect(error instanceof NotFoundError).toBeTruthy();
  }
});
