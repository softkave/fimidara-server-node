import {AppResourceType, IResourceBase} from '../../../definitions/system';
import {collaboratorExtractor} from '../../collaborators/utils';
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
import {IFetchResourceItem} from '../types';
import getResources from './handler';
import {IGetResourcesParams} from './types';

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
    const instData = RequestData.fromExpressRequest<IGetResourcesParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        organizationId: organization.resourceId,
        resources: resourcesInput,
      }
    );

    const result = await getResources(context, instData);
    assertEndpointResultOk(result);
    expect(result.resources).toHaveLength(resourcesInput.length);

    // console.log(formatWithOptions({depth: 10}, {resourcesMap, result}));

    result.resources.forEach(resource => {
      expect(resource.resource).toMatchObject(
        resourcesMap[getKey(resource.resource, resource.resourceType)]
      );
    });
  });
});
