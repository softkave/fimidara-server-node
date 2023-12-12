import {executeJob, waitForJob} from '../../jobs/runner';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {generateTestFileName} from '../../testUtils/generateData/file';
import {generateTestFolderName} from '../../testUtils/generateData/folder';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertFileForTest,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {kFolderConstants} from '../constants';
import {addRootnameToPath} from '../utils';
import deleteFolder from './handler';
import {DeleteFolderEndpointParams} from './types';

/**
 * TODO:
 * - Test artifacts like files and children folders are deleted
 * - Test path strings
 */

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest();
});

async function assertFolderDeleted(id: string) {
  const exists = await kSemanticModels
    .folder()
    .existsByQuery(EndpointReusableQueries.getByResourceId(id));

  expect(exists).toBeFalsy();
}

async function assertFileDeleted(id: string) {
  const exists = await kSemanticModels
    .file()
    .existsByQuery(EndpointReusableQueries.getByResourceId(id));

  expect(exists).toBeFalsy();
}

test('folder deleted', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {folder: folder01} = await insertFolderForTest(userToken, workspace);
  const {folder: folder02} = await insertFolderForTest(userToken, workspace, {
    folderpath: addRootnameToPath(
      folder01.namepath
        .concat(generateTestFolderName({includeStraySlashes: true}))
        .join(kFolderConstants.separator),
      workspace.rootname
    ),
  });
  const {file} = await insertFileForTest(userToken, workspace, {
    filepath: addRootnameToPath(
      folder01.namepath
        .concat(generateTestFileName({includeStraySlashes: true}))
        .join(kFolderConstants.separator),
      workspace.rootname
    ),
  });

  const instData = RequestData.fromExpressRequest<DeleteFolderEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {folderpath: addRootnameToPath(folder01.name, workspace.rootname)}
  );

  const result = await deleteFolder(instData);
  assertEndpointResultOk(result);

  if (result.jobId) {
    await executeJob(result.jobId);
    await waitForJob(result.jobId);
  }

  await assertFolderDeleted(folder01.resourceId);
  await assertFolderDeleted(folder02.resourceId);
  await assertFileDeleted(file.resourceId);
});
