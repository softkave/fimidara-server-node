import path from 'path-browserify';
import {Folder} from '../../endpoints/publicTypes.js';
import {getNodeDirContent} from '../../node/getNodeDirContent.js';
import {getFimidara} from '../fimidara.js';
import {copyFolderFiles} from './copyFolderFiles.js';
import {
  IFimidaraSyncOpts,
  IFimidaraSyncRuntimeOpts,
  kFimidaraSyncDirection,
} from './types.js';

async function getFimidaraFolderFolders(
  fimidarapath: string,
  opts: IFimidaraSyncOpts,
  page: number,
  folderPageSize: number
) {
  try {
    const body = await getFimidara(opts).folders.listFolderContent({
      page,
      pageSize: folderPageSize,
      folderpath: fimidarapath,
      contentType: 'folder',
    });

    return body.folders;
  } catch {
    return [];
  }
}

async function copyFimidaraFolderFolders(
  fimidarapath: string,
  localpath: string,
  opts: IFimidaraSyncOpts &
    Pick<IFimidaraSyncRuntimeOpts, 'clientMultipartIdPrefix'>
) {
  const folderPageSize = 10;
  const filePageSize = 10;
  let page = 0,
    folders: Folder[] = [];

  do {
    folders = await getFimidaraFolderFolders(
      fimidarapath,
      opts,
      page,
      folderPageSize
    );

    for (const folder of folders) {
      const ffp = path.posix.join(fimidarapath, folder.name);
      const lfp = path.join(localpath, folder.name);
      await copyFolder(
        ffp,
        lfp,
        {...opts, direction: kFimidaraSyncDirection.down},
        filePageSize
      );
    }

    page++;
  } while (folders.length);
}

export async function copyFolder(
  fimidarapath: string,
  localpath: string,
  opts: IFimidaraSyncOpts &
    Pick<IFimidaraSyncRuntimeOpts, 'clientMultipartIdPrefix'>,
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
        await copyFolder(
          ffp,
          lfp,
          {...opts, direction: kFimidaraSyncDirection.up},
          filePageSize
        );
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
