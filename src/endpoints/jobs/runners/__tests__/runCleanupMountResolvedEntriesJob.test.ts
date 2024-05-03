import {kFimidaraResourceType} from '../../../../definitions/system.js';
import {extractResourceIdList} from '../../../../utils/fns.js';
import {getNewIdForResource} from '../../../../utils/resource.js';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {generateAndInsertResolvedMountEntryListForTest} from '../../../testUtils/generate/fileBackend.js';
import {completeTests} from '../../../testUtils/helpers/testFns.js';
import {initTests} from '../../../testUtils/testUtils.js';
import {runCleanupMountResolvedEntriesJob} from '../runCleanupMountResolvedEntriesJob.js';
import {test, beforeAll, afterAll, describe, expect} from 'vitest';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('runCleanupMountResolvedEntriesJob', () => {
  test('mount entries deleted', async () => {
    const mountId = getNewIdForResource(kFimidaraResourceType.FileBackendMount);
    const entries = await generateAndInsertResolvedMountEntryListForTest(/** count */ 5, {
      mountId,
    });

    await runCleanupMountResolvedEntriesJob({params: {mountId}});

    const remainingEntries = await kSemanticModels
      .resolvedMountEntry()
      .getManyByIdList(extractResourceIdList(entries));
    expect(remainingEntries).toHaveLength(0);
  });
});
