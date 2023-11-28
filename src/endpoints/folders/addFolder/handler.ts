import {last} from 'lodash';
import {container} from 'tsyringe';
import {Folder} from '../../../definitions/folder';
import {
  AppResourceTypeMap,
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
  checkAuthorizationWithAgent,
  getFilePermissionContainers,
  getWorkspacePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {FolderQuery} from '../../contexts/data/types';
import {kInjectionKeys} from '../../contexts/injection';
import {SemanticFolderProvider} from '../../contexts/semantic/folder/types';
import {SemanticProviderMutationRunOptions} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';
import {assertWorkspace} from '../../workspaces/utils';
import {FolderExistsError} from '../errors';
import {folderExtractor, getFolderpathInfo} from '../utils';
import {AddFolderEndpoint, NewFolderInput} from './types';
import {addFolderJoiSchema} from './validation';

export async function createFolderListWithTransaction(
  agent: SessionAgent,
  workspace: Workspace,
  input: NewFolderInput,
  UNSAFE_skipAuthCheck = false,
  throwOnFolderExists = true,
  opts: SemanticProviderMutationRunOptions
) {
  const folderModel = container.resolve<SemanticFolderProvider>(
    kInjectionKeys.semantic.folder
  );

  const pathinfo = getFolderpathInfo(input.folderpath);
  let closestExistingFolder: Folder | null = null;
  let previousFolder: Folder | null = null;
  const folderQueries = pathinfo.namepath
    .map((p, i) => pathinfo.namepath.slice(0, i + 1))
    .map(
      (nextnamepath): FolderQuery => ({
        workspaceId: workspace.resourceId,
        namepath: {$all: nextnamepath, $size: nextnamepath.length},
      })
    );
  const existingFolders = await folderModel.getManyByQueryList(folderQueries, opts);
  existingFolders.sort((f1, f2) => f1.namepath.length - f2.namepath.length);

  if (existingFolders.length >= pathinfo.namepath.length && throwOnFolderExists) {
    throw new FolderExistsError();
  }

  closestExistingFolder = last(existingFolders) ?? null;
  previousFolder = closestExistingFolder ?? null;
  const newFolders: Folder[] = [];

  for (let i = existingFolders.length; i < pathinfo.namepath.length; i++) {
    if (existingFolders[i]) {
      previousFolder = existingFolders[i];
      continue;
    }

    // The main folder we want to create
    const isMainFolder = i === pathinfo.namepath.length - 1;
    const name = pathinfo.namepath[i];
    const folderId = getNewIdForResource(AppResourceTypeMap.Folder);
    const folder: Folder = newWorkspaceResource(
      agent,
      AppResourceTypeMap.Folder,
      workspace.resourceId,
      {
        name,
        workspaceId: workspace.resourceId,
        resourceId: folderId,
        parentId: previousFolder?.resourceId ?? null,
        idPath: previousFolder ? previousFolder.idPath.concat(folderId) : [folderId],
        namepath: previousFolder ? previousFolder.namepath.concat(name) : [name],
        description: isMainFolder ? input.description : undefined,
      }
    );

    previousFolder = folder;
    newFolders.push(folder);
  }

  if (!UNSAFE_skipAuthCheck && newFolders.length) {
    const cExistingFolder = closestExistingFolder as Folder | null;

    // It's okay to check permission after, cause if it fails, it fails the
    // transaction, which reverts the changes.
    await checkAuthorizationWithAgent({
      context,
      agent,
      workspace,
      opts,
      workspaceId: workspace.resourceId,
      target: {
        action: 'addFolder',
        targetId: cExistingFolder
          ? getFilePermissionContainers(workspace.resourceId, cExistingFolder, true)
          : getWorkspacePermissionContainers(workspace.resourceId),
      },
    });
  }

  if (newFolders.length) {
    await context.semantic.folder.insertItem(newFolders, opts);
  }

  if (!previousFolder) {
    previousFolder = last(newFolders) ?? null;
  }

  return previousFolder;
}

export async function createFolderList(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  input: NewFolderInput,
  UNSAFE_skipAuthCheck = false,
  throwOnFolderExists = true,
  opts?: SemanticProviderMutationRunOptions
) {
  return await context.semantic.utils.withTxn(
    context,
    async opts => {
      return await createFolderListWithTransaction(
        context,
        agent,
        workspace,
        input,
        UNSAFE_skipAuthCheck,
        throwOnFolderExists,
        opts
      );
    },
    opts
  );
}

// TODO: Currently doesn't throw error if the folder already exists, do we want to change that behavior?
const addFolder: AddFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, addFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  const pathWithDetails = getFolderpathInfo(data.folder.folderpath);
  const workspace = await context.semantic.workspace.getByRootname(
    pathWithDetails.rootname
  );
  assertWorkspace(workspace);
  let folder = await createFolderList(context, agent, workspace, data.folder);
  appAssert(folder, new ServerError('Error creating folder.'));
  folder = await populateAssignedTags(context, folder.workspaceId, folder);
  return {folder: folderExtractor(folder)};
};

export default addFolder;
