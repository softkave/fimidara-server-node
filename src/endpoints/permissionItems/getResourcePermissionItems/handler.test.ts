import faker = require('faker');
import {
  AppResourceType,
  BasicCRUDActions,
  getOrgActionList,
} from '../../../definitions/system';
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
import {expectItemsPresent} from '../../test-utils/helpers/permissionItem';
import addPermissionItems from '../addItems/handler';
import {
  IAddPermissionItemsEndpointParams,
  INewPermissionItemInput,
} from '../addItems/types';
import getEntityPermissionItems from './handler';
import {IGetResourcePermissionItemsEndpointParams} from './types';

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

    const inputItems: INewPermissionItemInput[] = getOrgActionList().map(
      action => ({
        action: action as BasicCRUDActions,
        isExclusion: faker.datatype.boolean(),
        isForPermissionOwner: faker.datatype.boolean(),
        itemResourceType: AppResourceType.Organization,
        permissionEntityId: preset.resourceId,
        permissionEntityType: AppResourceType.PresetPermissionsGroup,
        permissionOwnerId: organization.resourceId,
        permissionOwnerType: AppResourceType.Organization,
        itemResourceId: organization.resourceId,
      })
    );

    const addPermissionItemsReqData =
      RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {items: inputItems, organizationId: organization.resourceId}
      );

    const addPermissionItemsResult = await addPermissionItems(
      context,
      addPermissionItemsReqData
    );

    const items = addPermissionItemsResult.items;
    const instData =
      RequestData.fromExpressRequest<IGetResourcePermissionItemsEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {
          organizationId: organization.resourceId,
          itemResourceType: AppResourceType.Organization,
          itemResourceId: organization.resourceId,
        }
      );

    const result = await getEntityPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expectItemsPresent(result.items, items);
  });
});
