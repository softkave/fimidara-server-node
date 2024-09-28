import {
  FimidaraEndpoints,
  FoldersEndpoints,
} from '../endpoints/publicEndpoints.js';
import {File, Folder} from '../endpoints/publicTypes.js';

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
      page,
      ...listParams,
    });

    pageFiles = response.files;
    pageFolders = response.folders;
    files = files.concat(pageFiles);
    folders = folders.concat(pageFolders);
    page++;
  } while (pageFiles?.length || pageFolders?.length);

  return {files, folders};
}
