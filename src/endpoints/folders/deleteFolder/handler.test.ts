import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {kFimidaraResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {stringifyFoldernamepath} from '../utils';
import deleteFolder from './handler';
import {DeleteFolderEndpointParams} from './types';

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

  const instData = RequestData.fromExpressRequest<DeleteFolderEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {folderpath: stringifyFoldernamepath(folder01, workspace.rootname)}
  );
  const result = await deleteFolder(instData);
  assertEndpointResultOk(result);

  appAssert(result.jobId);
  const job = (await kSemanticModels.job().getOneByQuery({
    type: kJobType.deleteResource0,
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
