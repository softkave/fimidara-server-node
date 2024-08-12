import {File as FimidaraFile, Folder} from '../../publicTypes.js';
import {getFimidara} from '../fimidara.js';
import {IFimidaraSyncOpts, kFileEntryType} from './types.js';

async function getFile(
  fimidarapath: string,
  opts: Pick<IFimidaraSyncOpts, 'authToken'>
) {
  try {
    const {body} = await getFimidara(opts).files.getFileDetails({
      body: {filepath: fimidarapath},
    });
    return body.file;
  } catch (error: unknown) {
    return undefined;
  }
}

async function getFolder(
  fimidarapath: string,
  opts: Pick<IFimidaraSyncOpts, 'authToken'>
) {
  try {
    const {body} = await getFimidara(opts).folders.getFolder({
      body: {folderpath: fimidarapath},
    });
    return body.folder;
  } catch (error: unknown) {
    return undefined;
  }
}

export async function checkType(
  fimidarapath: string,
  opts: Pick<IFimidaraSyncOpts, 'authToken'>
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
