import {faker} from '@faker-js/faker';
import {
  AppResourceType,
  BasicCRUDActions,
  getWorkspaceActionList,
  IResourceBase,
} from '../../../definitions/system';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {collaboratorExtractor} from '../../collaborators/utils';
import {IBaseContext} from '../../contexts/types';
import {disposeGlobalUtils} from '../../globalUtils';
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
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {IFetchResourceItem} from '../types';
import getResources from './handler';
import {IGetResourcesEndpointParams} from './types';

// TODO: Test resources that the agent doesn't have read permission to

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await disposeGlobalUtils();
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
      targetType: AppResourceType.Workspace,
      targetId: workspace.resourceId,
    }));
    const addPermissionItemsReqData =
      RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {items: inputItems, workspaceId: workspace.resourceId, entityId: permissionGroup.resourceId}
      );
    const addPermissionItemsResult = await addPermissionItems(context, addPermissionItemsReqData);
    assertEndpointResultOk(addPermissionItemsResult);
    const items = addPermissionItemsResult.items;
    const resourcesInput: IFetchResourceItem[] = [];
    const resourcesMap: Record<string, any> = {};
    const getKey = (item: Pick<IResourceBase, 'resourceId'>, type: AppResourceType) =>
      `${item.resourceId}-${type}`;
    const addResource = (item: Pick<IResourceBase, 'resourceId'>, type: AppResourceType) => {
      resourcesInput.push({resourceId: item.resourceId});
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
      mockExpressRequestWithAgentToken(userToken),
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
