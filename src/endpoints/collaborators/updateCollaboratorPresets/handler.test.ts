import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import UserQueries from '../../user/UserQueries';
import removeCollaborator from './handler';
import {IUpdateCollaboratorPresetsParams} from './types';

/**
 * TODO:
 * - Check that artifacts are removed
 */

test('collaborator presets updated', async () => {
  const context = getTestBaseContext();
  const {userToken, user} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const instData = RequestData.fromExpressRequest<IUpdateCollaboratorPresetsParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.organizationId,
      collaboratorId: user.userId,
    }
  );

  const result = await removeCollaborator(context, instData);
  assertEndpointResultHasNoErrors(result);

  const updatedUser = await context.data.user.assertGetItem(
    UserQueries.getById(user.userId)
  );
  expect(updatedUser.organizations).toHaveLength(0);
});
