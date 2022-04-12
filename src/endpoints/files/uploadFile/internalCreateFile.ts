import {IFolder} from '../../../definitions/folder';
import {IWorkspace} from '../../../definitions/workspace';
import {AppResourceType, ISessionAgent} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import {replacePublicPresetAccessOpsByPermissionOwner} from '../../permissionItems/utils';
import {ISplitfilepathWithDetails} from '../utils';
import {makeFilePublicAccessOps} from './accessOps';
import {IUploadFileEndpointParams} from './types';

export async function internalCreateFile(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  pathWithDetails: ISplitfilepathWithDetails,
  data: IUploadFileEndpointParams,
  parentFolder: IFolder | null
) {
  const fileId = getNewId();
  const file = await context.data.file.saveItem({
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
    createdBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
    createdAt: getDateString(),
    description: data.description,
    encoding: data.encoding,
  });

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
