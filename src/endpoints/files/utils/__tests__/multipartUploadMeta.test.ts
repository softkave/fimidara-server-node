import {compact, shuffle} from 'lodash-es';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIkxUtils} from '../../../../contexts/ijx/injectables.js';
import {completeTests} from '../../../testUtils/helpers/testFns.js';
import {initTests} from '../../../testUtils/testUtils.js';
import {kFileConstants} from '../../constants.js';
import {
  deleteMultipartUploadPartMetas,
  getMultipartUploadPartMeta,
  getMultipartUploadPartMetas,
  writeMultipartUploadPartMetas,
} from '../multipartUploadMeta.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('multipartUploadMeta', () => {
  test('writeMultipartUploadPartMetas', async () => {
    const multipartId = 'multipartId' + Math.random();
    const partNums = [1, 2, 3];
    const parts = await writeMultipartUploadPartMetas({
      multipartId,
      parts: partNums.map(partNum => ({
        part: partNum,
        size: 100,
        multipartId,
        partId: partNum.toString(),
      })),
    });

    const keys = parts.map(part =>
      kFileConstants.getPartCacheKey(multipartId, part.part)
    );
    const cachedParts = await kIkxUtils.cache().getJsonList(keys);
    expect(cachedParts).toEqual(parts);

    const set = await kIkxUtils.dset().getAll(multipartId);
    expect(set).toEqual(partNums.map(partNum => partNum.toString()));
  });

  test('deleteMultipartUploadPartMetas, part', async () => {
    const multipartId = 'multipartId' + Math.random();
    const parts = await writeMultipartUploadPartMetas({
      multipartId,
      parts: [
        {
          multipartId,
          part: 1,
          size: 100,
          partId: '1',
        },
        {
          multipartId,
          part: 2,
          size: 200,
          partId: '2',
        },
        {
          multipartId,
          part: 3,
          size: 300,
          partId: '3',
        },
      ],
    });

    await deleteMultipartUploadPartMetas({multipartId, part: 3});
    const key0 = kFileConstants.getPartCacheKey(multipartId, 1);
    const key1 = kFileConstants.getPartCacheKey(multipartId, 2);
    const key2 = kFileConstants.getPartCacheKey(multipartId, 3);
    const cachedParts = await kIkxUtils.cache().getJsonList([key0, key1, key2]);
    const remainingParts = parts.filter(part => part.part !== 3);
    expect(compact(cachedParts)).toEqual(remainingParts);

    const set = await kIkxUtils.dset().getAll(multipartId);
    expect(set).toEqual(['1', '2']);
  });

  test('deleteMultipartUploadPartMetas, full', async () => {
    const multipartId = 'multipartId' + Math.random();
    await writeMultipartUploadPartMetas({
      multipartId,
      parts: [
        {
          multipartId,
          part: 1,
          size: 100,
          partId: '1',
        },
        {
          multipartId,
          part: 2,
          size: 200,
          partId: '2',
        },
        {
          multipartId,
          part: 3,
          size: 300,
          partId: '3',
        },
      ],
    });

    await deleteMultipartUploadPartMetas({multipartId});
    const key0 = kFileConstants.getPartCacheKey(multipartId, 1);
    const key1 = kFileConstants.getPartCacheKey(multipartId, 2);
    const key2 = kFileConstants.getPartCacheKey(multipartId, 3);
    const cachedParts = await kIkxUtils.cache().getJsonList([key0, key1, key2]);
    expect(compact(cachedParts)).toEqual([]);

    const set = await kIkxUtils.dset().getAll(multipartId);
    expect(set).toEqual([]);
  });

  test('getMultipartUploadPartMeta', async () => {
    const multipartId = 'multipartId' + Math.random();
    let part = await getMultipartUploadPartMeta({multipartId, part: 1});
    expect(part).toBeNull();

    const parts = await writeMultipartUploadPartMetas({
      multipartId,
      parts: [
        {
          part: 1,
          size: 100,
          multipartId,
          partId: '1',
        },
      ],
    });

    part = await getMultipartUploadPartMeta({multipartId, part: 1});
    expect(part).toEqual(parts[0]);
  });

  test('getMultipartUploadPartMetas, not paged', async () => {
    const multipartId = 'multipartId' + Math.random();
    const prefill = await getMultipartUploadPartMetas({
      multipartId,
    });
    expect(prefill.parts).toEqual([]);
    expect(prefill.isDone).toBe(true);

    const parts = await writeMultipartUploadPartMetas({
      multipartId,
      parts: [
        {part: 1, size: 100, multipartId, partId: '1'},
        {part: 2, size: 200, multipartId, partId: '2'},
        {part: 3, size: 300, multipartId, partId: '3'},
        {part: 4, size: 400, multipartId, partId: '4'},
        {part: 5, size: 500, multipartId, partId: '5'},
      ],
    });

    const {isDone, parts: partMetas} = await getMultipartUploadPartMetas({
      multipartId,
    });
    expect(partMetas).toEqual(parts);
    expect(isDone).toBe(true);
  });

  test('getMultipartUploadPartMetas, paged', async () => {
    const multipartId = 'multipartId' + Math.random();
    const prefill = await getMultipartUploadPartMetas({
      multipartId,
      pageSize: 5,
    });
    expect(prefill.parts).toEqual([]);
    expect(prefill.isDone).toBe(true);

    const partLength = 10;
    const parts = await writeMultipartUploadPartMetas({
      multipartId,
      parts: shuffle(Array.from({length: partLength}, (_, i) => i))
        .slice(0, 5)
        .sort((a, b) => a - b)
        .map(part => ({
          part,
          size: 100,
          multipartId,
          partId: part.toString(),
        })),
    });

    const p1 = await getMultipartUploadPartMetas({
      multipartId,
      pageSize: 2,
    });
    const fetchedParts = p1.parts;

    if (fetchedParts.length < parts.length) {
      const p2 = await getMultipartUploadPartMetas({
        multipartId,
        pageSize: 3,
        cursor: p1.continuationToken,
      });
      expect(p2.parts).toEqual(parts.slice(2, 5));
      expect(p2.isDone).toBe(true);
      expect(p2.continuationToken).toBeNull();

      fetchedParts.push(...p2.parts);
    }

    expect(fetchedParts).toEqual(parts);
  });
});
