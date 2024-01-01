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
import {EndpointResultNoteCodeMap, kEndpointResultNotesToMessageMap} from '../../types';
import {
  getWorkspaceAndParentFolder,
  listFolderContentQuery,
} from '../listFolderContent/utils';
import {CountFolderContentEndpoint} from './types';
import {countFolderContentJoiSchema} from './validation';

const countFolderContent: CountFolderContentEndpoint = async instData => {
  const data = validate(instData.data, countFolderContentJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, kPermissionAgentTypes);
  const {workspace, parentFolder} = await getWorkspaceAndParentFolder(agent, data);

  const contentType = data.contentType ?? [
    kAppResourceType.File,
    kAppResourceType.Folder,
  ];
  const [foldersCount, filesCount] = await Promise.all([
    contentType.includes(kAppResourceType.Folder)
      ? countFolders(agent, workspace, parentFolder)
      : 0,
    contentType.includes(kAppResourceType.File)
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
            code: EndpointResultNoteCodeMap.mountsNotCompletelyIngested,
            message: kEndpointResultNotesToMessageMap.mountsNotCompletelyIngested(),
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
    kAppResourceType.Folder,
    parentFolder
  );

  return await kSemanticModels.folder().countManyParentByIdList(q);
}

async function countFiles(
  agent: SessionAgent,
  workspace: Workspace,
  parentFolder: Folder | null
) {
  const q = await listFolderContentQuery(
    agent,
    workspace,
    kAppResourceType.File,
    parentFolder
  );

  return await kSemanticModels.file().countManyParentByIdList(q);
}

export default countFolderContent;
