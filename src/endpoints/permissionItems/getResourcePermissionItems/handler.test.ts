import {faker} from '@faker-js/faker';
import {kPermissionsMap} from '../../../definitions/permissionItem';
import {AppResourceTypeMap} from '../../../definitions/system';
import RequestData from '../../RequestData';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generateData/permissionItem';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import addPermissionItems from '../addItems/handler';
import {AddPermissionItemsEndpointParams} from '../addItems/types';
import {PermissionItemInput} from '../types';
import {default as getResourcePermissionItems} from './handler';
import {GetResourcePermissionItemsEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
});

describe.skip('getResourcePermissionItems', () => {
  test('resource permission items returned', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [{permissionGroup: pg01}, {permissionGroup: pg02}] = await Promise.all([
      insertPermissionGroupForTest(userToken, workspace.resourceId),
      insertPermissionGroupForTest(userToken, workspace.resourceId),
    ]);
    const inputItems = Object.values(kPermissionsMap).map(
      (action): PermissionItemInput => ({
        action,
        access: faker.datatype.boolean(),
        target: {targetId: pg02.resourceId},
        entityId: pg01.resourceId,
      })
    );
    const addPermissionItemsReqData =
      RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {items: inputItems, workspaceId: workspace.resourceId}
      );
    await addPermissionItems(addPermissionItemsReqData);

    const instData =
      RequestData.fromExpressRequest<GetResourcePermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId, target: {targetId: pg02.resourceId}}
      );
    const result = await getResourcePermissionItems(instData);
    assertEndpointResultOk(result);

    throw new Error('Check that permissions belong to target');
  });

  test('pagination', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await generateAndInsertPermissionItemListForTest(15, {
      workspaceId: workspace.resourceId,
      targetType: AppResourceTypeMap.Workspace,
      targetId: workspace.resourceId,
    });

    const instData =
      RequestData.fromExpressRequest<GetResourcePermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId, target: {targetId: workspace.resourceId}}
      );
    const result = await getResourcePermissionItems(instData);
    assertEndpointResultOk(result);
  });
});
