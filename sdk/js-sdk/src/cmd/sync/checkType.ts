import {File as FimidaraFile, Folder} from '../../endpoints/publicTypes.js';
import {getFimidara} from '../fimidara.js';
import {IFimidaraCmdOpts} from '../types.js';
import {kFileEntryType} from './types.js';

async function getFile(fimidarapath: string, opts: IFimidaraCmdOpts) {
  try {
    const body = await getFimidara(opts).files.getFileDetails({
      filepath: fimidarapath,
    });
    return body.file;
  } catch (error: unknown) {
    return undefined;
  }
}

async function getFolder(fimidarapath: string, opts: IFimidaraCmdOpts) {
  try {
    const body = await getFimidara(opts).folders.getFolder({
      folderpath: fimidarapath,
    });
    return body.folder;
  } catch (error: unknown) {
    return undefined;
  }
}

export async function checkFimidaraType(
  fimidarapath: string,
  opts: IFimidaraCmdOpts
): Promise<
  | {type: typeof kFileEntryType.file; file: FimidaraFile}
  | {type: typeof kFileEntryType.folder; folder: Folder}
  | undefined
> {
  const [file, folder] = await Promise.all([
    getFile(fimidarapath, opts),
    getFolder(fimidarapath, opts),
  ]);

  if (file) {
    return {file, type: kFileEntryType.file};
  } else if (folder) {
    return {folder, type: kFileEntryType.folder};
  }

  return undefined;
}
