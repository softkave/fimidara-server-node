import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {kAppResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {completeTests, softkaveTest} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {stringifyFilenamepath} from '../utils';
import deleteFile from './handler';
import {DeleteFileEndpointParams} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('deleteFile', () => {
  softkaveTest.run('file deleted', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);
    const instData = RequestData.fromExpressRequest<DeleteFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {filepath: stringifyFilenamepath(file, workspace.rootname)}
    );
    const result = await deleteFile(instData);
    assertEndpointResultOk(result);

    appAssert(result.jobId);
    const job = await kSemanticModels.job().getOneByQuery<Job<DeleteResourceJobParams>>({
      type: kJobType.deleteResource,
      resourceId: result.jobId,
      params: {
        $objMatch: {
          type: kAppResourceType.File,
        },
      },
    });
    expect(job).toBeTruthy();
    expect(job?.params.args).toMatchObject({
      resourceId: file.resourceId,
      workspaceId: workspace.resourceId,
    });
  });
});
