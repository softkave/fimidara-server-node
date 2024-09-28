import {faker} from '@faker-js/faker';
import assert from 'assert';
import {ensureDir, ensureFile, remove} from 'fs-extra';
import path from 'path-browserify';
import {isObjectEmpty, loopAndCollate, pathBasename} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import type {FimidaraDiffExternalFile} from '../../diff/types.js';
import {File as FimidaraFile} from '../../endpoints/publicTypes.js';
import {stringifyFimidaraFilename} from '../../path/index.js';
import {diffNodeFiles} from '../diffNodeFiles.js';
import {getNodeDirContent} from '../getNodeDirContent.js';

const kTestLocalFsDir = path.join(process.cwd(), 'testdir/diffNodeFiles');
const testDir = path.join(kTestLocalFsDir + '/' + faker.number.int({min: 100}));

type FF = Pick<FimidaraFile, 'name' | 'ext' | 'lastUpdatedAt'>;

function sortEF(ef01: {name: string}, ef02: {name: string}) {
  return ef01.name < ef02.name ? -1 : ef01.name > ef02.name ? 1 : 0;
}

function transformEF(
  ef: FimidaraDiffExternalFile
): Pick<FimidaraDiffExternalFile, 'name'> {
  return {name: ef.name};
}

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

  let dirContent: Awaited<ReturnType<typeof getNodeDirContent>> | undefined;

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
    const efToFF = (ef: FimidaraDiffExternalFile): FF => ({
      name: pathBasename({input: stringifyFimidaraFilename(ef)}).basename,
      ext: pathBasename({input: stringifyFimidaraFilename(ef)}).ext,
      lastUpdatedAt: ef.lastModified,
    });
    const getActualEF = (ef: FimidaraDiffExternalFile) =>
      dirContent!.externalFilesRecord[ef.name];

    newEFList = genEF(2);
    updatedEFList = genEF(2);
    unmodifiedEFList = genEF(2);
    otherEFList = genEF(2);
    efList = newEFList.concat(updatedEFList, unmodifiedEFList, otherEFList);

    await Promise.all(
      efList.map(ef => ensureFile(path.join(folderpath, ef.name)))
    );

    dirContent = await getNodeDirContent({folderpath});
    assert(dirContent);

    newEFList = newEFList.map(getActualEF);
    updatedEFList = updatedEFList.map(getActualEF);
    unmodifiedEFList = unmodifiedEFList.map(getActualEF);
    otherEFList = otherEFList.map(getActualEF);
    efList = efList.map(getActualEF);

    newFFList = genFF(2).map(ff => ({...ff, lastUpdatedAt: Date.now()}));
    unmodifiedFFList = unmodifiedEFList.map(efToFF);
    otherFFList = updatedEFList
      .map(efToFF)
      .map(ff => ({...ff, lastUpdatedAt: ff.lastUpdatedAt - 1_000}));
    updatedFFList = otherEFList
      .map(efToFF)
      .map(ff => ({...ff, lastUpdatedAt: ff.lastUpdatedAt + 1_000}));
    ffList = newFFList.concat(updatedFFList, unmodifiedFFList, otherFFList);
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

    expect(newExternalFileList.sort(sortEF).map(transformEF)).toEqual(
      newEFList?.sort(sortEF).map(transformEF)
    );
    expect(updatedExternalFileList.sort(sortEF).map(transformEF)).toEqual(
      updatedEFList?.sort(sortEF).map(transformEF)
    );
    expect(unmodifiedExternalFileList.sort(sortEF).map(transformEF)).toEqual(
      unmodifiedEFList?.sort(sortEF).map(transformEF)
    );
    expect(newFimidaraFileList.sort(sortEF)).toEqual(newFFList?.sort(sortEF));
    expect(updatedFimidaraFileList.sort(sortEF)).toEqual(
      updatedFFList?.sort(sortEF)
    );
    expect(unmodifiedFimidaraFileList.sort(sortEF)).toEqual(
      unmodifiedFFList?.sort(sortEF)
    );

    expect(isObjectEmpty(dirContent.fileStatsRecord)).toBeFalsy();
    expect(isObjectEmpty(dirContent.externalFilesRecord)).toBeFalsy();
  });

  test('with dir content', async () => {
    assert(ffList);

    const {
      newExternalFileList,
      newFimidaraFileList,
      unmodifiedExternalFileList,
      unmodifiedFimidaraFileList,
      updatedExternalFileList,
      updatedFimidaraFileList,
    } = await diffNodeFiles({...dirContent, folderpath, fimidaraFiles: ffList});

    expect(newExternalFileList.sort(sortEF)).toEqual(newEFList?.sort(sortEF));
    expect(newFimidaraFileList.sort(sortEF)).toEqual(newFFList?.sort(sortEF));
    expect(unmodifiedExternalFileList.sort(sortEF)).toEqual(
      unmodifiedEFList?.sort(sortEF)
    );
    expect(unmodifiedFimidaraFileList.sort(sortEF)).toEqual(
      unmodifiedFFList?.sort(sortEF)
    );
    expect(updatedExternalFileList.sort(sortEF)).toEqual(
      updatedEFList?.sort(sortEF)
    );
    expect(updatedFimidaraFileList.sort(sortEF)).toEqual(
      updatedFFList?.sort(sortEF)
    );
  });
});
