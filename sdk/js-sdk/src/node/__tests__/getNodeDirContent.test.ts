import {faker} from '@faker-js/faker';
import {ensureDir, ensureFile, remove} from 'fs-extra';
import path from 'path-browserify';
import {loopAndCollate, waitTimeout} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {getNodeDirContent} from '../getNodeDirContent.js';

const kTestLocalFsDir = path.join(process.cwd(), 'testdir/getNodeDirContent');
const testDir = path.join(kTestLocalFsDir + '/' + faker.number.int({min: 100}));

beforeAll(async () => {
  await ensureDir(testDir);
});

afterAll(async () => {
  await remove(testDir);
});

describe('getNodeDirContent', () => {
  test('returned content', async () => {
    const folderpath = path.join(
      testDir,
      faker.number.int({min: 10_000}).toString()
    );

    const beforeCreation = Date.now();
    const filenames = loopAndCollate(
      () => faker.number.int({min: 10_000}).toString(),
      /** count */ 5
    );
    const foldernames = loopAndCollate(
      () => faker.number.int({min: 10_000}).toString(),
      /** count */ 5
    );
    await Promise.all(
      filenames
        .map(fName => ensureFile(path.join(folderpath, fName)))
        .concat(
          foldernames.map(fName => ensureDir(path.join(folderpath, fName)))
        )
    );
    await waitTimeout(10);
    const afterCreation = Date.now();

    const {externalFilesRecord, fileStatsRecord, folderStatsRecord} =
      await getNodeDirContent({folderpath});

    expect(filenames).toEqual(
      expect.arrayContaining(Object.keys(externalFilesRecord))
    );
    expect(filenames).toEqual(
      expect.arrayContaining(Object.keys(fileStatsRecord))
    );
    expect(foldernames).toEqual(
      expect.arrayContaining(Object.keys(folderStatsRecord))
    );

    filenames.forEach(fName => {
      expect(externalFilesRecord[fName].lastModified).toBeGreaterThanOrEqual(
        beforeCreation
      );
      expect(externalFilesRecord[fName].lastModified).toBeLessThanOrEqual(
        afterCreation
      );
      expect(fileStatsRecord[fName]).toBeTruthy();
    });

    foldernames.forEach(fName => {
      expect(folderStatsRecord[fName]).toBeTruthy();
    });
  });
});
