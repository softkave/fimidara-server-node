import {AppResourceTypeMap} from '../../../definitions/system';
import {getNewIdForResource} from '../../../utils/resource';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import RequestData from '../../RequestData';
import {NotFoundError} from '../../errors';
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
      {mountId: getNewIdForResource(AppResourceTypeMap.FileBackendMount)}
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

  test('succeeds if mount exists', async () => {
    const {mount} = await insertFileBackendMountForTest(userToken, workspace.resourceId);

    const instData = RequestData.fromExpressRequest<DeleteFileBackendMountEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {mountId: mount.resourceId, workspaceId: workspace.resourceId}
    );
    const result = await updateFileBackendMount(instData);
    assertEndpointResultOk(result);

    expect(result.jobId).toBeTruthy();
  });
});
