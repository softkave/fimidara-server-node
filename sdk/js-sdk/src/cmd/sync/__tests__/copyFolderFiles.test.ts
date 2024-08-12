import {faker} from '@faker-js/faker';
import {text} from 'express';
import {ensureDir, ensureFile} from 'fs-extra';
import {readFile, writeFile} from 'fs/promises';
import {remove} from 'lodash-es';
import path from 'path';
import {indexArray, loopAndCollate} from 'softkave-js-utils';
import {afterAll, assert, beforeAll, describe, expect, test} from 'vitest';
import {getNodeDirContent} from '../../../node/getNodeDirContent.js';
import {File as FimidaraFile} from '../../../publicTypes.js';
import {uploadFileTestExecFn} from '../../../testutils/execFns/file.js';
import {
  fimidaraTestInstance,
  fimidaraTestVars,
} from '../../../testutils/tests/file.js';
import {streamToString} from '../../../testutils/utils.js';
import {
  stringifyFimidaraFilename,
  stringifyFimidaraFolderpath,
} from '../../../utils.js';
import {copyFolderFiles} from '../copyFolderFiles.js';

const kTestLocalFsDir = path.join(process.cwd(), 'testdir/copyFolderFiles');
const testDir = path.join(kTestLocalFsDir + '/' + faker.number.int({min: 100}));

beforeAll(async () => {
  await ensureDir(testDir);
});

afterAll(async () => {
  await remove(testDir);
});

/**
 * both
 */

async function genLocalFiles(localpath: string, count: number) {
  const text = 'Hello World!';
  const filenames = loopAndCollate(
    () => faker.number.int({min: 10_000}).toString(),
    count
  );
  await Promise.all(
    filenames.map(async fName => {
      const fp = path.join(localpath, fName);
      await ensureFile(fp);
      await writeFile(fp, text, 'utf-8');
    })
  );

  return {text, filenames};
}

async function genLocalFolders(localpath: string) {
  const foldernames = loopAndCollate(
    () => faker.number.int({min: 10_000}).toString(),
    /** count */ 1
  );
  await Promise.all(
    foldernames.map(async fName => {
      const fp = path.join(localpath, fName);
      await ensureDir(fp);
    })
  );

  return {foldernames};
}

async function genFimidaraFiles(fimidarapath: string, count: number) {
  const text = 'Hello World!';
  const buf = Buffer.from(text);
  const filenames = loopAndCollate(
    () => faker.number.int({min: 10_000}).toString(),
    count
  );
  await Promise.all(
    filenames.map(async fName => {
      await uploadFileTestExecFn(fimidaraTestInstance, fimidaraTestVars, {
        filepath: path.posix.join(fimidarapath, fName),
        data: text,
        size: buf.byteLength,
      });
    })
  );

  return {text, filenames};
}

async function genFimidaraFolders(fimidarapath: string) {
  const foldernames = loopAndCollate(
    () => faker.number.int({min: 10_000}).toString(),
    /** count */ 1
  );
  await Promise.all(
    foldernames.map(async fName => {
      const fp = path.posix.join(fimidarapath, fName);
      await fimidaraTestInstance.folders.addFolder({
        body: {folder: {folderpath: fp}},
      });
    })
  );

  return {foldernames};
}

async function assertLocalFilesAndFolders(
  localpath: string,
  filenames: string[] | undefined,
  foldernames: string[] | undefined
) {
  const {fileStatsRecord, folderStatsRecord, externalFilesRecord} =
    await getNodeDirContent({
      folderpath: localpath,
    });
  const localFilenameList = Object.keys(fileStatsRecord);
  const localFoldernameList = Object.keys(folderStatsRecord);

  if (filenames) {
    expect(filenames).toEqual(expect.arrayContaining(localFilenameList));
  }

  if (foldernames) {
    expect(foldernames).toEqual(expect.arrayContaining(localFoldernameList));
  }

  return {
    fileStatsRecord,
    folderStatsRecord,
    localFilenameList,
    localFoldernameList,
    externalFilesRecord,
  };
}

