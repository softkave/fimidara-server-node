import {faker} from '@faker-js/faker';
import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppActionType, getWorkspaceActionList, IResource} from '../../../definitions/system';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {collaboratorExtractor} from '../../collaborators/utils';
import {IBaseContext} from '../../contexts/types';
import addPermissionItems from '../../permissionItems/addItems/handler';
import {IAddPermissionItemsEndpointParams} from '../../permissionItems/addItems/types';
import {IPermissionItemInput} from '../../permissionItems/types';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
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
  await completeTest({context});
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
    const inputItems: IPermissionItemInput[] = getWorkspaceActionList().map(action => ({
      action: action as AppActionType,
      grantAccess: faker.datatype.boolean(),
      target: {targetId: workspace.resourceId},
      appliesTo: PermissionItemAppliesTo.SelfAndChildrenOfType,
    }));
    const addPermissionItemsReqData =
      RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          items: inputItems,
          workspaceId: workspace.resourceId,
          entity: {entityId: permissionGroup.resourceId},
        }
      );
    const [addPermissionItemsResult] = await Promise.all([
      addPermissionItems(context, addPermissionItemsReqData),
    ]);
    assertEndpointResultOk(addPermissionItemsResult);
    const items = addPermissionItemsResult.items;
    const resourcesInput: IFetchResourceItem[] = [];
    const resourcesMap: Record<string, any> = {};

    const addToExpectedResourcesById = (item: Pick<IResource, 'resourceId'>) => {
      resourcesInput.push({resourceId: item.resourceId});
      resourcesMap[item.resourceId] = item;
    };

    addToExpectedResourcesById(workspace);
    addToExpectedResourcesById(permissionGroup);
    addToExpectedResourcesById(
      collaboratorExtractor(await populateUserWorkspaces(context, rawUser), workspace.resourceId)
    );
    items.forEach(item => addToExpectedResourcesById(item));

    const instData = RequestData.fromExpressRequest<IGetResourcesEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId, resources: resourcesInput}
    );
    const result = await getResources(context, instData);
    assertEndpointResultOk(result);
    expect(result.resources).toHaveLength(resourcesInput.length);
    result.resources.forEach(resource => {
      expect(resource.resource).toMatchObject(resourcesMap[resource.resourceId]);
    });
  });
});
