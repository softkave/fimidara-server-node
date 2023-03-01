import {faker} from '@faker-js/faker';
import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  getWorkspaceActionList,
  IResourceBase,
} from '../../../definitions/system';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {collaboratorExtractor} from '../../collaborators/utils';
import {IBaseContext} from '../../contexts/types';
import addPermissionItems from '../../permissionItems/addItems/handler';
import {
  IAddPermissionItemsEndpointParams,
  INewPermissionItemInput,
} from '../../permissionItems/addItems/types';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {IFetchResourceItem} from '../types';
import getResources from './handler';
import {IGetResourcesEndpointParams} from './types';

// TODO: Test resources that the agent doesn't have read permission to

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('getResources', () => {
  test('resources returned', async () => {
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );

    const inputItems: INewPermissionItemInput[] = getWorkspaceActionList().map(action => ({
      action: action as BasicCRUDActions,
      grantAccess: faker.datatype.boolean(),
      appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
      targetType: AppResourceType.Workspace,
      entityId: permissionGroup.resourceId,
      permissionEntityType: AppResourceType.PermissionGroup,
      containerId: workspace.resourceId,
      containerType: AppResourceType.Workspace,
      targetId: workspace.resourceId,
    }));

    const addPermissionItemsReqData =
      RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {items: inputItems, workspaceId: workspace.resourceId}
      );

    const addPermissionItemsResult = await addPermissionItems(context, addPermissionItemsReqData);
    assertEndpointResultOk(addPermissionItemsResult);
    const items = addPermissionItemsResult.items;
    const resourcesInput: IFetchResourceItem[] = [];
    const resourcesMap: Record<string, any> = {};
    const getKey = (item: IResourceBase, type: AppResourceType) => `${item.resourceId}-${type}`;
    const addResource = (item: IResourceBase, type: AppResourceType) => {
      resourcesInput.push({resourceId: item.resourceId, resourceType: type});
      resourcesMap[getKey(item, type)] = item;
    };

    addResource(workspace, AppResourceType.Workspace);
    addResource(permissionGroup, AppResourceType.PermissionGroup);
    addResource(
      collaboratorExtractor(await populateUserWorkspaces(context, rawUser), workspace.resourceId),
      AppResourceType.User
    );

    items.forEach(item => addResource(item, AppResourceType.PermissionItem));
    const instData = RequestData.fromExpressRequest<IGetResourcesEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {workspaceId: workspace.resourceId, resources: resourcesInput}
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
