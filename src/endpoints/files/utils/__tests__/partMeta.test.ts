import {shuffle} from 'lodash-es';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kUtilsInjectables} from '../../../../contexts/injection/injectables.js';
import {completeTests} from '../../../testUtils/helpers/testFns.js';
import {initTests} from '../../../testUtils/testUtils.js';
import {kFileConstants} from '../../constants.js';
import {
  deletePartMetas,
  getPartMeta,
  getPartMetas,
  hasPartMeta,
  writePartMetas,
} from '../partMeta.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('partMeta', () => {
  test('writePartMetas', async () => {
    const fileId = '1';
    const parts = await writePartMetas({
      fileId,
      parts: [
        {
          part: 1,
          size: 100,
          multipartId: '1',
          partId: '1',
        },
        {
          part: 2,
          size: 200,
          multipartId: '1',
          partId: '2',
        },
        {
          part: 3,
          size: 300,
          multipartId: '1',
          partId: '3',
        },
      ],
    });

    const keys = parts.map(part =>
      kFileConstants.getPartCacheKey(fileId, part.part)
    );
    const cachedParts = await kUtilsInjectables.cache().getJsonList(keys);
    expect(cachedParts).toEqual(parts);
  });

  test('deletePartMetas', async () => {
    const fileId = '1';
    const parts = await writePartMetas({
      fileId,
      parts: [
        {
          part: 1,
          size: 100,
          multipartId: '1',
          partId: '1',
        },
        {
          part: 2,
          size: 200,
          multipartId: '1',
          partId: '2',
        },
        {
          part: 3,
          size: 300,
          multipartId: '1',
          partId: '3',
        },
      ],
    });
    await deletePartMetas({fileId, partLength: 3});
    const keys = parts.map(part =>
      kFileConstants.getPartCacheKey(fileId, part.part)
    );
    const cachedParts = await kUtilsInjectables.cache().getJsonList(keys);
    expect(cachedParts).toEqual([]);
  });

  test('getPartMeta', async () => {
    const fileId = '1';
    let part = await getPartMeta({fileId, part: 1});
    expect(part).toBeNull();

    const parts = await writePartMetas({
      fileId,
      parts: [
        {
          part: 1,
          size: 100,
          multipartId: '1',
          partId: '1',
        },
      ],
    });

    part = await getPartMeta({fileId, part: 1});
    expect(part).toEqual(parts[0]);
  });

  test('hasPartMeta', async () => {
    const fileId = '1';
    let {hasPart, part} = await hasPartMeta({fileId, part: 1});
    expect(hasPart).toBe(false);
    expect(part).toBeNull();

    const parts = await writePartMetas({
      fileId,
      parts: [
        {
          part: 1,
          size: 100,
          multipartId: '1',
          partId: '1',
        },
      ],
    });

    ({hasPart, part} = await hasPartMeta({fileId, part: 1}));
    expect(hasPart).toBe(true);
    expect(part).toEqual(parts[0]);
  });

  test('getPartMetas, not paged', async () => {
    const fileId = '1';
    let partMetas = await getPartMetas({fileId, partLength: 5});
    expect(partMetas).toEqual([]);

    const parts = await writePartMetas({
      fileId,
      parts: [
        {part: 1, size: 100, multipartId: '1', partId: '1'},
        {part: 2, size: 200, multipartId: '1', partId: '2'},
        {part: 3, size: 300, multipartId: '1', partId: '3'},
        {part: 4, size: 400, multipartId: '1', partId: '4'},
        {part: 5, size: 500, multipartId: '1', partId: '5'},
      ],
    });

    partMetas = await getPartMetas({fileId, partLength: 5});
    expect(partMetas).toEqual(parts);
  });

  test('getPartMetas, paged', async () => {
    const fileId = '1';
    const partMetas = await getPartMetas({fileId, partLength: 5});
    expect(partMetas).toEqual([]);

    const partLength = 10;
    const parts = await writePartMetas({
      fileId,
      parts: shuffle(Array.from({length: partLength}, (_, i) => i))
        .slice(0, 5)
        .sort((a, b) => a - b)
        .map(part => ({
          part,
          size: 100,
          multipartId: '1',
          partId: part.toString(),
        })),
    });

    const p1 = await getPartMetas({fileId, partLength, pageSize: 2});
    expect(p1).toEqual(parts.slice(0, 2));

    const p2 = await getPartMetas({
      fileId,
      partLength,
      pageSize: 3,
      fromPart: 2,
    });
    expect(p2).toEqual(parts.slice(2, 5));
  });
});
