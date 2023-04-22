import {faker} from '@faker-js/faker';
import {flatten} from 'lodash';
import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {
  AppActionType,
  AppResourceType,
  getWorkspaceActionList,
  Resource,
} from '../../../definitions/system';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {collaboratorExtractor} from '../../collaborators/utils';
import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generateData/permissionItem';
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
import {FetchResourceItem} from '../types';
import getResources from './handler';
import {GetResourcesEndpointParams} from './types';

// TODO: Test resources that the agent doesn't have read permission to

let context: BaseContextType | null = null;

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
    const itemsList = await Promise.all(
      getWorkspaceActionList().map(action =>
        generateAndInsertPermissionItemListForTest(context!, 1, {
          action: action as AppActionType,
          grantAccess: faker.datatype.boolean(),
          targetId: workspace.resourceId,
          targetType: AppResourceType.Workspace,
          appliesTo: PermissionItemAppliesTo.SelfAndChildrenOfType,
          workspaceId: workspace.resourceId,
          entityId: permissionGroup.resourceId,
        })
      )
    );
    const items = flatten(itemsList);
    const resourcesInput: FetchResourceItem[] = [];
    const resourcesMap: Record<string, any> = {};

    const addToExpectedResourcesById = (item: Pick<Resource, 'resourceId'>) => {
      resourcesInput.push({resourceId: item.resourceId});
      resourcesMap[item.resourceId] = item;
    };

    addToExpectedResourcesById(workspace);
    addToExpectedResourcesById(permissionGroup);
    addToExpectedResourcesById(
      collaboratorExtractor(await populateUserWorkspaces(context, rawUser), workspace.resourceId)
    );
    items.forEach(item => addToExpectedResourcesById(item));

    const instData = RequestData.fromExpressRequest<GetResourcesEndpointParams>(
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
