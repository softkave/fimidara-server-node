import {rm} from 'fs/promises';
import {chunk} from 'lodash-es';
import path from 'path-browserify';
import {getFullFolderContent} from '../../folder/getFullFolderContent.js';
import {diffNodeFiles} from '../../node/diffNodeFiles.js';
import {getNodeDirContent} from '../../node/getNodeDirContent.js';
import {stringifyFimidaraFilename} from '../../path/index.js';
import {getFimidara} from '../fimidara.js';
import {IFimidaraCmdOpts} from '../types.js';
import {copyToFimidaraFile, copyToLocalFile} from './copyFile.js';
import {IFimidaraSyncRuntimeOpts, kFimidaraSyncDirection} from './types.js';

export async function copyFolderFiles(
  fimidarapath: string,
  localpath: string,
  opts: IFimidaraCmdOpts &
    Pick<
      IFimidaraSyncRuntimeOpts,
      'direction' | 'matchTree' | 'clientMultipartIdPrefix'
    >,
  dirContent: Awaited<ReturnType<typeof getNodeDirContent>>,
  pageSize = 20
) {
  const {files} = await getFullFolderContent(getFimidara(opts), {
    folderpath: fimidarapath,
    contentType: 'file',
  });

  const {
    newExternalFileList,
    newFimidaraFileList,
    updatedExternalFileList,
    updatedFimidaraFileList,
  } = await diffNodeFiles({
    ...dirContent,
    fimidaraFiles: files,
    folderpath: localpath,
  });

  if (
    opts.direction === kFimidaraSyncDirection.up ||
    opts.direction === kFimidaraSyncDirection.both
  ) {
    const upEFList = newExternalFileList.concat(updatedExternalFileList);

    for (const chunkEF of chunk(upEFList, pageSize)) {
      await Promise.all(
        chunkEF.map(async ef => {
          const stats = dirContent.fileStatsRecord[ef.name];
          const efpath = path.join(localpath, ef.name);
          const ffpath = path.posix.join(fimidarapath, ef.name);
          await copyToFimidaraFile(ffpath, efpath, stats, opts);
        })
      );
    }

    if (
      opts.direction === kFimidaraSyncDirection.up &&
      opts.matchTree &&
      newFimidaraFileList.length
    ) {
      for (const chunkFF of chunk(newFimidaraFileList)) {
        await Promise.all(
          chunkFF.map(async ff => {
            const fname = stringifyFimidaraFilename(ff);
            const ffpath = path.posix.join(fimidarapath, fname);

            if (!opts.silent) {
              console.log(`rm up "${ffpath}"`);
            }

            await getFimidara(opts).files.deleteFile({
              filepath: ffpath,
            });
          })
        );
      }
    }
  }

  if (
    opts.direction === kFimidaraSyncDirection.down ||
    opts.direction === kFimidaraSyncDirection.both
  ) {
    const upFFList = newFimidaraFileList.concat(updatedFimidaraFileList);
    for (const chunkFF of chunk(upFFList)) {
      await Promise.all(
        chunkFF.map(async ff => {
          const filename = stringifyFimidaraFilename(ff);
          const efpath = path.join(localpath, filename);
          const ffpath = path.posix.join(fimidarapath, filename);
          await copyToLocalFile(ffpath, efpath, opts);
        })
      );
    }

    if (
      opts.direction === kFimidaraSyncDirection.down &&
      opts.matchTree &&
      newExternalFileList.length
    ) {
      for (const chunkEF of chunk(newExternalFileList)) {
        await Promise.all(
          chunkEF.map(async ef => {
            const efpath = path.join(localpath, ef.name);

            if (!opts.silent) {
              console.log(`rm down "${efpath}"`);
            }

            await rm(efpath);
          })
        );
      }
    }
  }

  return dirContent;
}
