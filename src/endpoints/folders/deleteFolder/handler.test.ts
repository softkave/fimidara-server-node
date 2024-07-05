import {afterAll, beforeAll, expect, test} from 'vitest';
import {
  DeleteResourceJobParams,
  Job,
  kJobType,
} from '../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import RequestData from '../../RequestData.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import {stringifyFoldernamepath} from '../utils.js';
import deleteFolder from './handler.js';
import {DeleteFolderEndpointParams} from './types.js';

/**
 * TODO:
 * - Test artifacts like files and children folders are deleted
 * - Test path strings
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('folder deleted', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {folder: folder01} = await insertFolderForTest(userToken, workspace);

  const reqData = RequestData.fromExpressRequest<DeleteFolderEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {folderpath: stringifyFoldernamepath(folder01, workspace.rootname)}
  );
  const result = await deleteFolder(reqData);
  assertEndpointResultOk(result);

  appAssert(result.jobId);
  const job = (await kSemanticModels.job().getOneByQuery({
    type: kJobType.deleteResource,
    resourceId: result.jobId,
    params: {
      $objMatch: {type: kFimidaraResourceType.Folder},
    },
  })) as Job<DeleteResourceJobParams>;
  expect(job).toBeTruthy();
  expect(job?.params).toMatchObject({
    resourceId: folder01.resourceId,
    workspaceId: workspace.resourceId,
  });

  const dbItem = await kSemanticModels
    .folder()
    .getOneByQuery({resourceId: folder01.resourceId, isDeleted: true});
  expect(dbItem).toBeTruthy();
});
