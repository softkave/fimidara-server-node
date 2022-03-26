import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPermissionItemsForTestByResource,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getEntityPermissionItems from './handler';
import {IGetResourcePermissionItemsParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('getResourcePermissionItems', () => {
  test('resource permission items returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {organization} = await insertOrganizationForTest(context, userToken);
    const {preset} = await insertPresetForTest(
      context,
      userToken,
      organization.resourceId
    );

    const {items} = await insertPermissionItemsForTestByResource(
      context,
      userToken,
      organization.resourceId,
      organization.resourceId,
      AppResourceType.Organization,
      organization.resourceId,
      AppResourceType.Organization,
      preset.resourceId,
      AppResourceType.PresetPermissionsGroup
    );

    const instData =
      RequestData.fromExpressRequest<IGetResourcePermissionItemsParams>(
        mockExpressRequestWithUserToken(userToken),
        {
          organizationId: organization.resourceId,
          itemResourceType: AppResourceType.Organization,
          itemResourceId: organization.resourceId,
        }
      );

    const result = await getEntityPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expect(result.items).toEqual(items);
  });
});
