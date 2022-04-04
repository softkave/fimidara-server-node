import faker = require('faker');
import {
  AppResourceType,
  BasicCRUDActions,
  getOrgActionList,
  IResourceBase,
} from '../../../definitions/system';
import {collaboratorExtractor} from '../../collaborators/utils';
import {IBaseContext} from '../../contexts/BaseContext';
import addPermissionItems from '../../permissionItems/addItems/handler';
import {
  IAddPermissionItemsEndpointParams,
  INewPermissionItemInput,
} from '../../permissionItems/addItems/types';
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
import {IFetchResourceItem} from '../types';
import getResources from './handler';
import {IGetResourcesEndpointParams} from './types';

// TODO: Test resources that the agent doesn't have read permission to

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('getResources', () => {
  test('resources returned', async () => {
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
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

    assertEndpointResultOk(addPermissionItemsResult);
    const items = addPermissionItemsResult.items;
    const resourcesInput: IFetchResourceItem[] = [];
    const resourcesMap: Record<string, any> = {};
    const getKey = (item: IResourceBase, type: AppResourceType) =>
      `${item.resourceId}-${type}`;

    const addResource = (item: IResourceBase, type: AppResourceType) => {
      resourcesInput.push({resourceId: item.resourceId, resourceType: type});
      resourcesMap[getKey(item, type)] = item;
    };

    addResource(organization, AppResourceType.Organization);
    addResource(preset, AppResourceType.PresetPermissionsGroup);
    addResource(
      collaboratorExtractor(rawUser, organization.resourceId),
      AppResourceType.User
    );

    items.forEach(item => addResource(item, AppResourceType.PermissionItem));
    const instData =
      RequestData.fromExpressRequest<IGetResourcesEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {
          organizationId: organization.resourceId,
          resources: resourcesInput,
        }
      );

    const result = await getResources(context, instData);
    assertEndpointResultOk(result);
    expect(result.resources).toHaveLength(resourcesInput.length);

    result.resources.forEach(resource => {
      expect(resource.resource).toMatchObject(
        resourcesMap[getKey(resource.resource, resource.resourceType)]
      );
    });
  });
});
