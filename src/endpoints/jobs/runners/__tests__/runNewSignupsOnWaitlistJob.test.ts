import assert from 'assert';
import {getNewId} from 'softkave-js-utils';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {DataQuery} from '../../../../contexts/data/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {AppShardId} from '../../../../definitions/app.js';
import {
  EmailJobParams,
  Job,
  kEmailJobType,
  kJobType,
} from '../../../../definitions/job.js';
import {kSystemSessionAgent} from '../../../../utils/agent.js';
import {generateAndInsertUserListForTest} from '../../../testHelpers/generate/user.js';
import {completeTests} from '../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../testHelpers/utils.js';
import {queueJobs} from '../../queueJobs.js';
import {runNewSignupsOnWaitlistJob} from '../runNewSignupsOnWaitlistJob.js';

beforeEach(async () => {
  await initTests();
});

afterEach(async () => {
  await completeTests();
});

async function getDBEmailJob(shard: AppShardId) {
  const {rootUserEmail} = kIjxUtils.suppliedConfig();
  assert(rootUserEmail);

  const query: DataQuery<Job<EmailJobParams>> = {
    shard,
    type: kJobType.email,
    params: {
      $objMatch: {
        type: kEmailJobType.newSignupsOnWaitlist,
        emailAddress: {$all: [rootUserEmail]},
      },
    },
  };

  return (await kIjxSemantic
    .job()
    .getOneByQuery(query)) as Job<EmailJobParams> | null;
}

async function deleteJobById(jobId: string) {
  await kIjxSemantic
    .utils()
    .withTxn(opts => kIjxSemantic.job().deleteOneById(jobId, opts));
}

describe('runNewSignupsOnWaitlistJob', () => {
  test.each([
    {firstRunUsersCount: 0, secondRunUsersCount: 2},
    {firstRunUsersCount: 0, secondRunUsersCount: 0},
    {firstRunUsersCount: 2, secondRunUsersCount: 2},
    {firstRunUsersCount: 2, secondRunUsersCount: 0},
  ])(
    'email job created firstRunUsersCount=$firstRunUsersCount secondRunUsersCount=$secondRunUsersCount',
    async params => {
      const shard = getNewId();
      const [job] = await queueJobs<{}>(
        /** workspaceId */ undefined,
        /** parentJobId */ undefined,
        [
          {
            shard,
            params: {},
            createdBy: kSystemSessionAgent,
            type: kJobType.newSignupsOnWaitlist,
            idempotencyToken: Date.now().toString(),
          },
        ]
      );

      await generateAndInsertUserListForTest(
        /** count */ params.firstRunUsersCount
      );

      await runNewSignupsOnWaitlistJob(job);
      await kIjxUtils.promises().flush();

      let dbEmailJob = await getDBEmailJob(shard);

      if (params.firstRunUsersCount) {
        expect(dbEmailJob).toBeTruthy();
      }

      if (dbEmailJob) {
        assert(dbEmailJob?.params.type === kEmailJobType.newSignupsOnWaitlist);

        // Using toBeGreaterThanOrEqual because other tests create users in
        // their runs which influences this test. This is also the reason we're
        // checking if dbEmailJob exists even if the inserted user count is 0
        expect(dbEmailJob.params.params.count).toBeGreaterThanOrEqual(
          params.firstRunUsersCount
        );

        // Minor cleanup for next run
        await deleteJobById(dbEmailJob.resourceId);
      }

      // these users will be considered  because they came after the last run
      await generateAndInsertUserListForTest(
        /** count */ params.secondRunUsersCount
      );

      await runNewSignupsOnWaitlistJob(job);
      await kIjxUtils.promises().flush();

      dbEmailJob = await getDBEmailJob(shard);

      if (params.secondRunUsersCount) {
        expect(dbEmailJob).toBeTruthy();
      }

      if (dbEmailJob) {
        assert(dbEmailJob?.params.type === kEmailJobType.newSignupsOnWaitlist);
        // Using toBeGreaterThanOrEqual because other tests create users in
        // their runs which influences this test
        expect(dbEmailJob.params.params.count).toBeGreaterThanOrEqual(
          params.firstRunUsersCount
        );
      }
    }
  );
});
