import {Folder} from '../../../definitions/folder';
import {
  AppResourceTypeMap,
  PERMISSION_AGENT_TYPES,
  SessionAgent,
} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {areMountsCompletelyIngestedForFolder} from '../../fileBackends/mountUtils';
import {fileListExtractor} from '../../files/utils';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination';
import {
  EndpointResultNoteCodeMap,
  PaginationQuery,
  kEndpointResultNotesToMessageMap,
} from '../../types';
import {folderListExtractor} from '../utils';
import {ListFolderContentEndpoint} from './types';
import {getWorkspaceAndParentFolder, listFolderContentQuery} from './utils';
import {listFolderContentJoiSchema} from './validation';

const listFolderContent: ListFolderContentEndpoint = async instData => {
  const data = validate(instData.data, listFolderContentJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, PERMISSION_AGENT_TYPES);
  const {workspace, parentFolder} = await getWorkspaceAndParentFolder(agent, data);

  applyDefaultEndpointPaginationOptions(data);
  const contentType = data.contentType ?? [
    AppResourceTypeMap.File,
    AppResourceTypeMap.Folder,
  ];
  const [fetchedFolders, fetchedFiles] = await Promise.all([
    contentType.includes(AppResourceTypeMap.Folder)
      ? fetchFolders(agent, workspace, parentFolder, data)
      : [],
    contentType.includes(AppResourceTypeMap.File)
      ? fetchFiles(agent, workspace, parentFolder, data)
      : [],
  ]);

  const mountsCompletelyIngested = await areMountsCompletelyIngestedForFolder(
    parentFolder || {workspaceId: workspace.resourceId, namepath: []}
  );

  return {
    folders: folderListExtractor(fetchedFolders),
    files: fileListExtractor(fetchedFiles),
    page: getEndpointPageFromInput(data),
    notes: mountsCompletelyIngested
      ? undefined
      : [
          {
            code: EndpointResultNoteCodeMap.mountsNotCompletelyIngested,
            message: kEndpointResultNotesToMessageMap.mountsNotCompletelyIngested(),
          },
        ],
  };
};

async function fetchFolders(
  agent: SessionAgent,
  workspace: Workspace,
  parentFolder: Folder | null,
  pagination: PaginationQuery
) {
  const query = await listFolderContentQuery(
    agent,
    workspace,
    AppResourceTypeMap.Folder,
    parentFolder
  );

  return await kSemanticModels
    .folder()
    .getManyByWorkspaceParentAndIdList(query, pagination);
}

async function fetchFiles(
  agent: SessionAgent,
  workspace: Workspace,
  parentFolder: Folder | null,
  pagination: PaginationQuery
) {
  const query = await listFolderContentQuery(
    agent,
    workspace,
    AppResourceTypeMap.File,
    parentFolder
  );

  return await kSemanticModels
    .file()
    .getManyByWorkspaceParentAndIdList(query, pagination);
}

export default listFolderContent;
