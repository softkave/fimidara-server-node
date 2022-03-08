import * as faker from 'faker';
import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';
import {
  assertContext,
  getTestBaseContext,
  insertOrganizationForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';
import OrganizationQueries from '../queries';
import {organizationExtractor} from '../utils';
import {IAddOrganizationParams} from './types';
import {DEFAULT_ADMIN_PRESET_NAME, DEFAULT_PUBLIC_PRESET_NAME} from './utils';

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
  expect(result.organization.publicPresetId).toBeTruthy();
  const savedCompany = await context.data.organization.assertGetItem(
    OrganizationQueries.getById(result.organization.resourceId)
  );

  expect(organizationExtractor(savedCompany)).toMatchObject(
    result.organization
  );

  const adminPreset = await context.data.preset.assertGetItem(
    EndpointReusableQueries.getByOrganizationAndName(
      savedCompany.resourceId,
      DEFAULT_ADMIN_PRESET_NAME
    )
  );

  await context.data.preset.assertGetItem(
    EndpointReusableQueries.getByOrganizationAndName(
      savedCompany.resourceId,
      DEFAULT_PUBLIC_PRESET_NAME
    )
  );

  const user = await context.data.user.assertGetItem(
    EndpointReusableQueries.getById(userToken.userId)
  );

  const userOrg = user.organizations.find(
    item => item.organizationId === savedCompany.resourceId
  );

  expect(userOrg).toBeTruthy();
  const assignedAdminPreset = userOrg?.presets.find(
    item => item.presetId === adminPreset.resourceId
  );

  expect(assignedAdminPreset).toBeTruthy();
});
