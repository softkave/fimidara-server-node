import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import RequestData from '../../RequestData.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {insertTagForTest} from '../../testUtils/helpers/tag.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {test, beforeAll, afterAll, describe, expect} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import deleteTag from './handler.js';
import {DeleteTagEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('deleteTag', () => {
  test('tag deleted', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {tag} = await insertTagForTest(userToken, workspace.resourceId);

    const instData = RequestData.fromExpressRequest<DeleteTagEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {tagId: tag.resourceId}
    );
    const result = await deleteTag(instData);
    assertEndpointResultOk(result);

    appAssert(result.jobId);
    const job = (await kSemanticModels.job().getOneByQuery({
      type: kJobType.deleteResource,
      resourceId: result.jobId,
      params: {$objMatch: {type: kFimidaraResourceType.Tag}},
    })) as Job<DeleteResourceJobParams>;
    expect(job).toBeTruthy();
    expect(job?.params).toMatchObject({
      resourceId: tag.resourceId,
      workspaceId: workspace.resourceId,
    });

    const dbItem = await kSemanticModels
      .tag()
      .getOneByQuery({resourceId: tag.resourceId, isDeleted: true});
    expect(dbItem).toBeTruthy();
  });
});
