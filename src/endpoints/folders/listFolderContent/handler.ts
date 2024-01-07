import {Folder} from '../../../definitions/folder';
import {
  kAppResourceType,
  kPermissionAgentTypes,
  SessionAgent,
} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {areMountsCompletelyIngestedForFolder} from '../../fileBackends/mountUtils';
import {fileListExtractor} from '../../files/utils';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination';
import {
  kEndpointResultNoteCodeMap,
  kEndpointResultNotesToMessageMap,
  PaginationQuery,
} from '../../types';
import {folderListExtractor} from '../utils';
import {ListFolderContentEndpoint} from './types';
import {getWorkspaceAndParentFolder, listFolderContentQuery} from './utils';
import {listFolderContentJoiSchema} from './validation';

const listFolderContent: ListFolderContentEndpoint = async instData => {
  const data = validate(instData.data, listFolderContentJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, kPermissionAgentTypes);
  const {workspace, parentFolder} = await getWorkspaceAndParentFolder(agent, data);

  applyDefaultEndpointPaginationOptions(data);
  const contentType = data.contentType ?? [
    kAppResourceType.File,
    kAppResourceType.Folder,
  ];
  const [fetchedFolders, fetchedFiles] = await Promise.all([
    contentType.includes(kAppResourceType.Folder)
      ? fetchFolders(agent, workspace, parentFolder, data)
      : [],
    contentType.includes(kAppResourceType.File)
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
            code: kEndpointResultNoteCodeMap.mountsNotCompletelyIngested,
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
    kAppResourceType.Folder,
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
    kAppResourceType.File,
    parentFolder
  );

  return await kSemanticModels
    .file()
    .getManyByWorkspaceParentAndIdList(query, pagination);
}

export default listFolderContent;
