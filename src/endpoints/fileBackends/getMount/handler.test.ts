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
  insertFileBackendMountForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import getFileBackendMount from './handler.js';
import {GetFileBackendMountEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getMount', () => {
  test('mount returned', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {mount} = await insertFileBackendMountForTest(userToken, workspace);

    const reqData =
      RequestData.fromExpressRequest<GetFileBackendMountEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {mountId: mount.resourceId, workspaceId: workspace.resourceId}
      );
    const result = await getFileBackendMount(reqData);

    assertEndpointResultOk(result);
    expect(result.mount).toEqual(mount);
  });

  test('fails if mount does not exist', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    const reqData =
      RequestData.fromExpressRequest<GetFileBackendMountEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          mountId: getNewIdForResource(kFimidaraResourceType.FileBackendMount),
          workspaceId: workspace.resourceId,
        }
      );
    await expectErrorThrown(
      () => getFileBackendMount(reqData),
      error => {
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.mount.notFound().message
        );
      }
    );
  });
});
