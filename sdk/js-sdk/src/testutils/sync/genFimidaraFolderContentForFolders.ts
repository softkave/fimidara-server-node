import path from 'path-browserify';
import {genFimidaraFiles, genFimidaraFolders} from './syncUtils.js';

export async function genFimidaraFolderContentForFolders(
  fimidarapath: string,
  foldernames: string[],
  count: number
) {
  return await Promise.all(
    foldernames.map(async fName => {
      const ffp = path.posix.join(fimidarapath, fName);
      const [files, folders] = await Promise.all([
        genFimidaraFiles(ffp, count),
        genFimidaraFolders(ffp, count),
      ]);
      return {
        files,
        folders,
        parentpath: fimidarapath,
        foldername: fName,
      };
    })
  );
}
