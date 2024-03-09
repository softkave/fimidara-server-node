import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {kFimidaraResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {insertTagForTest} from '../../testUtils/helpers/tag';
import {completeTests} from '../../testUtils/helpers/testFns';
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
    const job = (await kSemanticModels.job().getOneByQuery({
      type: kJobType.deleteResource0,
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
