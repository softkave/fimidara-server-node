import {IFolder} from '../../../definitions/folder';
import {IOrganization} from '../../../definitions/organization';
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
  organization: IOrganization,
  pathWithDetails: ISplitfilepathWithDetails,
  data: IUploadFileEndpointParams,
  parentFolder: IFolder | null
) {
  const fileId = getNewId();
  const file = await context.data.file.saveItem({
    organizationId: organization.resourceId,
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
    organization,
    file.resourceId,
    AppResourceType.File,
    publicAccessOps,
    file.resourceId
  );

  await saveResourceAssignedItems(
    context,
    agent,
    organization,
    file.resourceId,
    AppResourceType.File,
    data,
    false
  );

  return file;
}
