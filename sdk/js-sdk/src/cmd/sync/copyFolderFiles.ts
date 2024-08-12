import {rm} from 'fs/promises';
import path from 'path';
import {getNodeDirContent} from '../../node/getNodeDirContent.js';
import {File as FimidaraFile} from '../../publicTypes.js';
import {
  stringifyFimidaraFilename,
  stringifyFimidaraFilepath,
} from '../../utils.js';
import {getFimidara} from '../fimidara.js';
import {copyToFimidaraFile, copyToLocalFile} from './copyFile.js';
import {syncDiffFolderFiles} from './syncDiffFolderFiles.js';
import {IFimidaraSyncOpts, kFimidaraSyncDirection} from './types.js';

export async function copyFolderFiles(
  fimidarapath: string,
  localpath: string,
  opts: Pick<IFimidaraSyncOpts, 'authToken' | 'direction' | 'matchTree'>,
  dirContent: Awaited<ReturnType<typeof getNodeDirContent>>,
  pageSize = 20
) {
  for (let page = 0, files: FimidaraFile[] = []; files.length; page++) {
    const response = await syncDiffFolderFiles(
      fimidarapath,
      localpath,
      opts,
      dirContent,
      page,
      pageSize
    );
    const {
      newExternalFileList,
      newFimidaraFileList,
      updatedExternalFileList,
      updatedFimidaraFileList,
    } = response;
    files = response.files;

    if (
      opts.direction === kFimidaraSyncDirection.up ||
      opts.direction === kFimidaraSyncDirection.both
    ) {
      const upEFList = newExternalFileList.concat(updatedExternalFileList);
      await Promise.all(
        upEFList.map(async ef => {
          const stats = dirContent.fileStatsRecord[ef.name];
          await copyToFimidaraFile(
            path.join(localpath, ef.name),
            path.posix.join(fimidarapath, ef.name),
            stats,
            opts
          );
        })
      );

      if (opts.direction === kFimidaraSyncDirection.up && opts.matchTree) {
        await Promise.all(
          newFimidaraFileList.map(ff =>
            getFimidara(opts).files.deleteFile({
              body: {filepath: stringifyFimidaraFilepath(ff)},
            })
          )
        );
      }
    }

    if (
      opts.direction === kFimidaraSyncDirection.down ||
      opts.direction === kFimidaraSyncDirection.both
    ) {
      const upFFList = newFimidaraFileList.concat(updatedFimidaraFileList);
      await Promise.all(
        upFFList.map(ff =>
          copyToLocalFile(
            stringifyFimidaraFilepath(ff),
            path.join(localpath, stringifyFimidaraFilename(ff)),
            opts
          )
        )
      );
    }

    if (opts.direction === kFimidaraSyncDirection.down && opts.matchTree) {
      await Promise.all(
        newExternalFileList.map(ef => rm(path.join(localpath, ef.name)))
      );
    }
  }

  return dirContent;
}
