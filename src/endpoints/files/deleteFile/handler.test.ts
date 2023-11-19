import {BaseContextType} from '../../contexts/types';
import {executeJob, waitForJob} from '../../jobs/runner';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {stringifyFileNamePath} from '../utils';
import deleteFile from './handler';
import {DeleteFileEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

async function assertFileDeleted(context: BaseContextType, id: string) {
  const exists = await context.semantic.file.existsByQuery(
    EndpointReusableQueries.getByResourceId(id)
  );
  expect(exists).toBeFalsy();
}

test('file deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {file} = await insertFileForTest(context, userToken, workspace);
  const instData = RequestData.fromExpressRequest<DeleteFileEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      filepath: stringifyFileNamePath(file, workspace.rootname),
    }
  );
  const result = await deleteFile(context, instData);

  if (result.jobId) {
    await executeJob(context, result.jobId);
    await waitForJob(context, result.jobId);
  }

  assertEndpointResultOk(result);
  await assertFileDeleted(context, file.resourceId);
});
