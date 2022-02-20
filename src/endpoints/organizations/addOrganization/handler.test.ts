import * as faker from 'faker';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  assertContext,
  getTestBaseContext,
  insertOrganizationForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';
import OrganizationQueries from '../queries';
import {IAddOrganizationParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('organization created', async () => {
  assertContext(context);
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

  expect(result.organization).toMatchObject(companyInput);
  const savedCompany = await context.data.organization.assertGetItem(
    OrganizationQueries.getById(result.organization.resourceId)
  );

  expect(result.organization).toMatchObject(savedCompany);
});
