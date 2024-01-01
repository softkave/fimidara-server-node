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
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertFileBackendMountForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import updateFileBackendMount from './handler';
import {DeleteFileBackendMountEndpointParams} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('deleteMount', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);

  test('fails if mount does not exist', async () => {
    const instData = RequestData.fromExpressRequest<DeleteFileBackendMountEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {mountId: getNewIdForResource(kAppResourceType.FileBackendMount)}
    );

    await expectErrorThrown(
      async () => {
        await updateFileBackendMount(instData);
      },
      error =>
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.mount.notFound().message
        )
    );
  });

  test('fails if mount is fimidara', async () => {
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId: workspace.resourceId,
      backend: 'fimidara',
    });

    const instData = RequestData.fromExpressRequest<DeleteFileBackendMountEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {mountId: mount.resourceId}
    );

    await expectErrorThrown(
      async () => {
        await updateFileBackendMount(instData);
      },
      error =>
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.mount.cannotDeleteFimidaraMount().message
        )
    );
  });

  test('succeeds if mount exists', async () => {
    const {mount} = await insertFileBackendMountForTest(userToken, workspace);

    const instData = RequestData.fromExpressRequest<DeleteFileBackendMountEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {mountId: mount.resourceId, workspaceId: workspace.resourceId}
    );
    const result = await updateFileBackendMount(instData);
    assertEndpointResultOk(result);

    appAssert(result.jobId);
    const job = await kSemanticModels.job().getOneByQuery<Job<DeleteResourceJobParams>>({
      type: kJobType.deleteResource,
      resourceId: result.jobId,
      params: {
        $objMatch: {
          type: kAppResourceType.FileBackendMount,
        },
      },
    });
    expect(job).toBeTruthy();
    expect(job?.params.args).toMatchObject({
      resourceId: mount.resourceId,
      workspaceId: workspace.resourceId,
    });
  });
});
