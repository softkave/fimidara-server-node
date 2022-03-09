import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPermissionItemsForTestUsingOwnerAndBase,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getEntityPermissionItems from './handler';
import {IGetEntityPermissionItemsParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('entity permission items returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {preset} = await insertPresetForTest(
    context,
    userToken,
    organization.resourceId
  );

  const {items} = await insertPermissionItemsForTestUsingOwnerAndBase(
    context,
    userToken,
    organization.resourceId,
    {
      permissionEntityId: preset.resourceId,
      permissionEntityType: AppResourceType.PresetPermissionsGroup,
    },
    {
      permissionOwnerId: organization.resourceId,
      permissionOwnerType: AppResourceType.Organization,
    },
    {itemResourceType: AppResourceType.File}
  );

  const instData =
    RequestData.fromExpressRequest<IGetEntityPermissionItemsParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        organizationId: organization.resourceId,
        permissionEntityId: preset.resourceId,
        permissionEntityType: AppResourceType.PresetPermissionsGroup,
      }
    );

  const result = await getEntityPermissionItems(context, instData);
  assertEndpointResultOk(result);
  expect(result.items).toEqual(items);
});
