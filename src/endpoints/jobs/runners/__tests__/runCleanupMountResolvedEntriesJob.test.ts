import {kAppResourceType} from '../../../../definitions/system';
import {extractResourceIdList} from '../../../../utils/fns';
import {getNewIdForResource} from '../../../../utils/resource';
import {kSemanticModels} from '../../../contexts/injectables';
import {generateAndInsertResolvedMountEntryListForTest} from '../../../testUtils/generate/fileBackend';
import {runCleanupMountResolvedEntriesJob} from '../runCleanupMountResolvedEntriesJob';

describe('runCleanupMountResolvedEntriesJob', () => {
  test('mount entries deleted', async () => {
    const mountId = getNewIdForResource(kAppResourceType.FileBackendMount);
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
