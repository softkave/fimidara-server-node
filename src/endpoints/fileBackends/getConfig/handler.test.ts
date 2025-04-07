import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import RequestData from '../../RequestData.js';
import {NotFoundError} from '../../errors.js';
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
import getFileBackendConfig from './handler.js';
import {GetFileBackendConfigEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getConfig', () => {
  test('config returned', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {config} = await insertFileBackendConfigForTest(
      userToken,
      workspace.resourceId
    );

    const reqData =
      RequestData.fromExpressRequest<GetFileBackendConfigEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {configId: config.resourceId, workspaceId: workspace.resourceId}
      );
    const result = await getFileBackendConfig(reqData);

    assertEndpointResultOk(result);
    expect(result.config).toEqual(config);
  });

  test('fails if config does not exist', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    const reqData =
      RequestData.fromExpressRequest<GetFileBackendConfigEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          configId: getNewIdForResource(
            kFimidaraResourceType.FileBackendConfig
          ),
          workspaceId: workspace.resourceId,
        }
      );
    await expectErrorThrown(
      () => getFileBackendConfig(reqData),
      error => {
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.config.notFound().message
        );
      }
    );
  });
});
