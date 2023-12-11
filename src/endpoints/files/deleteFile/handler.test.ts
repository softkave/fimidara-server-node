import {executeJob, waitForJob} from '../../jobs/runner';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {stringifyFilenamepath} from '../utils';
import deleteFile from './handler';
import {DeleteFileEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
});

async function assertFileDeleted(id: string) {
  const exists = await kSemanticModels
    .file()
    .existsByQuery(EndpointReusableQueries.getByResourceId(id));
  expect(exists).toBeFalsy();
}

test('file deleted', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {file} = await insertFileForTest(userToken, workspace);
  const instData = RequestData.fromExpressRequest<DeleteFileEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      filepath: stringifyFilenamepath(file, workspace.rootname),
    }
  );
  const result = await deleteFile(instData);

  if (result.jobId) {
    await executeJob(result.jobId);
    await waitForJob(result.jobId);
  }

  assertEndpointResultOk(result);
  await assertFileDeleted(file.resourceId);
});
