import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {kFimidaraResourceType} from '../../../definitions/system';
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
  insertFileBackendConfigForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deleteFileBackendConfig from './handler';
import {DeleteFileBackendConfigEndpointParams} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('deleteConfig', () => {
  test('fails if config does not exist', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const instData =
      RequestData.fromExpressRequest<DeleteFileBackendConfigEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          configId: getNewIdForResource(kFimidaraResourceType.FileBackendConfig),
          workspaceId: workspace.resourceId,
        }
      );

    await expectErrorThrown(
      async () => {
        await deleteFileBackendConfig(instData);
      },
      error =>
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.config.notFound().message
        )
    );
  });

  test('fails if config is in use by a mount', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {config} = await insertFileBackendConfigForTest(
      userToken,
      workspace.resourceId
    );
    await generateAndInsertFileBackendMountListForTest(1, {configId: config.resourceId});

    const instData =
      RequestData.fromExpressRequest<DeleteFileBackendConfigEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {configId: config.resourceId, workspaceId: workspace.resourceId}
      );

    await expectErrorThrown(
      async () => {
        await deleteFileBackendConfig(instData);
      },
      error =>
        expect((error as Error).message).toBe(
          kReuseableErrors.config.configInUse(/** count */ 1).message
        )
    );
  });

  test('succeeds if config exists', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {config} = await insertFileBackendConfigForTest(
      userToken,
      workspace.resourceId
    );

    const instData =
      RequestData.fromExpressRequest<DeleteFileBackendConfigEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {configId: config.resourceId, workspaceId: workspace.resourceId}
      );
    const result = await deleteFileBackendConfig(instData);
    assertEndpointResultOk(result);

    appAssert(result.jobId);
    const job = (await kSemanticModels.job().getOneByQuery({
      type: kJobType.deleteResource,
      resourceId: result.jobId,
      params: {
        $objMatch: {type: kFimidaraResourceType.FileBackendConfig},
      },
    })) as Job<DeleteResourceJobParams>;
    expect(job).toBeTruthy();
    expect(job?.params).toMatchObject({
      resourceId: config.resourceId,
      workspaceId: workspace.resourceId,
    });

    const dbItem = await kSemanticModels
      .fileBackendConfig()
      .getOneByQuery({resourceId: config.resourceId, isDeleted: true});
    expect(dbItem).toBeTruthy();
  });
});
