import {Folder} from '../../../definitions/folder.js';
import {convertToArray, pathJoin, pathSplit} from '../../../utils/fns.js';
import {indexArray} from '../../../utils/indexArray.js';
import {FolderQuery} from '../../contexts/data/types.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../contexts/semantic/types.js';
import {FolderQueries} from '../queries.js';
import {FolderpathInfo, getFolderpathInfo} from '../utils.js';
import {NewFolderInput} from './types.js';

export async function getExistingFoldersAndArtifacts(
  workspaceId: string,
  input: NewFolderInput | NewFolderInput[],
  opts?: SemanticProviderMutationParams
) {
  const inputList = convertToArray(input);
  const pathinfoList: FolderpathInfo[] = inputList.map(nextInput =>
    getFolderpathInfo(nextInput.folderpath, {
      containsRootname: true,
      allowRootFolder: false,
    })
  );

  // Make a set of individual folders, so "/parent/folder" will become
  // "/parent", and "/parent/folder". This is useful for finding the closest
  // existing folder, and using a set avoids repetitions
  const namepathSet = pathinfoList.reduce((acc, pathinfo) => {
    pathinfo.namepath.forEach((name, index) => {
      acc.add(pathJoin(pathinfo.namepath.slice(0, index + 1)));
    });
    return acc;
  }, new Set<string>());
  const namepathList: Array<string[]> = [];
  namepathSet.forEach(namepath => {
    namepathList.push(pathSplit(namepath));
  });

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
    for (let i = namepath.length; i >= 0; i--) {
      const partNamepath = namepath.slice(0, i);
      const key = pathJoin(partNamepath).toLowerCase();
      const folder = foldersByNamepath[key];

      if (folder) {
        return folder;
      }
    }

    return null;
  }

  return {
    namepathList,
    pathinfoList,
    existingFolders,
    foldersByNamepath,
    getSelfOrClosestParent,
  };
}