async function assertFimidaraFolderContent(
  fimidarapath: string,
  filenames: string[] | undefined,
  foldernames: string[] | undefined,
  pageSize: number,
  beforeCopyDate: number | undefined
) {
  const {
    body: {files, folders},
  } = await fimidaraTestInstance.folders.listFolderContent({
    body: {pageSize, folderpath: fimidarapath},
  });

  const fimidaraFilenamesMap = indexArray(files, {
    indexer: stringifyFimidaraFilename,
  });
  const fimidaraFoldernamesMap = indexArray(folders, {
    indexer: f => f.name,
  });
  const fimidaraFilenamesList = Object.keys(fimidaraFilenamesMap);
  const fimidaraFoldernamesList = Object.keys(fimidaraFoldernamesMap);

  if (filenames) {
    expect(filenames).toEqual(expect.arrayContaining(fimidaraFilenamesList));
  }

  if (foldernames) {
    expect(foldernames).toEqual(
      expect.arrayContaining(fimidaraFoldernamesList)
    );
  }

  if (beforeCopyDate) {
    files.forEach(f => {
      expect(f.lastUpdatedAt).toBeLessThanOrEqual(beforeCopyDate);
    });
  }

  return {
    files,
    folders,
    fimidaraFilenamesMap,
    fimidaraFoldernamesMap,
    fimidaraFilenamesList,
    fimidaraFoldernamesList,
  };
}

async function assertFimidaraFilesContent(files: FimidaraFile[]) {
  const fStrList = await Promise.all(
    files.map(async f => {
      const {body} = await fimidaraTestInstance.files.readFile({
        body: {fileId: f.resourceId},
        responseType: 'stream',
      });
      return await streamToString(body);
    })
  );

  fStrList.forEach((str, i) =>
    expect(str, `${files[i].name} data is incorrect`).toBe(text)
  );
}

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

async function assertLocalFilesContent(
  localpath: string,
  files: FimidaraFile[]
) {
  const fStrList = await Promise.all(
    files.map(async f =>
      readFile(path.join(localpath, stringifyFimidaraFilename(f)), 'utf-8')
    )
  );

  fStrList.forEach((str, i) =>
    expect(str, `${files[i].name} data is incorrect`).toBe(text)
  );
}

describe('copyFolderFiles', () => {
  test.each([
    {paged: true},
    {paged: false},
    {matchTree: true},
    {matchTree: false},
  ])('up paged=$paged matchTree=$matchTree', async ({paged, matchTree}) => {
    const foldername = faker.number.int({min: 10_000}).toString();
    const localpath = path.join(testDir, foldername);
    const fimidarapath = stringifyFimidaraFolderpath(
      {namepath: [foldername]},
      fimidaraTestVars.workspaceRootname
    );

    const count = paged ? 10 : 5;
    const pageSize = paged ? Math.floor(count / 2) : count;
    const {filenames} = await genLocalFiles(localpath, count);
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
        direction: 'up',
      },
      await getNodeDirContent({folderpath: localpath}),
      pageSize
    );

    await assertLocalFilesAndFolders(localpath, filenames, foldernames);
    const {files, fimidaraFilenamesList} = await assertFimidaraFolderContent(
      fimidarapath,
      filenames,
      /** foldernames */ undefined,
      pageSize,
      /** beforeCopyDate */ undefined
    );
    await assertFimidaraFilesContent(files);
    assertMatchTree(matchTree, extraFimidaraFilenames, fimidaraFilenamesList);
  });

  test.each([
    {paged: true},
    {paged: false},
    {matchTree: true},
    {matchTree: false},
  ])('down paged=$paged matchTree=$matchTree', async ({paged, matchTree}) => {
    const foldername = faker.number.int({min: 10_000}).toString();
    const localpath = path.join(testDir, foldername);
    const fimidarapath = stringifyFimidaraFolderpath(
      {namepath: [foldername]},
      fimidaraTestVars.workspaceRootname
    );

    const count = paged ? 10 : 5;
    const pageSize = paged ? Math.floor(count / 2) : count;
    const {filenames} = await genFimidaraFiles(fimidarapath, count);
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
        direction: 'down',
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
      pageSize,
      beforeCopyDate
    );
    await assertLocalFilesContent(localpath, files);
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
      const {filenames: fimidaraFilenames} = await genFimidaraFiles(
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
          direction: 'both',
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
        pageSize,
        /** beforeCopyDate */ undefined
      );
      await assertLocalFilesContent(localpath, files);
      await assertFimidaraFilesContent(files);
    }
  );
});
