import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {
  DeleteResourceJobParams,
  Job,
  kJobType,
} from '../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {NotFoundError} from '../../errors.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertFileBackendMountListForTest} from '../../testHelpers/generate/fileBackend.js';
import {expectErrorThrown} from '../../testHelpers/helpers/error.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertFileBackendConfigForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import deleteFileBackendConfig from './handler.js';
import {DeleteFileBackendConfigEndpointParams} from './types.js';

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
    const reqData =
      RequestData.fromExpressRequest<DeleteFileBackendConfigEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          configId: getNewIdForResource(
            kFimidaraResourceType.FileBackendConfig
          ),
          workspaceId: workspace.resourceId,
        }
      );

    await expectErrorThrown(
      async () => {
        await deleteFileBackendConfig(reqData);
      },
      error => {
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.config.notFound().message
        );
      }
    );
  });

  test('fails if config is in use by a mount', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {config} = await insertFileBackendConfigForTest(
      userToken,
      workspace.resourceId
    );
    await generateAndInsertFileBackendMountListForTest(1, {
      configId: config.resourceId,
    });

    const reqData =
      RequestData.fromExpressRequest<DeleteFileBackendConfigEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {configId: config.resourceId, workspaceId: workspace.resourceId}
      );

    await expectErrorThrown(
      async () => {
        await deleteFileBackendConfig(reqData);
      },
      error => {
        expect((error as Error).message).toBe(
          kReuseableErrors.config.configInUse(/** count */ 1).message
        );
      }
    );
  });

  test('succeeds if config exists', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {config} = await insertFileBackendConfigForTest(
      userToken,
      workspace.resourceId
    );

    const reqData =
      RequestData.fromExpressRequest<DeleteFileBackendConfigEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {configId: config.resourceId, workspaceId: workspace.resourceId}
      );
    const result = await deleteFileBackendConfig(reqData);
    assertEndpointResultOk(result);

    appAssert(result.jobId);
    const job = (await kIjxSemantic.job().getOneByQuery({
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

    const dbItem = await kIjxSemantic
      .fileBackendConfig()
      .getOneByQuery({resourceId: config.resourceId, isDeleted: true});
    expect(dbItem).toBeTruthy();
  });
});
