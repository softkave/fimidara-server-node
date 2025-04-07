import {afterAll, beforeAll, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {
  DeleteResourceJobParams,
  Job,
  kJobType,
} from '../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import {stringifyFolderpath} from '../utils.js';
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
    {folderpath: stringifyFolderpath(folder01, workspace.rootname)}
  );
  const result = await deleteFolder(reqData);
  assertEndpointResultOk(result);

  appAssert(result.jobId);
  const job = (await kIjxSemantic.job().getOneByQuery({
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

  const dbItem = await kIjxSemantic
    .folder()
    .getOneByQuery({resourceId: folder01.resourceId, isDeleted: true});
  expect(dbItem).toBeTruthy();
});
