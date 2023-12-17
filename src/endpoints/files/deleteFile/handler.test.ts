import assert from 'assert';
import {compact} from 'lodash';
import {File} from '../../../definitions/file';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injectables';
import {resolveBackendConfigsWithIdList} from '../../fileBackends/configUtils';
import {
  initBackendProvidersForMounts,
  resolveMountsForFolder,
} from '../../fileBackends/mountUtils';
import {kFolderConstants} from '../../folders/constants';
import {executeJob, waitForJob} from '../../jobs/runner';
import EndpointReusableQueries from '../../queries';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {stringifyFilenamepath} from '../utils';
import deleteFile from './handler';
import {DeleteFileEndpointParams} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

async function assertFileDeleted(file: File) {
  const [exists, {mounts}] = await Promise.all([
    kSemanticModels
      .file()
      .existsByQuery(EndpointReusableQueries.getByResourceId(file.resourceId)),
    resolveMountsForFolder(file),
  ]);
  const configs = await resolveBackendConfigsWithIdList(
    compact(mounts.map(mount => mount.configId))
  );
  const providersMap = await initBackendProvidersForMounts(mounts, configs);

  expect(exists).toBeFalsy();
  await Promise.all(
    mounts.map(async mount => {
      const provider = providersMap[mount.resourceId];
      const existsInProvider = await provider.describeFile({
        mount,
        filepath: file.namepath.join(kFolderConstants.separator),
        workspaceId: file.workspaceId,
      });

      expect(existsInProvider).toBeFalsy();
    })
  );
}

describe('deleteFile', () => {
  test('file deleted', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file, rawFile} = await insertFileForTest(userToken, workspace);
    const instData = RequestData.fromExpressRequest<DeleteFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {filepath: stringifyFilenamepath(file, workspace.rootname)}
    );
    const result = await deleteFile(instData);

    assert(result.jobId);
    await executeJob(result.jobId);
    await waitForJob(result.jobId);

    assertEndpointResultOk(result);
    await assertFileDeleted(rawFile);
  });
});
