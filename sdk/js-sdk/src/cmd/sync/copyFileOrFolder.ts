import {stat} from 'fs/promises';
import {isUndefined} from 'lodash-es';
import {checkFimidaraType} from './checkType.js';
import {copyFile} from './copyFile.js';
import {copyFolder} from './copyFolder.js';
import {IFimidaraSyncRuntimeOpts, kFileEntryType} from './types.js';

export async function copyFileOrFolder(opts: IFimidaraSyncRuntimeOpts) {
  const {fimidarapath, localpath} = opts;
  let type = (await checkFimidaraType(fimidarapath, opts))?.type;

  if (isUndefined(type)) {
    try {
      const s = await stat(localpath);

      if (s.isFile()) {
        type = kFileEntryType.file;
      } else if (s.isDirectory()) {
        type = kFileEntryType.folder;
      }
    } catch {
      // do nothing
    }
  }

  if (type === kFileEntryType.file) {
    await copyFile(fimidarapath, localpath, opts);
  } else if (type === kFileEntryType.folder) {
    const filePageSize = 20;
    await copyFolder(fimidarapath, localpath, opts, filePageSize);
  } else {
    console.log('could not resolve fimidara or local path type');
  }
}
