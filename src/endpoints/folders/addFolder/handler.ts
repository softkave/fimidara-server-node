import {last} from 'lodash';
import {container} from 'tsyringe';
import {FileBackendMount} from '../../../definitions/fileBackend';
import {Folder} from '../../../definitions/folder';
import {PERMISSION_AGENT_TYPES, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {validate} from '../../../utils/validate';
import {
  checkAuthorizationWithAgent,
  getFilePermissionContainers,
  getWorkspacePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {FolderQuery} from '../../contexts/data/types';
import {kSemanticModels} from '../../contexts/injectables';
import {kInjectionKeys} from '../../contexts/injection';
import {SemanticFolderProvider} from '../../contexts/semantic/folder/types';
import {SemanticProviderMutationRunOptions} from '../../contexts/semantic/types';
import {getFileBackendForFile} from '../../fileBackends/mountUtils';
import {assertWorkspace} from '../../workspaces/utils';
import {kFolderConstants} from '../constants';
import {FolderExistsError} from '../errors';
import {createNewFolder, folderExtractor, getFolderpathInfo} from '../utils';
import {AddFolderEndpoint, NewFolderInput} from './types';
import {addFolderJoiSchema} from './validation';

export async function createFolderListWithTransaction(
  agent: SessionAgent,
  workspace: Workspace,
  mounts: Array<Pick<FileBackendMount, 'resourceId'>>,
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
    const folder: Folder = createNewFolder(
      agent,
      workspace.resourceId,
      /** pathinfo */ {name},
      previousFolder,
      mounts,
      /** input */ {description: isMainFolder ? input.description : undefined}
    );

    previousFolder = folder;
    newFolders.push(folder);
  }

  if (!UNSAFE_skipAuthCheck && newFolders.length) {
    const cExistingFolder = closestExistingFolder as Folder | null;

    // It's okay to check permission after, cause if it fails, it fails the
    // transaction, which reverts the changes.
    await checkAuthorizationWithAgent({
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
    await kSemanticModels.folder().insertItem(newFolders, opts);
  }

  if (!previousFolder) {
    previousFolder = last(newFolders) ?? null;
  }

  return previousFolder;
}

const addFolder: AddFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, addFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  const pathinfo = getFolderpathInfo(data.folder.folderpath);
  const workspace = await context.semantic.workspace.getByRootname(pathinfo.rootname);
  assertWorkspace(workspace);

  const {mount, provider: backend} = await getFileBackendForFile({
    workspaceId: workspace.resourceId,
    namepath: pathinfo.namepath,
  });

  const folder = await kSemanticModels.utils().withTxn(async opts => {
    const [folder] = await Promise.all([
      createFolderListWithTransaction(
        agent,
        workspace,
        [mount],
        data.folder,
        /** skip auth check */ false,
        /** throw if folder exists */ true,
        opts
      ),
      backend.addFolder({
        mount,
        workspaceId: workspace.resourceId,
        folderpath: pathinfo.namepath.join(kFolderConstants.separator),
      }),
    ]);

    return folder;
  });

  appAssert(folder, new ServerError('Error creating folder.'));
  return {folder: folderExtractor(folder)};
};

export default addFolder;
