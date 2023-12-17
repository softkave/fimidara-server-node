import assert from 'assert';
import {AppResourceTypeMap} from '../../../definitions/system';
import {getNewIdForResource} from '../../../utils/resource';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injectables';
import {NotFoundError} from '../../errors';
import {executeJob, waitForJob} from '../../jobs/runner';
import {generateAndInsertFileBackendMountListForTest} from '../../testUtils/generateData/fileBackend';
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
        {configId: getNewIdForResource(AppResourceTypeMap.FileBackendConfig)}
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
        {configId: getNewIdForResource(AppResourceTypeMap.FileBackendConfig)}
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

    expect(result.jobId).toBeTruthy();

    assert(result.jobId);
    await executeJob(result.jobId);
    await waitForJob(result.jobId);

    expect(
      await kSemanticModels.fileBackendConfig().getOneById(config.resourceId)
    ).toBeFalsy();
  });
});
