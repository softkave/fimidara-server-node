import {faker} from '@faker-js/faker';
import {loopAndCollate, pathBasename} from 'softkave-js-utils';
import {describe, expect, test} from 'vitest';
import {File as FimidaraFile} from '../../endpoints/publicTypes.js';
import {stringifyFimidaraFilename} from '../../path/index.js';
import {diffFiles} from '../diffFiles.js';
import type {FimidaraDiffExternalFile} from '../types.js';

type FF = Pick<FimidaraFile, 'name' | 'ext' | 'lastUpdatedAt'>;

describe('diffFiles', () => {
  test('diffed files', () => {
    const hasExt = faker.datatype.boolean();

    const genFF = (count: number) =>
      loopAndCollate(
        (): FF => ({
          name: faker.lorem.words(),
          ext: hasExt ? faker.lorem.word() : undefined,
          lastUpdatedAt: faker.number.int(),
        }),
        count
      );
    const genEF = (count: number) =>
      loopAndCollate(
        (): FimidaraDiffExternalFile => ({
          name: faker.lorem.words() + (hasExt ? `.${faker.lorem.word()}` : ''),
          lastModified: faker.number.int(),
        }),
        count
      );
    const ffToEF = (f: FF): FimidaraDiffExternalFile => ({
      name: stringifyFimidaraFilename(f),
      lastModified: f.lastUpdatedAt,
    });
    const efToFF = (ef: FimidaraDiffExternalFile): FF => ({
      name: pathBasename({input: stringifyFimidaraFilename(ef)}).basename,
      ext: pathBasename({input: stringifyFimidaraFilename(ef)}).ext,
      lastUpdatedAt: ef.lastModified,
    });

    const newFFList = genFF(2);
    const unmodifiedFFList = genFF(2);
    const otherFFList = genFF(2);

    const newEFList = genEF(2);
    const updatedEFList = otherFFList
      .map(ffToEF)
      .map(ef => ({...ef, lastModified: ef.lastModified + 10}));
    const unmodifiedEFList = unmodifiedFFList.map(ffToEF);
    const otherEFList = genEF(2);

    const updatedFFList = otherEFList
      .map(efToFF)
      .map(ff => ({...ff, lastUpdatedAt: ff.lastUpdatedAt + 10}));

    const efList = newEFList.concat(
      updatedEFList,
      unmodifiedEFList,
      otherEFList
    );
    const ffList = newFFList.concat(
      updatedFFList,
      unmodifiedFFList,
      otherFFList
    );

    const {
      newExternalFileList,
      newFimidaraFileList,
      unmodifiedExternalFileList,
      unmodifiedFimidaraFileList,
      updatedExternalFileList,
      updatedFimidaraFileList,
    } = diffFiles({externalFiles: efList, fimidaraFiles: ffList});

    expect(newExternalFileList).toEqual(newEFList);
    expect(newFimidaraFileList).toEqual(newFFList);
    expect(unmodifiedExternalFileList).toEqual(unmodifiedEFList);
    expect(unmodifiedFimidaraFileList).toEqual(unmodifiedFFList);
    expect(updatedExternalFileList).toEqual(updatedEFList);
    expect(updatedFimidaraFileList).toEqual(updatedFFList);
  });
});
