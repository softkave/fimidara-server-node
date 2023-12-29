import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {kAppResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {kSemanticModels} from '../../contexts/injectables';
import RequestData from '../../RequestData';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {addRootnameToPath} from '../utils';
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
    {folderpath: addRootnameToPath(folder01.name, workspace.rootname)}
  );

  const result = await deleteFolder(instData);
  assertEndpointResultOk(result);

  appAssert(result.jobId);
  const job = await kSemanticModels.job().getOneByQuery<Job<DeleteResourceJobParams>>({
    type: kJobType.deleteResource,
    resourceId: result.jobId,
    params: {
      $objMatch: {
        type: kAppResourceType.Folder,
      },
    },
  });
  expect(job).toBeTruthy();
  expect(job?.params.args).toMatchObject({
    resourceId: folder01.resourceId,
    workspaceId: workspace.resourceId,
  });
});
