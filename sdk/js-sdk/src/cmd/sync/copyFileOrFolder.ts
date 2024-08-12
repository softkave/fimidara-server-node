import {checkType} from './checkType.js';
import {copyToLocalFile} from './copyFile.js';
import {copyFolder} from './copyFolder.js';
import {IFimidaraSyncOpts, kFileEntryType} from './types.js';

export async function copyFileOrFolder(opts: IFimidaraSyncOpts) {
  const {fimidarapath, localpath} = opts;
  const type = (await checkType(fimidarapath, opts))?.type;

  if (type === kFileEntryType.file) {
    await copyToLocalFile(fimidarapath, localpath, opts);
  } else if (type === kFileEntryType.folder) {
    const filePageSize = 20;
    await copyFolder(fimidarapath, localpath, opts, filePageSize);
  }
}
