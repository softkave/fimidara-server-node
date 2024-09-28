import path from 'path-browserify';
import {genLocalFiles, genLocalFolders} from './syncUtils.js';

export async function genLocalFolderContentForFolders(
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
