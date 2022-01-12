import * as faker from 'faker';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import OrganizationQueries from '../queries';
import updateOrganization from './handler';
import {IUpdateOrganizationInput, IUpdateOrganizationParams} from './types';

test('organization updated', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const orgUpdateInput: Partial<IUpdateOrganizationInput> = {
    name: faker.company.companyName(),
    description: faker.company.catchPhraseDescriptor(),
  };
  const instData = RequestData.fromExpressRequest<IUpdateOrganizationParams>(
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
