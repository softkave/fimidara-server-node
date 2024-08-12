import path from 'path';
import {getNodeDirContent} from '../../node/getNodeDirContent.js';
import {Folder} from '../../publicTypes.js';
import {stringifyFimidaraFolderpath} from '../../utils.js';
import {getFimidara} from '../fimidara.js';
import {copyFolderFiles} from './copyFolderFiles.js';
import {IFimidaraSyncOpts, kFimidaraSyncDirection} from './types.js';

async function getFimidaraFolderFolders(
  fimidarapath: string,
  opts: IFimidaraSyncOpts,
  page: number,
  folderPageSize: number
) {
  try {
    const {body} = await getFimidara(opts).folders.listFolderContent({
      body: {
        page,
        pageSize: folderPageSize,
        folderpath: fimidarapath,
        contentType: 'folder',
      },
    });

    return body.folders;
  } finally {
    return [];
  }
}

async function copyFimidaraFolderFolders(
  fimidarapath: string,
  localpath: string,
  opts: IFimidaraSyncOpts
) {
  const folderPageSize = 10;
  const filePageSize = 10;

  for (let page = 0, folders: Folder[] = []; folders.length; page++) {
    folders = await getFimidaraFolderFolders(
      fimidarapath,
      opts,
      page,
      folderPageSize
    );

    for (const folder of folders) {
      await copyFolder(
        stringifyFimidaraFolderpath(folder),
        path.join(localpath, folder.name),
        opts,
        filePageSize
      );
    }
  }
}

export async function copyFolder(
  fimidarapath: string,
  localpath: string,
  opts: IFimidaraSyncOpts,
  filePageSize: number
) {
  const dirContent = await getNodeDirContent({folderpath: localpath});
  const {folderStatsRecord} = await copyFolderFiles(
    fimidarapath,
    localpath,
    opts,
    dirContent,
    filePageSize
  );

  if (opts.recursive) {
    if (
      opts.direction === kFimidaraSyncDirection.up ||
      opts.direction === kFimidaraSyncDirection.both
    ) {
      for (const k in folderStatsRecord) {
        const lfp = path.join(localpath, k);
        const ffp = path.posix.join(fimidarapath, k);
        await copyFolder(ffp, lfp, opts, filePageSize);
      }
    }

    if (
      opts.direction === kFimidaraSyncDirection.down ||
      opts.direction === kFimidaraSyncDirection.both
    ) {
      await copyFimidaraFolderFolders(fimidarapath, localpath, opts);
    }
  }
}
