import {IBaseContext} from '../../contexts/BaseContext';
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

  const updatedUser = await context.data.user.assertGetItem(
    UserQueries.getById(user.resourceId)
  );
  expect(updatedUser.organizations).toHaveLength(0);
});
