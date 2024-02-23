import {kFileBackendType} from '../../../definitions/fileBackend';
import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {kAppResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {getNewIdForResource} from '../../../utils/resource';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {NotFoundError} from '../../errors';
import {generateAndInsertFileBackendMountListForTest} from '../../testUtils/generate/fileBackend';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertFileBackendMountForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deleteFileBackendMount from './handler';
import {DeleteFileBackendMountEndpointParams} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('deleteMount', () => {
  test('fails if mount does not exist', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const instData = RequestData.fromExpressRequest<DeleteFileBackendMountEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        mountId: getNewIdForResource(kAppResourceType.FileBackendMount),
        workspaceId: workspace.resourceId,
      }
    );

    await expectErrorThrown(
      async () => {
        await deleteFileBackendMount(instData);
      },
      error =>
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.mount.notFound().message
        )
    );
  });

  test('fails if mount is fimidara', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId: workspace.resourceId,
      backend: kFileBackendType.fimidara,
    });

    const instData = RequestData.fromExpressRequest<DeleteFileBackendMountEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {mountId: mount.resourceId, workspaceId: workspace.resourceId}
    );

    await expectErrorThrown(
      async () => {
        await deleteFileBackendMount(instData);
      },
      error =>
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.mount.cannotDeleteFimidaraMount().message
        )
    );
  });

  test('succeeds if mount exists', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {mount} = await insertFileBackendMountForTest(userToken, workspace);

    const instData = RequestData.fromExpressRequest<DeleteFileBackendMountEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {mountId: mount.resourceId, workspaceId: workspace.resourceId}
    );
    const result = await deleteFileBackendMount(instData);
    assertEndpointResultOk(result);

    appAssert(result.jobId);
    const job = (await kSemanticModels.job().getOneByQuery({
      type: kJobType.deleteResource0,
      resourceId: result.jobId,
      params: {
        $objMatch: {type: kAppResourceType.FileBackendMount},
      },
    })) as Job<DeleteResourceJobParams>;
    expect(job).toBeTruthy();
    expect(job?.params).toMatchObject({
      resourceId: mount.resourceId,
      workspaceId: workspace.resourceId,
    });

    const dbItem = await kSemanticModels
      .fileBackendMount()
      .getOneByQuery({resourceId: mount.resourceId, isDeleted: true});
    expect(dbItem).toBeTruthy();
  });
});
