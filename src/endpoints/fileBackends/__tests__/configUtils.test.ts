import {kAppResourceType} from '../../../definitions/system';
import {extractResourceIdList} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';
import {NotFoundError} from '../../errors';
import {generateAndInsertFileBackendConfigListForTest} from '../../testUtils/generate/fileBackend';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {getBackendConfigsWithIdList} from '../configUtils';

describe('file backend config utils', () => {
  test('getBackendConfigsWithIdList', async () => {
    const configs = await generateAndInsertFileBackendConfigListForTest(/** count */ 5);
    const idList = extractResourceIdList(configs);

    const result = await getBackendConfigsWithIdList(idList);

    expect(result).toEqual(expect.arrayContaining(configs));
  });

  test('getBackendConfigsWithIdList throws if config not found', async () => {
    const configs = await generateAndInsertFileBackendConfigListForTest(/** count */ 2);
    const idList = extractResourceIdList(configs).concat([
      getNewIdForResource(kAppResourceType.FileBackendConfig),
      getNewIdForResource(kAppResourceType.FileBackendConfig),
    ]);

    await expectErrorThrown(async () => {
      await getBackendConfigsWithIdList(
        idList,
        /** throw error if config not found */ true
      );
    }, [NotFoundError.name]);
  });
});
