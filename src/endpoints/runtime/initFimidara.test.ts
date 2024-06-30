import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {
  kDataModels,
  kSemanticModels,
  kUtilsInjectables,
} from '../contexts/injection/injectables.js';
import EndpointReusableQueries from '../queries.js';
import {completeTests} from '../testUtils/helpers/testFns.js';
import {initTests} from '../testUtils/testUtils.js';
import {initFimidara, kAppRuntimeStatsDocId} from './initFimidara.js';

beforeEach(async () => {
  await initTests();
});

afterEach(async () => {
  await completeTests();
});

describe('init app setup', () => {
  test('app is setup', async () => {
    // setupApp is called internally when getting test context
    const suppliedConfig = kUtilsInjectables.suppliedConfig();
    const runtimeVars = await kDataModels
      .appRuntimeState()
      .assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(kAppRuntimeStatsDocId)
      );
    await Promise.all([
      kSemanticModels.user().assertGetOneByQuery({
        email: suppliedConfig.rootUserEmail,
      }),
      kSemanticModels.workspace().assertGetOneByQuery({
        resourceId: runtimeVars.appWorkspaceId,
      }),
      kSemanticModels.permissionGroup().assertGetOneByQuery({
        resourceId: runtimeVars.appUsersImageUploadPermissionGroupId,
      }),
      kSemanticModels.permissionGroup().assertGetOneByQuery({
        resourceId: runtimeVars.appWorkspacesImageUploadPermissionGroupId,
      }),
    ]);

    expect(runtimeVars.isAppSetup).toBeTruthy();
  });

  test('app not setup a second time', async () => {
    const workspaceId = kUtilsInjectables.runtimeConfig().appWorkspaceId;
    const workspace = await initFimidara();
    expect(workspace.resourceId).toBe(workspaceId);
  });

  // test.each([{waitlistEnabled: true}, {waitlistEnabled: false}])(
  //   'queues new users on waitlist job if waitlist=$waitlistEnabled',
  //   async params => {
  //     kRegisterUtilsInjectables.suppliedConfig({
  //       ...kUtilsInjectables.suppliedConfig(),
  //       FLAG_waitlistNewSignups: params.waitlistEnabled,
  //     });

  //     // Call multiple times to test only 1 job is created
  //     await initFimidara();
  //     await initFimidara();
  //     await initFimidara();

  //     const query: DataQuery<Job> = {
  //       shard: kAppPresetShards.fimidaraMain,
  //       type: kJobType.newSignupsOnWaitlist,
  //       idempotencyToken: kNewSignupsOnWaitlistJobIdempotencyToken,
  //       runCategory: kJobRunCategory.cron,
  //       cronInterval: kNewSignupsOnWaitlistJobIntervalMs,
  //     };
  //     const dbJobs = await kSemanticModels.job().getManyByQuery(query);

  //     if (params.waitlistEnabled) {
  //       expect(dbJobs).toHaveLength(1);
  //     } else {
  //       expect(dbJobs).toHaveLength(0);
  //     }
  //   }
  // );
});
