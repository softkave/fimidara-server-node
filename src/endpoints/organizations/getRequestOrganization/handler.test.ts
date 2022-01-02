import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import getRequestOrganization from './handler';
import {requestOrganizationExtractor} from './handler';
import {IGetRequestOrganizationEndpointParams} from './types';

test('request organization returned', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const instData = RequestData.fromExpressRequest<IGetRequestOrganizationEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.organizationId,
    }
  );

  const result = await getRequestOrganization(context, instData);
  assertEndpointResultHasNoErrors(result);

  const requestOrganization = requestOrganizationExtractor(organization);
  expect(result.organization).toBe(requestOrganization);
});
