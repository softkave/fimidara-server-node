import {IFolder} from '../../../definitions/folder';
import {IWorkspace} from '../../../definitions/workspace';
import {
  AppResourceType,
  IAgent,
  ISessionAgent,
} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import {replacePublicPresetAccessOpsByPermissionOwner} from '../../permissionItems/utils';
import {ISplitfilepathWithDetails} from '../utils';
import {makeFilePublicAccessOps} from './accessOps';
import {IUploadFileEndpointParams} from './types';
import {IFile} from '../../../definitions/file';

export function getNewFile(
  agent: ISessionAgent,
  workspace: IWorkspace,
  pathWithDetails: ISplitfilepathWithDetails,
  data: IUploadFileEndpointParams,
  parentFolder: IFolder | null
) {
  const fileId = getNewId();
  const createdAt = getDateString();
  const createdBy: IAgent = {
    agentId: agent.agentId,
    agentType: agent.agentType,
  };

  const file = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    workspaceId: workspace.resourceId,
    resourceId: fileId,
    extension: data.extension || pathWithDetails.extension || '',
    name: pathWithDetails.nameWithoutExtension,
    idPath: parentFolder ? parentFolder.idPath.concat(fileId) : [fileId],
    namePath: parentFolder
      ? parentFolder.namePath.concat(pathWithDetails.nameWithoutExtension)
      : [pathWithDetails.nameWithoutExtension],
    folderId: parentFolder?.resourceId,
    mimetype: data.mimetype,
    size: data.data.length,
    description: data.description,
    encoding: data.encoding,
  };

  return file;
}

export async function internalCreateFile(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  data: IUploadFileEndpointParams,
  file: IFile
) {
  const publicAccessOps = makeFilePublicAccessOps(
    agent,
    data.publicAccessAction
  );

  await replacePublicPresetAccessOpsByPermissionOwner(
    context,
    agent,
    workspace,
    file.resourceId,
    AppResourceType.File,
    publicAccessOps,
    file.resourceId
  );

  await saveResourceAssignedItems(
    context,
    agent,
    workspace,
    file.resourceId,
    AppResourceType.File,
    data,
    false
  );

  return file;
}
