import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {
  DeleteResourceJobParams,
  Job,
  kJobType,
} from '../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import RequestData from '../../RequestData.js';
import {insertTagForTest} from '../../testHelpers/helpers/tag.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
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

    const reqData = RequestData.fromExpressRequest<DeleteTagEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {tagId: tag.resourceId}
    );
    const result = await deleteTag(reqData);
    assertEndpointResultOk(result);

    appAssert(result.jobId);
    const job = (await kIjxSemantic.job().getOneByQuery({
      type: kJobType.deleteResource,
      resourceId: result.jobId,
      params: {$objMatch: {type: kFimidaraResourceType.Tag}},
    })) as Job<DeleteResourceJobParams>;
    expect(job).toBeTruthy();
    expect(job?.params).toMatchObject({
      resourceId: tag.resourceId,
      workspaceId: workspace.resourceId,
    });

    const dbItem = await kIjxSemantic
      .tag()
      .getOneByQuery({resourceId: tag.resourceId, isDeleted: true});
    expect(dbItem).toBeTruthy();
  });
});
