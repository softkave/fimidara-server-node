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
import {
  kEndpointResultNoteCodeMap,
  kEndpointResultNotesToMessageMap,
} from '../../types.js';
import {
  getWorkspaceAndParentFolder,
  listFolderContentQuery,
} from '../listFolderContent/utils.js';
import {CountFolderContentEndpoint} from './types.js';
import {countFolderContentJoiSchema} from './validation.js';

const countFolderContent: CountFolderContentEndpoint = async reqData => {
  const data = validate(reqData.data, countFolderContentJoiSchema);
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

  const contentType = data.contentType ?? [
    kFimidaraResourceType.File,
    kFimidaraResourceType.Folder,
  ];
  const [foldersCount, filesCount] = await Promise.all([
    contentType.includes(kFimidaraResourceType.Folder)
      ? countFolders(agent, workspace, parentFolder)
      : 0,
    contentType.includes(kFimidaraResourceType.File)
      ? countFiles(agent, workspace, parentFolder)
      : 0,
  ]);

  const mountsCompletelyIngested = await areMountsCompletelyIngestedForFolder(
    parentFolder || {workspaceId: workspace.resourceId, namepath: []}
  );

  return {
    foldersCount,
    filesCount,
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

async function countFolders(
  agent: SessionAgent,
  workspace: Workspace,
  parentFolder: Folder | null
) {
  const q = await listFolderContentQuery(
    agent,
    workspace,
    kFimidaraResourceType.Folder,
    parentFolder
  );

  return await kIjxSemantic.folder().countManyParentByIdList(q);
}

async function countFiles(
  agent: SessionAgent,
  workspace: Workspace,
  parentFolder: Folder | null
) {
  const q = await listFolderContentQuery(
    agent,
    workspace,
    kFimidaraResourceType.File,
    parentFolder
  );

  return await kIjxSemantic.file().countManyParentByIdList(q);
}

export default countFolderContent;
