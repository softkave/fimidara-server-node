import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {kAppResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injectables';
import {insertTagForTest} from '../../testUtils/helpers/tag';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deleteTag from './handler';
import {DeleteTagEndpointParams} from './types';

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
    const job = await kSemanticModels.job().getOneByQuery<Job<DeleteResourceJobParams>>({
      type: kJobType.deleteResource,
      resourceId: result.jobId,
      params: {$objMatch: {type: kAppResourceType.Tag}},
    });
    expect(job).toBeTruthy();
    expect(job?.params.args).toMatchObject({
      resourceId: tag.resourceId,
      workspaceId: workspace.resourceId,
    });
  });
});
