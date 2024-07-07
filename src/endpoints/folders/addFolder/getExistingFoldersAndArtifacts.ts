import {Folder} from '../../../definitions/folder.js';
import {convertToArray, pathJoin, pathSplit} from '../../../utils/fns.js';
import {indexArray} from '../../../utils/indexArray.js';
import {FolderQuery} from '../../contexts/data/types.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../contexts/semantic/types.js';
import {FolderQueries} from '../queries.js';
import {FolderpathInfo, getFolderpathInfo} from '../utils.js';
import {NewFolderInput} from './types.js';

export function folderInputListToSet(input: NewFolderInput | NewFolderInput[]) {
  const inputList = convertToArray(input);

  // Make a set of individual folders, so "/parent/folder" will become
  // "/parent", and "/parent/folder". This is useful for finding the closest
  // existing folder, and using a set avoids repetitions
  const namepathSet = new Set<string>();
  const pathinfoWithRootnameMap: Record<string, FolderpathInfo> = {};
  const pathinfoList: FolderpathInfo[] = inputList.map(nextInput => {
    const pathinfo = getFolderpathInfo(nextInput.folderpath, {
      containsRootname: true,
      allowRootFolder: false,
    });

    pathinfo.namepath.forEach((name, index) => {
      namepathSet.add(pathJoin(pathinfo.namepath.slice(0, index + 1)));
    });

    pathinfoWithRootnameMap[nextInput.folderpath] = pathinfo;
    return pathinfo;
  });

  const namepathList: Array<string[]> = [];
  namepathSet.forEach(namepath => {
    namepathList.push(pathSplit(namepath));
  });

  return {
    pathinfoWithRootnameMap,
    namepathList,
    pathinfoList,
  };
}

export async function getExistingFoldersAndArtifacts(
  workspaceId: string,
  {namepathList, pathinfoList}: ReturnType<typeof folderInputListToSet>,
  opts?: SemanticProviderMutationParams
) {
  let existingFolders: Folder[] = [];

  if (namepathList.length) {
    existingFolders = await kSemanticModels.folder().getManyByQuery(
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
    existingFolders,
    foldersByNamepath,
    namepathList,
    pathinfoList,
    addFolder,
    getFolder,
  };
}
