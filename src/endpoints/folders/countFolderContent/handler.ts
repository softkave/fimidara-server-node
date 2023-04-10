import {IFolder} from '../../../definitions/folder';
import {AppResourceType, ISessionAgent, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {validate} from '../../../utils/validate';
import {IBaseContext} from '../../contexts/types';
import {getWorkspaceAndParentFolder, listFolderContentQuery} from '../listFolderContent/utils';
import {CountFolderContentEndpoint} from './types';
import {countFolderContentJoiSchema} from './validation';

const countFolderContent: CountFolderContentEndpoint = async (context, instData) => {
  const data = validate(instData.data, countFolderContentJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  const {workspace, parentFolder} = await getWorkspaceAndParentFolder(context, agent, data);
  const [foldersCount, filesCount] = await Promise.all([
    countFolders(context, agent, workspace, parentFolder),
    countFiles(context, agent, workspace, parentFolder),
  ]);
  return {foldersCount, filesCount};
};

async function countFolders(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  parentFolder: IFolder | null
) {
  const q = await listFolderContentQuery(
    context,
    agent,
    workspace,
    AppResourceType.Folder,
    parentFolder
  );
  return await context.semantic.folder.countManyParentByIdList(q);
}

async function countFiles(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  parentFolder: IFolder | null
) {
  const q = await listFolderContentQuery(
    context,
    agent,
    workspace,
    AppResourceType.File,
    parentFolder
  );
  return await context.semantic.file.countManyParentByIdList(q);
}

export default countFolderContent;
