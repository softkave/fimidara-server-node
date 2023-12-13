import assert from 'assert';
import RequestData from '../../RequestData';
import {executeJob, waitForJob} from '../../jobs/runner';
import EndpointReusableQueries from '../../queries';
import {insertTagForTest} from '../../testUtils/helpers/tag';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deleteTag from './handler';
import {DeleteTagEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
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
    assert(result.jobId);
    await executeJob(result.jobId);
    await waitForJob(result.jobId);

    const deletedTagExists = await kSemanticModels
      .tag()
      .existsByQuery(EndpointReusableQueries.getByResourceId(tag.resourceId));
    expect(deletedTagExists).toBeFalsy();
  });
});
