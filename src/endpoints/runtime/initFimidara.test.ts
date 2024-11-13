import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {
  kDataModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import EndpointReusableQueries from '../queries.js';
import {completeTests} from '../testUtils/helpers/testFns.js';
import {initTests} from '../testUtils/testUtils.js';
import {initFimidara, kAppRuntimeStatsDocId} from './initFimidara.js';
import {checkPublicPermissionGroup} from './testutils/checkPublicPermissions.js';
import {checkRootWorkspace} from './testutils/checkRootWorkspace.js';

beforeEach(async () => {
  await initTests();
});

afterEach(async () => {
  await completeTests();
});

describe('init app setup', () => {
  test('app is setup', async () => {
    // initFimidara is called internally when getting test context
    const runtimeVars = await kDataModels
      .appRuntimeState()
      .assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(kAppRuntimeStatsDocId)
      );

    await checkRootWorkspace(runtimeVars);
    await checkPublicPermissionGroup(runtimeVars);
  });

  test('app not setup a second time', async () => {
    const workspaceId = kUtilsInjectables.runtimeConfig().rootWorkspaceId;
    const workspace = await initFimidara();
    expect(workspace.resourceId).toBe(workspaceId);
  });
});
