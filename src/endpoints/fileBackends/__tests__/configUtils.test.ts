import {kFimidaraResourceType} from '../../../definitions/system.js';
import {extractResourceIdList} from '../../../utils/fns.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {NotFoundError} from '../../errors.js';
import {generateAndInsertFileBackendConfigListForTest} from '../../testUtils/generate/fileBackend.js';
import {expectErrorThrown} from '../../testUtils/helpers/error.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {initTests} from '../../testUtils/testUtils.js';
import {getBackendConfigsWithIdList} from '../configUtils.js';
import {test, expect, beforeAll, afterAll, describe} from 'vitest';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('file backend config utils', () => {
  test('getBackendConfigsWithIdList', async () => {
    const configs = await generateAndInsertFileBackendConfigListForTest(/** count */ 5);
    const idList = extractResourceIdList(configs);

    const result = await getBackendConfigsWithIdList(idList);

    expect(result.length).toBe(idList.length);
    expect(extractResourceIdList(result)).toEqual(expect.arrayContaining(idList));
  });

  test('getBackendConfigsWithIdList throws if config not found', async () => {
    const configs = await generateAndInsertFileBackendConfigListForTest(/** count */ 2);
    const idList = extractResourceIdList(configs).concat([
      getNewIdForResource(kFimidaraResourceType.FileBackendConfig),
      getNewIdForResource(kFimidaraResourceType.FileBackendConfig),
    ]);

    await expectErrorThrown(async () => {
      await getBackendConfigsWithIdList(
        idList,
        /** throw error if config not found */ true
      );
    }, [NotFoundError.name]);
  });
});
