import {IFolder} from '../../../definitions/folder';
import {
  AppResourceType,
  ISessionAgent,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {validate} from '../../../utils/validate';
import {populateResourceListWithAssignedTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import {fileListExtractor} from '../../files/utils';
import {IPaginationQuery} from '../../types';
import {applyDefaultEndpointPaginationOptions, getEndpointPageFromInput} from '../../utils';
import {folderListExtractor} from '../utils';
import {ListFolderContentEndpoint} from './types';
import {getWorkspaceAndParentFolder, listFolderContentQuery} from './utils';
import {listFolderContentJoiSchema} from './validation';

const listFolderContent: ListFolderContentEndpoint = async (context, instData) => {
  const data = validate(instData.data, listFolderContentJoiSchema);
  const agent = await context.session.getAgent(context, instData, publicPermissibleEndpointAgents);
  const {workspace, parentFolder} = await getWorkspaceAndParentFolder(context, agent, data);
  applyDefaultEndpointPaginationOptions(data);
  const contentType = data.contentType ?? [AppResourceType.File, AppResourceType.Folder];
  let [fetchedFolders, fetchedFiles] = await Promise.all([
    contentType.includes(AppResourceType.Folder)
      ? fetchFolders(context, agent, workspace, parentFolder, data)
      : [],
    contentType.includes(AppResourceType.File)
      ? fetchFiles(context, agent, workspace, parentFolder, data)
      : [],
  ]);
  fetchedFolders = await populateResourceListWithAssignedTags(
    context,
    workspace.resourceId,
    fetchedFolders,
    AppResourceType.Folder
  );
  fetchedFiles = await populateResourceListWithAssignedTags(
    context,
    workspace.resourceId,
    fetchedFiles,
    AppResourceType.File
  );

  return {
    folders: folderListExtractor(fetchedFolders),
    files: fileListExtractor(fetchedFiles),
    page: getEndpointPageFromInput(data),
  };
};

async function fetchFolders(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  parentFolder: IFolder | null,
  pagination: IPaginationQuery
) {
  const q = await listFolderContentQuery(
    context,
    agent,
    workspace,
    AppResourceType.Folder,
    parentFolder
  );
  return await context.data.folder.getManyByQuery(q, pagination);
}

async function fetchFiles(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  parentFolder: IFolder | null,
  pagination: IPaginationQuery
) {
  const q = await listFolderContentQuery(
    context,
    agent,
    workspace,
    AppResourceType.File,
    parentFolder
  );
  return await context.data.file.getManyByQuery(q, pagination);
}

export default listFolderContent;
