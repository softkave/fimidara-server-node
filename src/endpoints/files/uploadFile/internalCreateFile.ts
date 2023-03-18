import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {AppResourceType, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {newWorkspaceResource} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {IBaseContext} from '../../contexts/types';
import {addPublicPermissionGroupAccessOps} from '../../permissionItems/utils';
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
  const file = newWorkspaceResource(agent, AppResourceType.File, workspace.resourceId, {
    workspaceId: workspace.resourceId,
    resourceId: fileId,
    extension: data.extension ?? pathWithDetails.extension ?? '',
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
  });
  return file;
}

export async function internalCreateFile(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  data: IUploadFileEndpointParams,
  file: IFile
) {
  await context.semantic.file.insertItem(file);
  const publicAccessOps = makeFilePublicAccessOps(agent, data.publicAccessAction);
  await addPublicPermissionGroupAccessOps(context, agent, workspace, publicAccessOps, file);
  await saveResourceAssignedItems(context, agent, workspace, file.resourceId, data, false);
  return file;
}
