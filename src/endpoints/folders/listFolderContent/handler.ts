import {Folder} from '../../../definitions/folder';
import {SessionAgent, kFimidaraResourceType} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {areMountsCompletelyIngestedForFolder} from '../../fileBackends/mountUtils';
import {fileListExtractor} from '../../files/utils';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination';
import {
  PaginationQuery,
  kEndpointResultNoteCodeMap,
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
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {workspace, parentFolder} = await getWorkspaceAndParentFolder(agent, data);

  applyDefaultEndpointPaginationOptions(data);
  const contentType = data.contentType ?? [
    kFimidaraResourceType.File,
    kFimidaraResourceType.Folder,
  ];
  const [fetchedFolders, fetchedFiles] = await Promise.all([
    contentType.includes(kFimidaraResourceType.Folder)
      ? fetchFolders(agent, workspace, parentFolder, data)
      : [],
    contentType.includes(kFimidaraResourceType.File)
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
    kFimidaraResourceType.Folder,
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
    kFimidaraResourceType.File,
    parentFolder
  );

  return await kSemanticModels
    .file()
    .getManyByWorkspaceParentAndIdList(query, pagination);
}

export default listFolderContent;
