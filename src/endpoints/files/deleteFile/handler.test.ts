import {IBaseContext} from '../../contexts/types';
import {addRootnameToPath} from '../../folders/utils';
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
import {fileConstants} from '../constants';
import deleteFile from './handler';
import {IDeleteFileEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

async function assertFileDeleted(context: IBaseContext, id: string) {
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
  const instData = RequestData.fromExpressRequest<IDeleteFileEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      filepath: addRootnameToPath(
        file.name + fileConstants.nameExtensionSeparator + file.extension,
        workspace.rootname
      ),
    }
  );
  const result = await deleteFile(context, instData);
  await executeJob(context, result.jobId);
  await waitForJob(context, result.jobId);
  assertEndpointResultOk(result);
  await assertFileDeleted(context, file.resourceId);
});
