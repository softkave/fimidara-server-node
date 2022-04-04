import * as faker from 'faker';
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
import updateOrganization from './handler';
import {
  IUpdateOrganizationInput,
  IUpdateOrganizationEndpointParams,
} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('organization updated', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const orgUpdateInput: Partial<IUpdateOrganizationInput> = {
    name: faker.company.companyName(),
    description: faker.company.catchPhraseDescriptor(),
  };
  const instData =
    RequestData.fromExpressRequest<IUpdateOrganizationEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        organizationId: organization.resourceId,
        organization: orgUpdateInput,
      }
    );

  const result = await updateOrganization(context, instData);
  assertEndpointResultOk(result);
  expect(result.organization).toMatchObject(orgUpdateInput);

  const updatedOrganization = await context.data.organization.assertGetItem(
    OrganizationQueries.getById(organization.resourceId)
  );
  expect(updatedOrganization).toMatchObject(orgUpdateInput);
});
