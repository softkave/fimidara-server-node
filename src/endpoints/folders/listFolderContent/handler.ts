import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {Folder} from '../../../definitions/folder.js';
import {
  SessionAgent,
  kFimidaraResourceType,
} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {validate} from '../../../utils/validate.js';
import {areMountsCompletelyIngestedForFolder} from '../../fileBackends/mountUtils.js';
import {fileListExtractor} from '../../files/utils.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {
  PaginationQuery,
  kEndpointResultNoteCodeMap,
  kEndpointResultNotesToMessageMap,
} from '../../types.js';
import {folderListExtractor} from '../utils.js';
import {ListFolderContentEndpoint} from './types.js';
import {getWorkspaceAndParentFolder, listFolderContentQuery} from './utils.js';
import {listFolderContentJoiSchema} from './validation.js';

const listFolderContent: ListFolderContentEndpoint = async reqData => {
  const data = validate(reqData.data, listFolderContentJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {workspace, parentFolder} = await getWorkspaceAndParentFolder(
    agent,
    data
  );

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
            message:
              kEndpointResultNotesToMessageMap.mountsNotCompletelyIngested(),
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

  return await kIjxSemantic
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

  return await kIjxSemantic
    .file()
    .getManyByWorkspaceParentAndIdList(query, pagination);
}

export default listFolderContent;
