import {Folder} from '../../../definitions/folder';
import {AppResourceType, PERMISSION_AGENT_TYPES, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {validate} from '../../../utils/validate';
import {populateResourceListWithAssignedTags} from '../../assignedItems/getAssignedItems';
import {BaseContextType} from '../../contexts/types';
import {fileListExtractor} from '../../files/utils';
import {PaginationQuery} from '../../types';
import {applyDefaultEndpointPaginationOptions, getEndpointPageFromInput} from '../../utils';
import {folderListExtractor} from '../utils';
import {ListFolderContentEndpoint} from './types';
import {getWorkspaceAndParentFolder, listFolderContentQuery} from './utils';
import {listFolderContentJoiSchema} from './validation';

const listFolderContent: ListFolderContentEndpoint = async (context, instData) => {
  const data = validate(instData.data, listFolderContentJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  const {workspace, parentFolder} = await getWorkspaceAndParentFolder(
    context,
    agent,
    data,

    //  Skip auth check seeing the calling agent doesn't need to have read
    //  permission to the folder, just to it's content, the same way public
    //  agents don't need the workspace to be public but just a file to be
    //  public.
    // TODO: Let me (@abayomi) know if there's an issue with this.
    /** skip auth check */ true
  );
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

  [fetchedFolders, fetchedFiles] = await Promise.all([
    populateResourceListWithAssignedTags(context, workspace.resourceId, fetchedFolders),
    populateResourceListWithAssignedTags(context, workspace.resourceId, fetchedFiles),
  ]);

  return {
    folders: folderListExtractor(fetchedFolders),
    files: fileListExtractor(fetchedFiles),
    page: getEndpointPageFromInput(data),
  };
};

async function fetchFolders(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  parentFolder: Folder | null,
  pagination: PaginationQuery
) {
  const query = await listFolderContentQuery(
    context,
    agent,
    workspace,
    AppResourceType.Folder,
    parentFolder
  );
  return await context.semantic.folder.getManyByWorkspaceParentAndIdList(query, pagination);
}

async function fetchFiles(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  parentFolder: Folder | null,
  pagination: PaginationQuery
) {
  const query = await listFolderContentQuery(
    context,
    agent,
    workspace,
    AppResourceType.File,
    parentFolder
  );
  return await context.semantic.file.getManyByWorkspaceParentAndIdList(query, pagination);
}

export default listFolderContent;
