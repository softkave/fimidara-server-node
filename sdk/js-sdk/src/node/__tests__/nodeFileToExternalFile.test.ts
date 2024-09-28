import {faker} from '@faker-js/faker';
import assert, {AssertionError} from 'assert';
import {Dirent} from 'fs';
import {ensureDir, ensureFile, remove} from 'fs-extra';
import path from 'path-browserify';
import {waitTimeout} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {nodeFileToExternalFile} from '../nodeFileToExternalFile.js';

const kTestLocalFsDir = path.join(
  process.cwd(),
  'testdir/nodeFileToExternalFile'
);
const testDir = path.join(kTestLocalFsDir + '/' + faker.number.int({min: 100}));

beforeAll(async () => {
  await ensureDir(testDir);
});

afterAll(async () => {
  await remove(testDir);
});

describe('nodeFileToExternalFile', () => {
  describe('with file', () => {
    const folderpath = path.join(
      testDir,
      faker.number.int({min: 10_000}).toString()
    );
    const filename = faker.number.int({min: 10_000}).toString();
    const filepath = path.join(folderpath, filename);
    const lastModified = {before: Date.now(), after: Date.now()};

    beforeAll(async () => {
      await ensureFile(filepath);
      await waitTimeout(10);
      lastModified.after = Date.now();
    });

    test('with dirent', async () => {
      const df: Pick<Dirent, 'parentPath' | 'name'> = {
        parentPath: folderpath,
        name: filename,
      };

      const {stats, externalFile} = await nodeFileToExternalFile({dirent: df});

      expect(stats).toBeTruthy();
      expect(externalFile?.name).toBe(filename);
      expect(externalFile?.lastModified).toBeGreaterThanOrEqual(
        lastModified.before
      );
      expect(externalFile?.lastModified).toBeLessThanOrEqual(
        lastModified.after
      );
    });

    test('with filepath', async () => {
      const {stats, externalFile} = await nodeFileToExternalFile({filepath});

      expect(stats).toBeTruthy();
      expect(externalFile?.name).toBe(filename);
      expect(externalFile?.lastModified).toBeGreaterThanOrEqual(
        lastModified.before
      );
      expect(externalFile?.lastModified).toBeLessThanOrEqual(
        lastModified.after
      );
    });
  });

  describe('with folder', () => {
    const foldername = faker.number.int({min: 10_000}).toString();
    const folderpath = path.join(testDir, foldername);

    beforeAll(async () => {
      await ensureDir(folderpath);
    });

    test('with dirent', async () => {
      const df: Pick<Dirent, 'parentPath' | 'name'> = {
        parentPath: testDir,
        name: foldername,
      };

      const {stats, externalFile} = await nodeFileToExternalFile({dirent: df});

      expect(stats).toBeTruthy();
      expect(externalFile).toBeFalsy();
    });

    test('with filepath', async () => {
      const {stats, externalFile} = await nodeFileToExternalFile({
        filepath: folderpath,
      });

      expect(stats).toBeTruthy();
      expect(externalFile).toBeFalsy();
    });
  });

  test('without dirent or filepath', async () => {
    try {
      await nodeFileToExternalFile({});
      assert.fail('Error not thrown');
    } catch (error: unknown) {
      expect(error).instanceOf(AssertionError);
    }
  });
});
