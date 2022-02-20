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
import getOrganization from './handler';
import {IGetOrganizationEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('organization returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const instData = RequestData.fromExpressRequest<IGetOrganizationEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.resourceId,
    }
  );

  const result = await getOrganization(context, instData);
  assertEndpointResultOk(result);
  expect(result.organization).toMatchObject(organization);
});
