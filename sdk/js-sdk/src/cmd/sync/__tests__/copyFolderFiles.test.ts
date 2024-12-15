import {faker} from '@faker-js/faker';
import {ensureDir, rm} from 'fs-extra';
import path from 'path-browserify';
import {afterAll, assert, beforeAll, describe, expect, test} from 'vitest';
import {getNodeDirContent} from '../../../node/getNodeDirContent.js';
import {stringifyFimidaraFolderpath} from '../../../path/index.js';
import {
  assertFimidaraFilesContent,
  assertFimidaraFolderContent,
  assertLocalFilesAndFolders,
  assertLocalFilesContent,
  genFimidaraFiles,
  genFimidaraFolders,
  genLocalFiles,
  genLocalFolders,
} from '../../../testutils/sync/syncUtils.js';
import {fimidaraTestVars} from '../../../testutils/tests/file.js';
import {copyFolderFiles} from '../copyFolderFiles.js';

const kTestLocalFsDir = path.join(process.cwd(), 'testdir/copyFolderFiles');
const testDir = kTestLocalFsDir;

beforeAll(async () => {
  await ensureDir(testDir);
});

afterAll(async () => {
  await rm(testDir, {recursive: true, force: true});
});

function assertMatchTree(
  matchTree: boolean | undefined,
  existingFilenames: string[],
  actualFilenames: string[]
) {
  if (matchTree) {
    assert(existingFilenames);
    expect(actualFilenames).not.toEqual(
      expect.arrayContaining(existingFilenames)
    );
  } else {
    expect(actualFilenames).toEqual(expect.arrayContaining(existingFilenames));
  }
}

describe('copyFolderFiles', () => {
  test.each([
    {paged: false},
    {paged: true},
    {matchTree: false},
    {matchTree: true},
  ])('up paged=$paged matchTree=$matchTree', async ({paged, matchTree}) => {
    const foldername = faker.number.int({min: 10_000}).toString();
    const localpath = path.join(testDir, foldername);
    const fimidarapath = stringifyFimidaraFolderpath(
      {namepath: [foldername]},
      fimidaraTestVars.workspaceRootname
    );

    const count = paged ? 10 : 5;
    const pageSize = paged ? Math.floor(count / 2) : count;
    const {filenames, text} = await genLocalFiles(localpath, count);
    const {foldernames} = await genLocalFolders(localpath);
    const {filenames: extraFimidaraFilenames} = await genFimidaraFiles(
      fimidarapath,
      /** count */ 5
    );

    await copyFolderFiles(
      fimidarapath,
      localpath,
      /** opts */ {
        matchTree,
        authToken: fimidaraTestVars.authToken,
        serverURL: fimidaraTestVars.serverURL,
        direction: 'up',
        clientMultipartIdPrefix: 'test002',
      },
      await getNodeDirContent({folderpath: localpath}),
      pageSize
    );

    await assertLocalFilesAndFolders(localpath, filenames, foldernames);
    const {files, fimidaraFilenamesList} = await assertFimidaraFolderContent(
      fimidarapath,
      filenames,
      /** foldernames */ undefined,
      /** beforeCopyDate */ undefined
    );
    await assertFimidaraFilesContent(files, text);
    assertMatchTree(matchTree, extraFimidaraFilenames, fimidaraFilenamesList);
  });

  test.each([
    {paged: false},
    {paged: true},
    {matchTree: false},
    {matchTree: true},
  ])('down paged=$paged matchTree=$matchTree', async ({paged, matchTree}) => {
    const foldername = faker.number.int({min: 10_000}).toString();
    const localpath = path.join(testDir, foldername);
    const fimidarapath = stringifyFimidaraFolderpath(
      {namepath: [foldername]},
      fimidaraTestVars.workspaceRootname
    );

    const count = paged ? 10 : 5;
    const pageSize = paged ? Math.floor(count / 2) : count;
    const {text, filenames} = await genFimidaraFiles(fimidarapath, count);
    const {foldernames} = await genFimidaraFolders(fimidarapath);
    const {filenames: extraLocalFilenames} = await genLocalFiles(
      localpath,
      /** count */ 5
    );
    const beforeCopyDate = Date.now();

    await copyFolderFiles(
      fimidarapath,
      localpath,
      /** opts */ {
        matchTree,
        authToken: fimidaraTestVars.authToken,
        serverURL: fimidaraTestVars.serverURL,
        direction: 'down',
        clientMultipartIdPrefix: 'test003',
      },
      await getNodeDirContent({folderpath: localpath}),
      pageSize
    );

    const {localFilenameList} = await assertLocalFilesAndFolders(
      localpath,
      filenames,
      /** foldernames */ undefined
    );
    const {files} = await assertFimidaraFolderContent(
      fimidarapath,
      filenames,
      foldernames,
      beforeCopyDate
    );
    await assertLocalFilesContent(localpath, files, text);
    await assertMatchTree(matchTree, extraLocalFilenames, localFilenameList);
  });

  test.each([{paged: true}, {paged: false}])(
    'both paged=$paged matchTree=$matchTree',
    async ({paged}) => {
      const foldername = faker.number.int({min: 10_000}).toString();
      const localpath = path.join(testDir, foldername);
      const fimidarapath = stringifyFimidaraFolderpath(
        {namepath: [foldername]},
        fimidaraTestVars.workspaceRootname
      );

      const count = paged ? 10 : 5;
      const pageSize = paged ? Math.floor(count / 2) : count;
      const {text, filenames: fimidaraFilenames} = await genFimidaraFiles(
        fimidarapath,
        count
      );
      const {foldernames: fimidaraFoldernames} = await genFimidaraFolders(
        fimidarapath
      );
      const {filenames: extraFimidaraFilenames} = await genFimidaraFiles(
        fimidarapath,
        /** count */ 5
      );
      const {filenames: localFilenames} = await genLocalFiles(localpath, count);
      const {foldernames: localFoldernames} = await genLocalFolders(localpath);
      const {filenames: extraLocalFilenames} = await genLocalFiles(
        localpath,
        /** count */ 5
      );

      await copyFolderFiles(
        fimidarapath,
        localpath,
        /** opts */ {
          matchTree: true,
          authToken: fimidaraTestVars.authToken,
          serverURL: fimidaraTestVars.serverURL,
          direction: 'both',
          clientMultipartIdPrefix: 'test004',
        },
        await getNodeDirContent({folderpath: localpath}),
        pageSize
      );

      await assertLocalFilesAndFolders(
        localpath,
        fimidaraFilenames.concat(
          extraFimidaraFilenames,
          localFilenames,
          extraLocalFilenames
        ),
        localFoldernames
      );
      const {files} = await assertFimidaraFolderContent(
        fimidarapath,
        fimidaraFilenames.concat(
          localFilenames,
          extraLocalFilenames,
          extraFimidaraFilenames
        ),
        fimidaraFoldernames,
        /** beforeCopyDate */ undefined
      );
      await assertLocalFilesContent(localpath, files, text);
      await assertFimidaraFilesContent(files, text);
    }
  );
});
