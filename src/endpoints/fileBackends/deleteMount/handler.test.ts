import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {kFileBackendType} from '../../../definitions/fileBackend.js';
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
  insertFileBackendMountForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import deleteFileBackendMount from './handler.js';
import {DeleteFileBackendMountEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('deleteMount', () => {
  test('fails if mount does not exist', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const reqData =
      RequestData.fromExpressRequest<DeleteFileBackendMountEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          mountId: getNewIdForResource(kFimidaraResourceType.FileBackendMount),
          workspaceId: workspace.resourceId,
        }
      );

    await expectErrorThrown(
      async () => {
        await deleteFileBackendMount(reqData);
      },
      error => {
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.mount.notFound().message
        );
      }
    );
  });

  test('fails if mount is fimidara', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId: workspace.resourceId,
      backend: kFileBackendType.fimidara,
    });

    const reqData =
      RequestData.fromExpressRequest<DeleteFileBackendMountEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {mountId: mount.resourceId, workspaceId: workspace.resourceId}
      );

    await expectErrorThrown(
      async () => {
        await deleteFileBackendMount(reqData);
      },
      error => {
        expect((error as NotFoundError).message).toBe(
          kReuseableErrors.mount.cannotDeleteFimidaraMount().message
        );
      }
    );
  });

  test('succeeds if mount exists', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {mount} = await insertFileBackendMountForTest(userToken, workspace);

    const reqData =
      RequestData.fromExpressRequest<DeleteFileBackendMountEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {mountId: mount.resourceId, workspaceId: workspace.resourceId}
      );
    const result = await deleteFileBackendMount(reqData);
    assertEndpointResultOk(result);

    appAssert(result.jobId);
    const job = (await kIjxSemantic.job().getOneByQuery({
      type: kJobType.deleteResource,
      resourceId: result.jobId,
      params: {
        $objMatch: {type: kFimidaraResourceType.FileBackendMount},
      },
    })) as Job<DeleteResourceJobParams>;
    expect(job).toBeTruthy();
    expect(job?.params).toMatchObject({
      resourceId: mount.resourceId,
      workspaceId: workspace.resourceId,
    });

    const dbItem = await kIjxSemantic
      .fileBackendMount()
      .getOneByQuery({resourceId: mount.resourceId, isDeleted: true});
    expect(dbItem).toBeTruthy();
  });
});
