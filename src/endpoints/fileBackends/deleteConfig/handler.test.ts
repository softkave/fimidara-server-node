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
  insertFileBackendConfigForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import updateFileBackendConfig from './handler';
import {DeleteFileBackendConfigEndpointParams} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('deleteConfig', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);

  test('fails if config does not exist', async () => {
    const instData =
      RequestData.fromExpressRequest<DeleteFileBackendConfigEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {configId: getNewIdForResource(kAppResourceType.FileBackendConfig)}
      );

    await expectErrorThrown(
      async () => {
        await updateFileBackendConfig(instData);
      },
      error =>
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.config.notFound().message
        )
    );
  });

  test('fails if config is in use by a mount', async () => {
    const {config} = await insertFileBackendConfigForTest(
      userToken,
      workspace.resourceId
    );
    await generateAndInsertFileBackendMountListForTest(1, {configId: config.resourceId});

    const instData =
      RequestData.fromExpressRequest<DeleteFileBackendConfigEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {configId: getNewIdForResource(kAppResourceType.FileBackendConfig)}
      );

    await expectErrorThrown(
      async () => {
        await updateFileBackendConfig(instData);
      },
      error =>
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.config.configInUse(1).message
        )
    );
  });

  test('succeeds if config exists', async () => {
    const {config} = await insertFileBackendConfigForTest(
      userToken,
      workspace.resourceId
    );

    const instData =
      RequestData.fromExpressRequest<DeleteFileBackendConfigEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {configId: config.resourceId, workspaceId: workspace.resourceId}
      );
    const result = await updateFileBackendConfig(instData);
    assertEndpointResultOk(result);

    appAssert(result.jobId);
    const job = await kSemanticModels.job().getOneByQuery<Job<DeleteResourceJobParams>>({
      type: kJobType.deleteResource,
      resourceId: result.jobId,
      params: {
        $objMatch: {
          type: kAppResourceType.FileBackendConfig,
        },
      },
    });
    expect(job).toBeTruthy();
    expect(job?.params.args).toMatchObject({
      resourceId: config.resourceId,
      workspaceId: workspace.resourceId,
    });
  });
});
