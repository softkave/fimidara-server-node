import {randomUUID} from 'crypto';
import {flatten} from 'lodash-es';
import path from 'path-browserify';
import {stringifyFimidaraFolderpath} from '../../path/index.js';
import {fimidaraTestVars} from '../tests/file.js';
import {genFimidaraFolderContentForFolders} from './genFimidaraFolderContentForFolders.js';
import {genLocalFolderContentForFolders} from './genLocalFolderContentForFolders.js';
import {
  genFimidaraFiles,
  genFimidaraFolders,
  genLocalFiles,
  genLocalFolders,
} from './syncUtils.js';

export async function setupCopyFolder(testDir: string, paged?: boolean) {
  const foldername = randomUUID();
  const localpath = path.join(testDir, foldername);
  const fimidarapath = stringifyFimidaraFolderpath(
    {namepath: [foldername]},
    fimidaraTestVars.workspaceRootname
  );

  const count = paged ? 4 : 2;
  const pageSize = paged ? Math.ceil(count / 2) : count;
  const {text, filenames: fimidaraFilenames} = await genFimidaraFiles(
    fimidarapath,
    count
  );

  const {foldernames: fimidaraFoldernames} = await genFimidaraFolders(
    fimidarapath,
    count
  );

  // fimidara folder content depth 02
  const ff02List = await genFimidaraFolderContentForFolders(
    fimidarapath,
    fimidaraFoldernames,
    count
  );

  // fimidara folder content depth 03
  const ff03List = flatten(
    await Promise.all(
      ff02List.map(ff02 => {
        return genFimidaraFolderContentForFolders(
          path.posix.join(ff02.parentpath, ff02.foldername),
          ff02.folders.foldernames,
          count
        );
      })
    )
  );

  const {filenames: localFilenames} = await genLocalFiles(localpath, count);
  const {foldernames: localFoldernames} = await genLocalFolders(localpath);

  // local folder content depth 02
  const lf02List = await genLocalFolderContentForFolders(
    localpath,
    localFoldernames,
    count
  );

  // local folder content depth 03
  const lf03List = flatten(
    await Promise.all(
      lf02List.map(lf02 => {
        return genLocalFolderContentForFolders(
          path.join(lf02.parentpath, lf02.foldername),
          lf02.folders.foldernames,
          count
        );
      })
    )
  );

  return {
    fimidarapath,
    localpath,
    pageSize,
    fimidaraFilenames,
    localFilenames,
    ff02List,
    localFoldernames,
    text,
    fimidaraFoldernames,
    lf02List,
    ff03List,
    lf03List,
  };
}
