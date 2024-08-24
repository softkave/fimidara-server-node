import {faker} from '@faker-js/faker';
import {ensureDir} from 'fs-extra';
import {rm} from 'fs/promises';
import {flatten} from 'lodash-es';
import path from 'path';
import {indexArray} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {getNodeDirContent} from '../../../node/getNodeDirContent.js';
import {
  assertFimidaraFolderContent,
  assertLocalFilesAndFolders,
  genFimidaraFiles,
  genFimidaraFolders,
  genLocalFiles,
  genLocalFolders,
} from '../../../testutils/syncUtils.js';
import {
  fimidaraTestInstance,
  fimidaraTestVars,
} from '../../../testutils/tests/file.js';
import {stringifyFimidaraFolderpath} from '../../../utils.js';
import {copyFolder} from '../copyFolder.js';
import {FimidaraSyncDirection, kFimidaraSyncDirection} from '../types.js';

const kTestLocalFsDir = path.join(process.cwd(), 'testdir/copyFolder');
const testDir = path.join(kTestLocalFsDir + '/' + faker.number.int({min: 100}));

beforeAll(async () => {
  await ensureDir(testDir);
});

afterAll(async () => {
  await rm(testDir, {recursive: true, force: true});
});

async function genFimidaraFolderContentForFolders(
  fimidarapath: string,
  foldernames: string[],
  count: number
) {
  return await Promise.all(
    foldernames.map(async fName => {
      const ffp = path.posix.join(fimidarapath, fName);
      const [files, folders] = await Promise.all([
        genFimidaraFiles(ffp, count),
        genFimidaraFolders(ffp, count),
      ]);
      return {
        files,
        folders,
        parentpath: fimidarapath,
        foldername: fName,
      };
    })
  );
}

async function genLocalFolderContentForFolders(
  localpath: string,
  foldernames: string[],
  count: number
) {
  return await Promise.all(
    foldernames.map(async fName => {
      const lfp = path.join(localpath, fName);
      const [files, folders] = await Promise.all([
        genLocalFiles(lfp, count),
        genLocalFolders(lfp),
      ]);
      return {
        files,
        folders,
        parentpath: localpath,
        foldername: fName,
      };
    })
  );
}

async function assertCopyFolderLocal(
  localpath: string,
  fimidaraFilenames: string[],
  localFilenames: string[],
  fimidaraFoldernames: string[],
  localFoldernames: string[],
  direction: FimidaraSyncDirection,
  recursive: boolean,
  text: string
) {
  const isDown =
    direction === kFimidaraSyncDirection.down ||
    direction === kFimidaraSyncDirection.both;

  await assertLocalFilesAndFolders(
    localpath,
    localFilenames.concat(isDown ? fimidaraFilenames : []),
    localFoldernames.concat(isDown && recursive ? fimidaraFoldernames : [])
  );

  // await assertLocalFilesContent(localpath, files, text);
}

async function assertCopyFolderFimidara(
  fimidarapath: string,
  fimidaraFilenames: string[],
  localFilenames: string[],
  fimidaraFoldernames: string[],
  localFoldernames: string[],
  direction: FimidaraSyncDirection,
  recursive: boolean,
  text: string
) {
  const isUp =
    direction === kFimidaraSyncDirection.up ||
    direction === kFimidaraSyncDirection.both;

  const {files} = await assertFimidaraFolderContent(
    fimidarapath,
    fimidaraFilenames.concat(isUp ? localFilenames : []),
    fimidaraFoldernames.concat(isUp && recursive ? localFoldernames : []),
    /** beforeCopyDate */ undefined
  );

  // await assertFimidaraFilesContent(files, text);
}

async function assertCopyFolderRecursive(
  ffList: Awaited<ReturnType<typeof genFimidaraFolderContentForFolders>>,
  lfList: Awaited<ReturnType<typeof genFimidaraFolderContentForFolders>>,
  direction: FimidaraSyncDirection,
  text: string
) {
  const ffByName = indexArray(ffList, {indexer: ff => ff.foldername});
  const lfByName = indexArray(lfList, {indexer: lf => lf.foldername});

  for (const ff02 of ffList) {
    const lf02 = lfByName[ff02.foldername] as
      | (typeof lfByName)[keyof typeof lfByName]
      | undefined;
    await assertCopyFolderFimidara(
      path.posix.join(ff02.parentpath, ff02.foldername),
      ff02.files.filenames,
      lf02?.files.filenames || [],
      ff02.folders.foldernames,
      lf02?.folders.foldernames || [],
      direction || kFimidaraSyncDirection.both,
      /** recursive */ true,
      text
    );
  }

  for (const lf02 of lfList) {
    const ff02 = ffByName[lf02.foldername] as
      | (typeof ffByName)[keyof typeof ffByName]
      | undefined;
    await assertCopyFolderLocal(
      path.join(lf02.parentpath, lf02.foldername),
      ff02?.files.filenames || [],
      lf02.files.filenames,
      ff02?.folders.foldernames || [],
      lf02.folders.foldernames,
      direction || kFimidaraSyncDirection.both,
      /** recursive */ true,
      text
    );
  }
}

describe('copyFolder', () => {
  test.each([
    {paged: true},
    {recursive: false},
    {recursive: true, direction: kFimidaraSyncDirection.up},
    {recursive: true, direction: kFimidaraSyncDirection.down},
    {recursive: true, direction: kFimidaraSyncDirection.both},
  ])(
    'copies folder content recursive=$recursive paged=$paged direction=$direction',
    async ({
      paged,
      recursive = false,
      direction = kFimidaraSyncDirection.both,
    }) => {
      const foldername = faker.number.int({min: 10_000}).toString();
      const localpath = path.join(testDir, foldername);
      const fimidarapath = stringifyFimidaraFolderpath(
        {namepath: [foldername]},
        fimidaraTestVars.workspaceRootname
      );

      const count = paged ? 4 : 2;
      const pageSize = paged ? Math.ceil(count / 2) : count;
      const {text, filenames: fimidaraFilenames} = await genFimidaraFiles(
        fimidarapath,
        count
      );
      const {foldernames: fimidaraFoldernames} = await genFimidaraFolders(
        fimidarapath,
        count
      );

      // fimidara folder content depth 02
      const ff02List = await genFimidaraFolderContentForFolders(
        fimidarapath,
        fimidaraFoldernames,
        count
      );

      // fimidara folder content depth 03
      const ff03List = flatten(
        await Promise.all(
          ff02List.map(ff02 => {
            return genFimidaraFolderContentForFolders(
              path.posix.join(ff02.parentpath, ff02.foldername),
              ff02.folders.foldernames,
              count
            );
          })
        )
      );

      const {filenames: localFilenames} = await genLocalFiles(localpath, count);
      const {foldernames: localFoldernames} = await genLocalFolders(localpath);
      // local folder content depth 02
      const lf02List = await genLocalFolderContentForFolders(
        localpath,
        localFoldernames,
        count
      );

      // local folder content depth 03
      const lf03List = flatten(
        await Promise.all(
          lf02List.map(lf02 => {
            return genLocalFolderContentForFolders(
              path.join(lf02.parentpath, lf02.foldername),
              lf02.folders.foldernames,
              count
            );
          })
        )
      );

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
        const [
          dirContent,
          {
            body: {folders},
          },
        ] = await Promise.all([
          getNodeDirContent({folderpath: localpath}),
          fimidaraTestInstance.folders.listFolderContent({
            body: {pageSize, folderpath: fimidarapath, contentType: 'folder'},
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
