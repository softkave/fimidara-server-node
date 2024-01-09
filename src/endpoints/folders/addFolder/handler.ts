import {last} from 'lodash';
import {Folder} from '../../../definitions/folder';
import {kPermissionAgentTypes, Resource, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {toArray} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {validate} from '../../../utils/validate';
import {
  checkAuthorizationWithAgent,
  getResourcePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {FolderQuery} from '../../contexts/data/types';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {SemanticProviderMutationRunOptions} from '../../contexts/semantic/types';
import {assertWorkspace} from '../../workspaces/utils';
import {kFolderConstants} from '../constants';
import {FolderExistsError} from '../errors';
import {FolderQueries} from '../queries';
import {
  createNewFolder,
  folderExtractor,
  FolderpathInfo,
  getFolderpathInfo,
} from '../utils';
import {AddFolderEndpoint, NewFolderInput} from './types';
import {addFolderJoiSchema} from './validation';

export async function createFolderListWithTransaction(
  agent: SessionAgent,
  workspace: Workspace,
  input: NewFolderInput | NewFolderInput[],
  UNSAFE_skipAuthCheck = false,
  throwOnFolderExists = true,
  opts: SemanticProviderMutationRunOptions
) {
  const folderModel = kSemanticModels.folder();

  const inputList = toArray(input);
  const pathinfoList: FolderpathInfo[] = inputList.map(nextInput =>
    getFolderpathInfo(nextInput.folderpath)
  );

  // Make a set of individual folders, so "/parent/folder" will become
  // "/parent", and "/parent/folder". This is useful for finding the closest
  // existing folder, and using a set avoids repetitions
  const namepathSet = pathinfoList.reduce((acc, pathinfo) => {
    pathinfo.namepath.forEach((name, index) => {
      acc.add(pathinfo.namepath.slice(0, index + 1).join(kFolderConstants.separator));
    });
    return acc;
  }, new Set<string>());
  const namepathList: Array<string[]> = [];
  namepathSet.forEach(namepath => {
    namepathList.push(namepath.split(kFolderConstants.separator));
  });

  const existingFolders = await folderModel.getManyByQueryList(
    namepathList.map(
      (namepath): FolderQuery =>
        FolderQueries.getByNamepath({
          namepath,
          workspaceId: workspace.resourceId,
        })
    ),
    opts
  );
  const foldersByNamepath = indexArray(existingFolders, {
    indexer: folder => folder.namepath.join(kFolderConstants.separator),
  });

  function getSelfOrParent(namepath: string[]) {
    // Attempt to retrieve a folder that matches namepath or the closest
    // existing parent
    for (let i = namepath.length; i >= 0; i--) {
      const partNamepath = namepath.slice(0, i);
      const key = partNamepath.join(kFolderConstants.separator);
      const folder = foldersByNamepath[key];

      if (folder) {
        return folder;
      }
    }

    return null;
  }

  const newFolders: Folder[] = [];
  // Use a set to avoid duplicating auth checks to the same target
  const checkAuthTargets: Set<Resource> = new Set();

  pathinfoList.forEach((pathinfo, pathinfoIndex) => {
    const inputForIndex = inputList[pathinfoIndex];
    let prevFolder = getSelfOrParent(pathinfo.namepath);
    const existingDepth = prevFolder?.namepath.length ?? 0;

    // If existingDepth matches namepath length, then the folder exists
    if (throwOnFolderExists && existingDepth === pathinfo.namepath.length) {
      throw new FolderExistsError();
    }

    // Create folders for folders not found starting from the closest existing
    // parent represented by existingDepth. If existingDepth ===
    // namepath.length, then folder exists, and no new folder is created
    pathinfo.namepath.slice(existingDepth).forEach((name, nameIndex) => {
      const actualNameIndex = nameIndex + existingDepth;
      const folder: Folder = createNewFolder(
        agent,
        workspace.resourceId,
        /** pathinfo */ {name},
        prevFolder,
        /** input */ {
          // description belongs to only the actual folder from input
          description:
            actualNameIndex === pathinfo.namepath.length - 1
              ? inputForIndex.description
              : undefined,
        }
      );

      if (
        !UNSAFE_skipAuthCheck &&
        // If there is no parent, seeing actualNameIndex will only ever be 0 if
        // there is no prevFolder, we need to do auth check using workspace,
        // seeing that's the closest permission container
        actualNameIndex === 0
      ) {
        checkAuthTargets.add(workspace);
      } else if (
        !UNSAFE_skipAuthCheck &&
        // If we have a parent, and this folder is the next one right after, use
        // the parent, represented by prevFolder for auth check, seeing it's the
        // closest permission container.
        existingDepth &&
        actualNameIndex === existingDepth + 1
      ) {
        appAssert(prevFolder);
        checkAuthTargets.add(prevFolder);
      }

      // Set prevFolder to current folder, so the next folder can use it as
      // parent, and set it also in foldersByNamepath so other inputs can use it
      // (not sure how much useful the last part is, but just in case)
      foldersByNamepath[folder.namepath.join(kFolderConstants.separator)] = prevFolder =
        folder;
      newFolders.push(folder);
    });
  });

  if (newFolders.length) {
    const checkAuthPromises: Array<Promise<unknown>> = [];
    const saveFilesPromise = kSemanticModels.folder().insertItem(newFolders, opts);

    // No need to check auth if there are no new folders, so only check if we
    // have newFolders
    checkAuthTargets.forEach(target => {
      checkAuthPromises.push(
        checkAuthorizationWithAgent({
          agent,
          workspace,
          opts,
          workspaceId: workspace.resourceId,
          target: {
            action: 'addFolder',
            targetId: getResourcePermissionContainers(
              workspace.resourceId,
              target,
              /** include target ID in containers */ true
            ),
          },
        })
      );
    });

    await Promise.all([Promise.all(checkAuthPromises), saveFilesPromise]);
  }

  return {newFolders, existingFolders};
}

const addFolder: AddFolderEndpoint = async instData => {
  const data = validate(instData.data, addFolderJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, kPermissionAgentTypes);
  const pathinfo = getFolderpathInfo(data.folder.folderpath);
  const workspace = await kSemanticModels.workspace().getByRootname(pathinfo.rootname);
  assertWorkspace(workspace);

  const {newFolders} = await kSemanticModels.utils().withTxn(async opts => {
    return await createFolderListWithTransaction(
      agent,
      workspace,
      data.folder,
      /** skip auth check */ false,
      /** throw if folder exists */ true,
      opts
    );
  });

  // The last folder will be the folder represented by our input, seeing it
  // creates parent folders in order
  const folder = last(newFolders);
  appAssert(folder, new ServerError('Error creating folder.'));

  return {folder: folderExtractor(folder)};
};

export default addFolder;
