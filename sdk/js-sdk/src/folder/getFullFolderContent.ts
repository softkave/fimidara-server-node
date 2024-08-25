import type {FimidaraEndpoints, FoldersEndpoints} from '../publicEndpoints.js';
import type {File, Folder} from '../publicTypes.js';

export async function getFullFolderContent(
  fimidara: InstanceType<typeof FimidaraEndpoints>,
  listParams: Parameters<
    InstanceType<typeof FoldersEndpoints>['listFolderContent']
  >[0]
) {
  let files: File[] = [];
  let folders: Folder[] = [];
  let pageFiles: File[] | undefined;
  let pageFolders: Folder[] | undefined;
  let page = 0;

  do {
    const response = await fimidara.folders.listFolderContent({
      ...listParams,
      body: {...listParams?.body, page},
    });

    pageFiles = response.body.files;
    pageFolders = response.body.folders;
    files = files.concat(pageFiles);
    folders = folders.concat(pageFolders);
    page++;
  } while (pageFiles?.length || pageFolders?.length);

  return {files, folders};
}
