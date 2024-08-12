import {diffNodeFiles} from '../../node/diffNodeFiles.js';
import {getNodeDirContent} from '../../node/getNodeDirContent.js';
import {getFimidara} from '../fimidara.js';
import {IFimidaraSyncOpts} from './types.js';

export async function syncDiffFolderFiles(
  fimidarapath: string,
  localpath: string,
  opts: Pick<IFimidaraSyncOpts, 'authToken'>,
  dirContent: Awaited<ReturnType<typeof getNodeDirContent>>,
  page: number,
  pageSize: number
) {
  const {
    body: {files},
  } = await getFimidara(opts).folders.listFolderContent({
    body: {
      pageSize,
      page,
      folderpath: fimidarapath,
      contentType: 'file',
    },
  });

  const dResult = await diffNodeFiles({
    ...dirContent,
    fimidaraFiles: files,
    folderpath: localpath,
  });

  return {...dResult, files};
}
