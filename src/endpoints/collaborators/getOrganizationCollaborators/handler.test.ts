import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import getCollaborator from './handler';
import {IGetOrganizationCollaboratorsParams} from './types';

/**
 * TODO:
 * - Check that only permitted collaborators are returned
 */

test('organization collaborators returned', async () => {
  const context = getTestBaseContext();
  const {userToken, user} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const instData = RequestData.fromExpressRequest<IGetOrganizationCollaboratorsParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.organizationId,
    }
  );

  const result = await getCollaborator(context, instData);
  assertEndpointResultHasNoErrors(result);
  expect(result.collaborators).toContain(user);
});
