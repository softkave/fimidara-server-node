import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../../contexts/ijx/injectables.js';
import {kJobType} from '../../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../../definitions/system.js';
import {extractResourceIdList} from '../../../../utils/fns.js';
import {getNewIdForResource} from '../../../../utils/resource.js';
import {generateAndInsertResolvedMountEntryListForTest} from '../../../testHelpers/generate/fileBackend.js';
import {completeTests} from '../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../testHelpers/utils.js';
import {runCleanupMountResolvedEntriesJob} from '../runCleanupMountResolvedEntriesJob.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('runCleanupMountResolvedEntriesJob', () => {
  test('mount entries deleted', async () => {
    const mountId = getNewIdForResource(kFimidaraResourceType.FileBackendMount);
    const entries = await generateAndInsertResolvedMountEntryListForTest(
      /** count */ 5,
      {mountId}
    );

    await runCleanupMountResolvedEntriesJob({
      params: {mountId},
      type: kJobType.cleanupMountResolvedEntries,
    });

    const remainingEntries = await kIjxSemantic
      .resolvedMountEntry()
      .getManyByIdList(extractResourceIdList(entries));
    expect(remainingEntries).toHaveLength(0);
  });
});
