import {faker} from '@faker-js/faker';
import {ensureDir} from 'fs-extra';
import {rm} from 'fs/promises';
import path from 'path-browserify';
import {indexArray} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {getNodeDirContent} from '../../../node/getNodeDirContent.js';
import {
  assertCopyFolderFimidara,
  assertCopyFolderLocal,
  assertCopyFolderRecursive,
} from '../../../testutils/sync/copyFolderAssertions.js';
import {setupCopyFolder} from '../../../testutils/sync/setupCopyFolder.js';
import {
  fimidaraTestInstance,
  fimidaraTestVars,
} from '../../../testutils/tests/file.js';
import {copyFolder} from '../copyFolder.js';
import {kFimidaraSyncDirection} from '../types.js';

const kTestLocalFsDir = path.join(process.cwd(), 'testdir/copyFolder');
const testDir = path.join(kTestLocalFsDir + '/' + faker.number.int({min: 100}));

beforeAll(async () => {
  await ensureDir(testDir);
});

afterAll(async () => {
  await rm(testDir, {recursive: true, force: true});
});

describe('copyFolder', () => {
  test.each([
    {paged: true, recursive: undefined, direction: undefined},
    {recursive: false, paged: undefined, direction: undefined},
    {recursive: true, direction: kFimidaraSyncDirection.up},
    {recursive: true, direction: kFimidaraSyncDirection.down},
    {recursive: true, direction: kFimidaraSyncDirection.both, paged: undefined},
  ])(
    'copies folder content recursive=$recursive paged=$paged direction=$direction',
    async ({
      paged,
      recursive = false,
      direction = kFimidaraSyncDirection.both,
    }) => {
      const {
        fimidarapath,
        localpath,
        pageSize,
        fimidaraFilenames,
        localFilenames,
        ff02List,
        localFoldernames,
        text,
        fimidaraFoldernames,
        lf02List,
        ff03List,
        lf03List,
      } = await setupCopyFolder(testDir, paged);

      await copyFolder(
        fimidarapath,
        localpath,
        /** opts */ {
          fimidarapath,
          localpath,
          recursive,
          direction,
          matchTree: false,
          authToken: fimidaraTestVars.authToken,
          serverURL: fimidaraTestVars.serverURL,
          clientMultipartIdPrefix: 'test005',
        },
        pageSize
      );

      await assertCopyFolderLocal(
        localpath,
        fimidaraFilenames,
        localFilenames,
        ff02List
          .filter(ff => !!ff.files.filenames.length)
          .map(ff => ff.foldername),
        localFoldernames,
        direction,
        recursive,
        text
      );

      await assertCopyFolderFimidara(
        fimidarapath,
        fimidaraFilenames,
        localFilenames,
        fimidaraFoldernames,
        lf02List
          .filter(lf => !!lf.files.filenames.length)
          .map(lf => lf.foldername),
        direction,
        recursive,
        text
      );

      if (recursive) {
        await assertCopyFolderRecursive(ff02List, lf02List, direction, text);
        await assertCopyFolderRecursive(ff03List, lf03List, direction, text);
      } else {
        const [dirContent, {folders}] = await Promise.all([
          getNodeDirContent({folderpath: localpath}),
          fimidaraTestInstance.folders.listFolderContent({
            pageSize,
            folderpath: fimidarapath,
            contentType: 'folder',
          }),
        ]);

        const foldersRecord = indexArray(folders, {indexer: f => f.name});

        ff02List.forEach(ff02 => {
          expect(dirContent.folderStatsRecord[ff02.foldername]).toBeFalsy();
        });
        lf02List.forEach(lf02 => {
          expect(foldersRecord[lf02.foldername]).toBeFalsy();
        });
      }
    },
    {timeout: 30_000}
  );
});
