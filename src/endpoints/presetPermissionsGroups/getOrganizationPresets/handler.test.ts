import {findItemWithField} from '../../../utilities/fns';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getOrganizationPresetPermissionsGroups from './handler';
import {IGetOrganizationPresetPermissionsGroupsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test("organization's presets returned", async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {preset: preset01} = await insertPresetForTest(
    context,
    userToken,
    organization.resourceId
  );

  const {preset: preset02} = await insertPresetForTest(
    context,
    userToken,
    organization.resourceId
  );

  const instData =
    RequestData.fromExpressRequest<IGetOrganizationPresetPermissionsGroupsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        organizationId: organization.resourceId,
      }
    );

  const result = await getOrganizationPresetPermissionsGroups(
    context,
    instData
  );
  assertEndpointResultOk(result);
  const resultPreset01 = findItemWithField(
    result.presets,
    preset01.resourceId,
    'resourceId'
  );

  const resultPreset02 = findItemWithField(
    result.presets,
    preset02.resourceId,
    'resourceId'
  );
  expect(resultPreset01).toMatchObject(preset01);
  expect(resultPreset02).toMatchObject(preset02);
});
