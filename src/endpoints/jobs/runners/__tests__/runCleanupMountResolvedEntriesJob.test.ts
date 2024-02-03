import {kAppResourceType} from '../../../../definitions/system';
import {extractResourceIdList} from '../../../../utils/fns';
import {getNewIdForResource} from '../../../../utils/resource';
import {kSemanticModels} from '../../../contexts/injection/injectables';
import {generateAndInsertResolvedMountEntryListForTest} from '../../../testUtils/generate/fileBackend';
import {completeTests} from '../../../testUtils/helpers/testFns';
import {initTests} from '../../../testUtils/testUtils';
import {runCleanupMountResolvedEntriesJob} from '../runCleanupMountResolvedEntriesJob';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

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
