import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {
  AppResourceType,
  IAgent,
  ISessionAgent,
} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {getDateString} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {IBaseContext} from '../../contexts/types';
import {replacePublicPermissionGroupAccessOpsByPermissionOwner} from '../../permissionItems/utils';
import {ISplitfilepathWithDetails} from '../utils';
import {makeFilePublicAccessOps} from './accessOps';
import {IUploadFileEndpointParams} from './types';

export function getNewFile(
  agent: ISessionAgent,
  workspace: IWorkspace,
  pathWithDetails: ISplitfilepathWithDetails,
  data: IUploadFileEndpointParams,
  parentFolder: IFolder | null
) {
  const fileId = getNewIdForResource(AppResourceType.File);
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
  await context.data.file.saveItem(file);
  const publicAccessOps = makeFilePublicAccessOps(
    agent,
    data.publicAccessAction
  );

  await replacePublicPermissionGroupAccessOpsByPermissionOwner(
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
