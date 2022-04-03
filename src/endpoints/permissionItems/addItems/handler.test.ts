import faker = require('faker');
import {
  AppResourceType,
  BasicCRUDActions,
  getOrgActionList,
} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {expectItemsPresent} from '../../test-utils/helpers/permissionItem';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import PermissionItemQueries from '../queries';
import addPermissionItems from './handler';
import {
  IAddPermissionItemsEndpointParams,
  INewPermissionItemInput,
} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('addItems', () => {
  test('permission items added', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {organization} = await insertOrganizationForTest(context, userToken);
    const {preset} = await insertPresetForTest(
      context,
      userToken,
      organization.resourceId
    );

    const items: INewPermissionItemInput[] = getOrgActionList().map(action => ({
      action: action as BasicCRUDActions,
      isExclusion: faker.datatype.boolean(),
      isForPermissionOwner: faker.datatype.boolean(),
      itemResourceType: AppResourceType.Organization,
      permissionEntityId: preset.resourceId,
      permissionEntityType: AppResourceType.PresetPermissionsGroup,
      permissionOwnerId: organization.resourceId,
      permissionOwnerType: AppResourceType.Organization,
      itemResourceId: organization.resourceId,
    }));

    const instData =
      RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {items, organizationId: organization.resourceId}
      );

    const result = await addPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expectItemsPresent(result.items, items);
  });

  test('permission items are not duplicated', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {organization} = await insertOrganizationForTest(context, userToken);
    const {preset} = await insertPresetForTest(
      context,
      userToken,
      organization.resourceId
    );

    const items: INewPermissionItemInput[] = getOrgActionList().map(action => ({
      action: action as BasicCRUDActions,
      isExclusion: faker.datatype.boolean(),
      isForPermissionOwner: faker.datatype.boolean(),
      itemResourceType: AppResourceType.Organization,
      permissionEntityId: preset.resourceId,
      permissionEntityType: AppResourceType.PresetPermissionsGroup,
      permissionOwnerId: organization.resourceId,
      permissionOwnerType: AppResourceType.Organization,
      itemResourceId: organization.resourceId,
    }));

    const instData =
      RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {items, organizationId: organization.resourceId}
      );

    // First insert
    await addPermissionItems(context, instData);

    // Second insert of the very same permission items as the first
    // insert
    const result = await addPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expectItemsPresent(result.items, items);

    const presetPermissionItems =
      await context.data.permissionItem.getManyItems(
        PermissionItemQueries.getByPermissionEntity(
          preset.resourceId,
          AppResourceType.PresetPermissionsGroup
        )
      );

    expect(presetPermissionItems.length).toBe(result.items.length);
  });
});
