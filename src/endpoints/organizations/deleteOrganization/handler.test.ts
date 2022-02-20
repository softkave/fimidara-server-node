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
import OrganizationQueries from '../queries';
import deleteOrganization from './handler';
import {IDeleteOrganizationParams} from './types';

/**
 * TODO:
 * - Confirm that organization artifacts are deleted
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('organization deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const instData = RequestData.fromExpressRequest<IDeleteOrganizationParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.resourceId,
    }
  );

  const result = await deleteOrganization(context, instData);
  assertEndpointResultOk(result);
  const org = await context.data.organization.getItem(
    OrganizationQueries.getById(organization.resourceId)
  );

  expect(org).toBeFalsy();
});
