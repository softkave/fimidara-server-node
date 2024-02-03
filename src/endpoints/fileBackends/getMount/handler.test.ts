import {kAppResourceType} from '../../../definitions/system';
import {getNewIdForResource} from '../../../utils/resource';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import RequestData from '../../RequestData';
import {NotFoundError} from '../../errors';
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
import getFileBackendMount from './handler';
import {GetFileBackendMountEndpointParams} from './types';

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

    const instData = RequestData.fromExpressRequest<GetFileBackendMountEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {mountId: mount.resourceId, workspaceId: workspace.resourceId}
    );
    const result = await getFileBackendMount(instData);

    assertEndpointResultOk(result);
    expect(result.mount).toEqual(mount);
  });

  test('fails if mount does not exist', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    const instData = RequestData.fromExpressRequest<GetFileBackendMountEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        mountId: getNewIdForResource(kAppResourceType.FileBackendMount),
        workspaceId: workspace.resourceId,
      }
    );
    await expectErrorThrown(
      () => getFileBackendMount(instData),
      error =>
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.mount.notFound().message
        )
    );
  });
});
