import {IBaseContext} from '../../contexts/types';
import {executeJob, waitForJob} from '../../jobs/runner';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {generateTestFileName} from '../../testUtils/generateData/file';
import {generateTestFolderName} from '../../testUtils/generateData/folder';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertFileForTest,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {folderConstants} from '../constants';
import {addRootnameToPath} from '../utils';
import deleteFolder from './handler';
import {IDeleteFolderEndpointParams} from './types';

/**
 * TODO:
 * - Test artifacts like files and children folders are deleted
 * - Test path strings
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

async function assertFolderDeleted(context: IBaseContext, id: string) {
  const exists = await context.semantic.folder.existsByQuery(
    EndpointReusableQueries.getByResourceId(id)
  );

  expect(exists).toBeFalsy();
}

async function assertFileDeleted(context: IBaseContext, id: string) {
  const exists = await context.semantic.file.existsByQuery(
    EndpointReusableQueries.getByResourceId(id)
  );

  expect(exists).toBeFalsy();
}

test('folder deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {folder: folder01} = await insertFolderForTest(context, userToken, workspace);
  const {folder: folder02} = await insertFolderForTest(context, userToken, workspace, {
    folderpath: addRootnameToPath(
      folder01.namePath.concat(generateTestFolderName()).join(folderConstants.nameSeparator),
      workspace.rootname
    ),
  });
  const {file} = await insertFileForTest(context, userToken, workspace, {
    filepath: addRootnameToPath(
      folder01.namePath.concat(generateTestFileName()).join(folderConstants.nameSeparator),
      workspace.rootname
    ),
  });

  const instData = RequestData.fromExpressRequest<IDeleteFolderEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {folderpath: addRootnameToPath(folder01.name, workspace.rootname)}
  );

  const result = await deleteFolder(context, instData);
  assertEndpointResultOk(result);
  await executeJob(context, result.jobId);
  await waitForJob(context, result.jobId);

  await assertFolderDeleted(context, folder01.resourceId);
  await assertFolderDeleted(context, folder02.resourceId);
  await assertFileDeleted(context, file.resourceId);
});
