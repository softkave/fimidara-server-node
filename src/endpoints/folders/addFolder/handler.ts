import {compact, last} from 'lodash';
import {Folder} from '../../../definitions/folder';
import {
  AppActionType,
  AppResourceType,
  PERMISSION_AGENT_TYPES,
  SessionAgent,
} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {getNewIdForResource, newWorkspaceResource} from '../../../utils/resource';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  getFilePermissionContainers,
  getWorkspacePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {BaseContextType} from '../../contexts/types';
import {assertWorkspace} from '../../workspaces/utils';
import {FolderExistsError} from '../errors';
import {folderExtractor, splitPathWithDetails} from '../utils';
import {AddFolderEndpoint, NewFolderInput} from './types';
import {addFolderJoiSchema} from './validation';

export async function createFolderList(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  input: NewFolderInput,
  opts: SemanticDataAccessProviderMutationRunOptions,
  UNSAFE_skipAuthCheck = false,
  throwOnFolderExists = true
) {
  const pathWithDetails = splitPathWithDetails(input.folderpath);
  let closestExistingFolder: Folder | null = null;
  let previousFolder: Folder | null = null;

  const newFolders = await context.semantic.folder.insertWithQuery(
    () => {
      const namePathList = pathWithDetails.itemSplitPath.map((p, i) =>
        pathWithDetails.itemSplitPath.slice(0, i + 1)
      );
      return {
        workspaceId: workspace.resourceId,
        namePath: {$lowercaseIn: namePathList},
      };
    },

    existingFolders => {
      existingFolders = compact(existingFolders);

      if (existingFolders.length >= pathWithDetails.itemSplitPath.length && throwOnFolderExists) {
        throw new FolderExistsError();
      }

      closestExistingFolder = last(existingFolders) ?? null;
      previousFolder = closestExistingFolder ?? null;
      const newFolders: Folder[] = [];

      for (let i = existingFolders.length; i < pathWithDetails.itemSplitPath.length; i++) {
        if (existingFolders[i]) {
          previousFolder = existingFolders[i];
          continue;
        }

        // The main folder we want to create
        const isMainFolder = i === pathWithDetails.itemSplitPath.length - 1;
        const name = pathWithDetails.itemSplitPath[i];
        const folderId = getNewIdForResource(AppResourceType.Folder);
        const folder: Folder = newWorkspaceResource(
          agent,
          AppResourceType.Folder,
          workspace.resourceId,
          {
            name,
            workspaceId: workspace.resourceId,
            resourceId: folderId,
            parentId: previousFolder?.resourceId ?? null,
            idPath: previousFolder ? previousFolder.idPath.concat(folderId) : [folderId],
            namePath: previousFolder ? previousFolder.namePath.concat(name) : [name],
            description: isMainFolder ? input.description : undefined,
          }
        );

        previousFolder = folder;
        newFolders.push(folder);
      }

      return newFolders;
    },
    opts
  );

  if (!UNSAFE_skipAuthCheck && closestExistingFolder && newFolders.length) {
    await checkAuthorization({
      context,
      agent,
      workspace,
      workspaceId: workspace.resourceId,
      containerId: closestExistingFolder
        ? getFilePermissionContainers(workspace.resourceId, closestExistingFolder)
        : getWorkspacePermissionContainers(workspace.resourceId),
      targets: {targetType: AppResourceType.Folder},
      action: AppActionType.Create,
    });
  }

  if (!previousFolder) {
    previousFolder = last(newFolders) ?? null;
  }

  return previousFolder;
}

// TODO: Currently doesn't throw error if the folder already exists, do we want to change that behavior?
const addFolder: AddFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, addFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  const pathWithDetails = splitPathWithDetails(data.folder.folderpath);
  const workspace = await context.semantic.workspace.getByRootname(
    pathWithDetails.workspaceRootname
  );
  assertWorkspace(workspace);

  let folder = await executeWithMutationRunOptions(context, async opts => {
    return createFolderList(context, agent, workspace, data.folder, opts);
  });

  appAssert(folder, new ServerError('Error creating folder.'));
  folder = await populateAssignedTags(context, folder.workspaceId, folder);
  return {folder: folderExtractor(folder)};
};

export default addFolder;
