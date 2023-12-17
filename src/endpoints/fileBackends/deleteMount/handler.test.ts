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
    const {mount} = await insertFileBackendMountForTest(userToken, workspace.resourceId);

    const instData = RequestData.fromExpressRequest<DeleteFileBackendMountEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {mountId: mount.resourceId, workspaceId: workspace.resourceId}
    );
    const result = await updateFileBackendMount(instData);
    assertEndpointResultOk(result);

    expect(result.jobId).toBeTruthy();

    assert(result.jobId);
    await executeJob(result.jobId);
    await waitForJob(result.jobId);

    const [dbMount, dbMountEntries] = await Promise.all([
      kSemanticModels.fileBackendMount().getOneById(mount.resourceId),
      kSemanticModels.resolvedMountEntry().getMountEntries(mount.resourceId),
    ]);

    expect(dbMount).toBeFalsy();
    expect(dbMountEntries).toHaveLength(0);
  });
});
