import {FolderQuery} from '../../../contexts/data/types.js';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {Folder} from '../../../definitions/folder.js';
import {pathJoin} from '../../../utils/fns.js';
import {indexArray} from '../../../utils/indexArray.js';
import {FolderQueries} from '../queries.js';
import {prepareFolderInputList} from './prepareFolderInputList.js';

export async function getExistingFoldersAndArtifacts(
  workspaceId: string,
  {namepathList}: ReturnType<typeof prepareFolderInputList>,
  opts?: SemanticProviderMutationParams
) {
  let existingFolders: Folder[] = [];

  if (namepathList.length) {
    existingFolders = await kIjxSemantic.folder().getManyByQuery(
      {
        $or: namepathList.map(
          (namepath): FolderQuery =>
            FolderQueries.getByNamepath({namepath, workspaceId})
        ),
      },
      opts
    );
  }

  const foldersByNamepath = indexArray(existingFolders, {
    indexer: folder => pathJoin(folder.namepath).toLowerCase(),
  });

  function getSelfOrClosestParent(namepath: string[]) {
    // Attempt to retrieve a folder that matches namepath or the closest
    // existing parent
    for (let i = namepath.length; i > 0; i--) {
      const partNamepath = namepath.slice(0, i);
      const key = pathJoin(partNamepath).toLowerCase();
      const folder = foldersByNamepath[key];

      if (folder) {
        return folder;
      }
    }

    return null;
  }

  function addFolder(folder: Folder) {
    const key = pathJoin(folder.namepath).toLowerCase();
    foldersByNamepath[key] = folder;
  }

  function getFolder(folderpath: string) {
    return foldersByNamepath[folderpath.toLowerCase()];
  }

  return {
    getSelfOrClosestParent,
    addFolder,
    getFolder,
  };
}
