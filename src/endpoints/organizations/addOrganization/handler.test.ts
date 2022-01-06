import * as faker from 'faker';
import {
  getTestBaseContext,
  insertOrganizationForTest,
  insertUserForTest,
} from '../../test-utils';
import OrganizationQueries from '../queries';
import {IAddOrganizationParams} from './types';

test('organization created', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const companyInput: IAddOrganizationParams = {
    name: faker.company.companyName(),
    description: faker.company.catchPhraseDescriptor(),
  };
  const result = await insertOrganizationForTest(
    context,
    userToken,
    companyInput
  );
  expect(result.organization).toEqual(companyInput);

  const savedCompany = await context.data.organization.assertGetItem(
    OrganizationQueries.getById(result.organization.organizationId)
  );
  expect(result.organization).toEqual(savedCompany);
});
