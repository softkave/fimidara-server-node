import {Job, kJobType} from '../../../definitions/job';
import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {kFimidaraResourceType} from '../../../definitions/system';
import {sortObjectKeys} from '../../../utils/fns';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {expectContainsEveryItemInForAnyType} from '../../testUtils/helpers/assertion';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertPermissionGroupForTest,
  insertPermissionItemsForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deletePermissionItems from './handler';
import {DeletePermissionItemInput, DeletePermissionItemsEndpointParams} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('permission items deleted', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const [{permissionGroup: pg01}, {permissionGroup: pg02}] = await Promise.all([
    insertPermissionGroupForTest(userToken, workspace.resourceId),
    insertPermissionGroupForTest(userToken, workspace.resourceId),
  ]);
  await Promise.all([
    insertPermissionItemsForTest(userToken, workspace.resourceId, {
      entityId: pg01.resourceId,
      target: {targetId: workspace.resourceId},
      access: true,
      action: kFimidaraPermissionActionsMap.addTag,
    }),
    insertPermissionItemsForTest(userToken, workspace.resourceId, {
      entityId: pg02.resourceId,
      target: {targetId: workspace.resourceId},
      access: true,
      action: kFimidaraPermissionActionsMap.addTag,
    }),
  ]);

  const params: DeletePermissionItemsEndpointParams = {
    workspaceId: workspace.resourceId,
    items: [
      {
        action: kFimidaraPermissionActionsMap.addTag,
        target: {targetId: workspace.resourceId},
        entityId: pg01.resourceId,
      },
      {entityId: pg02.resourceId},
    ],
  };
  const instData = RequestData.fromExpressRequest<DeletePermissionItemsEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    params
  );
  const result = await deletePermissionItems(instData);
  assertEndpointResultOk(result);

  const jobs = (await kSemanticModels.job().getManyByQuery({
    type: kJobType.deletePermissionItem,
    resourceId: {$in: result.jobIds},
    workspaceId: workspace.resourceId,
    createdBy: {
      $objMatch: {
        agentId: userToken.forEntityId,
        agentType: kFimidaraResourceType.User,
        agentTokenId: userToken.resourceId,
      },
    },
  })) as Job<DeletePermissionItemInput>[];

  expect(jobs).toHaveLength(params.items.length);
  expectContainsEveryItemInForAnyType(
    jobs,
    params.items,
    job => {
      const item: DeletePermissionItemInput = {
        access: job.params.access,
        action: job.params.action,
        entityId: job.params.entityId,
        target: job.params.target,
      };
      return JSON.stringify(sortObjectKeys(item));
    },
    item => JSON.stringify(sortObjectKeys(item))
  );
});
