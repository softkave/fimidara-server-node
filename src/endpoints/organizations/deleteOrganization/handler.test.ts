import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import OrganizationQueries from '../queries';
import deleteOrganization from './handler';
import {IDeleteOrganizationParams} from './types';

/**
 * TODO:
 * - Confirm that organization artifacts are deleted
 */

test('organization deleted', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const instData = RequestData.fromExpressRequest<IDeleteOrganizationParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.organizationId,
    }
  );

  const result = await deleteOrganization(context, instData);
  assertEndpointResultHasNoErrors(result);
  const org = await context.data.organization.getItem(
    OrganizationQueries.getById(organization.organizationId)
  );

  expect(org).toBeFalsy();
});
