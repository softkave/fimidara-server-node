import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import RequestData from '../../RequestData.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {completeTests, skTest} from '../../testUtils/helpers/testFns.js';
import {test, beforeAll, afterAll, describe, expect} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import {stringifyFilenamepath} from '../utils.js';
import deleteFile from './handler.js';
import {DeleteFileEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('deleteFile', () => {
  skTest.run('file deleted', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);
    const instData = RequestData.fromExpressRequest<DeleteFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {filepath: stringifyFilenamepath(file, workspace.rootname)}
    );
    const result = await deleteFile(instData);
    assertEndpointResultOk(result);

    appAssert(result.jobId);
    const job = (await kSemanticModels.job().getOneByQuery({
      type: kJobType.deleteResource,
      resourceId: result.jobId,
      params: {
        $objMatch: {type: kFimidaraResourceType.File},
      },
    })) as Job<DeleteResourceJobParams>;
    expect(job).toBeTruthy();
    expect(job?.params).toMatchObject({
      resourceId: file.resourceId,
      workspaceId: workspace.resourceId,
    });

    const dbItem = await kSemanticModels
      .file()
      .getOneByQuery({resourceId: file.resourceId, isDeleted: true});
    expect(dbItem).toBeTruthy();
  });
});
