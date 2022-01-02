import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import getCollaborator from './handler';
import {IGetCollaboratorParams} from './types';

test('collaborator returned', async () => {
  const context = getTestBaseContext();
  const {userToken, user} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const instData = RequestData.fromExpressRequest<IGetCollaboratorParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.organizationId,
      collaboratorId: user.userId,
    }
  );

  const result = await getCollaborator(context, instData);
  assertEndpointResultHasNoErrors(result);
  expect(result.collaborator).toEqual(user);
});
