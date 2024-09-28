import path from 'path-browserify';
import {indexArray} from 'softkave-js-utils';
import {
  FimidaraSyncDirection,
  kFimidaraSyncDirection,
} from '../../cmd/sync/types.js';
import {genFimidaraFolderContentForFolders} from './genFimidaraFolderContentForFolders.js';
import {
  assertFimidaraFolderContent,
  assertLocalFilesAndFolders,
} from './syncUtils.js';

export async function assertCopyFolderLocal(
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

export async function assertCopyFolderFimidara(
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

export async function assertCopyFolderRecursive(
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
