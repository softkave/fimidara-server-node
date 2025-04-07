import {afterAll, beforeAll, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {Job, kJobType} from '../../../definitions/job.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {sortObjectKeys} from '../../../utils/fns.js';
import RequestData from '../../RequestData.js';
import {expectContainsEveryItemInForAnyType} from '../../testHelpers/helpers/assertion.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertPermissionGroupForTest,
  insertPermissionItemsForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import deletePermissionItems from './handler.js';
import {
  DeletePermissionItemInput,
  DeletePermissionItemsEndpointParams,
} from './types.js';

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
      targetId: workspace.resourceId,
      access: true,
      action: kFimidaraPermissionActions.addTag,
    }),
    insertPermissionItemsForTest(userToken, workspace.resourceId, {
      entityId: pg02.resourceId,
      targetId: workspace.resourceId,
      access: true,
      action: kFimidaraPermissionActions.addTag,
    }),
  ]);

  const params: DeletePermissionItemsEndpointParams = {
    workspaceId: workspace.resourceId,
    items: [
      {
        action: kFimidaraPermissionActions.addTag,
        targetId: workspace.resourceId,
        entityId: pg01.resourceId,
      },
      {entityId: pg02.resourceId},
    ],
  };
  const reqData =
    RequestData.fromExpressRequest<DeletePermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      params
    );
  const result = await deletePermissionItems(reqData);
  assertEndpointResultOk(result);

  const jobs = (await kIjxSemantic.job().getManyByQuery({
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
      const item: DeletePermissionItemInput = job.params;
      return JSON.stringify(sortObjectKeys(item));
    },
    item => JSON.stringify(sortObjectKeys(item))
  );
});
