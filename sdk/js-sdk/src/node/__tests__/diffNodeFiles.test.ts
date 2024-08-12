import {faker} from '@faker-js/faker';
import assert from 'assert';
import {ensureDir, ensureFile, remove} from 'fs-extra';
import path from 'path';
import {isObjectEmpty, loopAndCollate, pathBasename} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {FimidaraDiffExternalFile} from '../../diff/types.js';
import {File as FimidaraFile} from '../../publicTypes.js';
import {stringifyFimidaraFilename} from '../../utils.js';
import {diffNodeFiles} from '../diffNodeFiles.js';
import {getNodeDirContent} from '../getNodeDirContent.js';

const kTestLocalFsDir = path.join(process.cwd(), 'testdir/diffNodeFiles');
const testDir = path.join(kTestLocalFsDir + '/' + faker.number.int({min: 100}));

type FF = Pick<FimidaraFile, 'name' | 'ext' | 'lastUpdatedAt'>;

beforeAll(async () => {
  await ensureDir(testDir);
});

afterAll(async () => {
  await remove(testDir);
});

describe('diffNodeFiles', () => {
  const folderpath = path.join(
    testDir,
    faker.number.int({min: 10_000}).toString()
  );

  let newFFList: FF[] | undefined;
  let unmodifiedFFList: FF[] | undefined;
  let otherFFList: FF[] | undefined;
  let updatedFFList: FF[] | undefined;

  let newEFList: FimidaraDiffExternalFile[] | undefined;
  let updatedEFList: FimidaraDiffExternalFile[] | undefined;
  let unmodifiedEFList: FimidaraDiffExternalFile[] | undefined;
  let otherEFList: FimidaraDiffExternalFile[] | undefined;

  let efList: FimidaraDiffExternalFile[] | undefined;
  let ffList: FF[] | undefined;

  beforeAll(async () => {
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

    newFFList = genFF(2);
    unmodifiedFFList = genFF(2);
    otherFFList = genFF(2);

    newEFList = genEF(2);
    updatedEFList = otherFFList
      .map(ffToEF)
      .map(ef => ({...ef, lastModified: ef.lastModified + 10}));
    unmodifiedEFList = unmodifiedFFList.map(ffToEF);
    otherEFList = genEF(2);

    updatedFFList = otherEFList
      .map(efToFF)
      .map(ff => ({...ff, lastUpdatedAt: ff.lastUpdatedAt + 10}));

    efList = newEFList.concat(updatedEFList, unmodifiedEFList, otherEFList);
    ffList = newFFList.concat(updatedFFList, unmodifiedFFList, otherFFList);

    await Promise.all(
      efList.map(ef => ensureFile(path.join(folderpath, ef.name)))
    );
  });

  test('without dir content', async () => {
    assert(ffList);

    const {
      newExternalFileList,
      newFimidaraFileList,
      unmodifiedExternalFileList,
      unmodifiedFimidaraFileList,
      updatedExternalFileList,
      updatedFimidaraFileList,
      ...dirContent
    } = await diffNodeFiles({folderpath, fimidaraFiles: ffList});

    expect(newExternalFileList).toEqual(newEFList);
    expect(newFimidaraFileList).toEqual(newFFList);
    expect(unmodifiedExternalFileList).toEqual(unmodifiedEFList);
    expect(unmodifiedFimidaraFileList).toEqual(unmodifiedFFList);
    expect(updatedExternalFileList).toEqual(updatedEFList);
    expect(updatedFimidaraFileList).toEqual(updatedFFList);

    expect(isObjectEmpty(dirContent.fileStatsRecord)).toBeFalsy();
    expect(isObjectEmpty(dirContent.folderStatsRecord)).toBeFalsy();
    expect(isObjectEmpty(dirContent.externalFilesRecord)).toBeFalsy();
  });

  test('with dir content', async () => {
    assert(ffList);
    const dirContent = await getNodeDirContent({folderpath});

    const {
      newExternalFileList,
      newFimidaraFileList,
      unmodifiedExternalFileList,
      unmodifiedFimidaraFileList,
      updatedExternalFileList,
      updatedFimidaraFileList,
    } = await diffNodeFiles({...dirContent, folderpath, fimidaraFiles: ffList});

    expect(newExternalFileList).toEqual(newEFList);
    expect(newFimidaraFileList).toEqual(newFFList);
    expect(unmodifiedExternalFileList).toEqual(unmodifiedEFList);
    expect(unmodifiedFimidaraFileList).toEqual(unmodifiedFFList);
    expect(updatedExternalFileList).toEqual(updatedEFList);
    expect(updatedFimidaraFileList).toEqual(updatedFFList);
  });
});
