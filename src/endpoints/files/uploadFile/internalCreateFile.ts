import {defaultTo} from 'lodash';
import {IFolder} from '../../../definitions/folder';
import {IOrganization} from '../../../definitions/organization';
import {AppResourceType, ISessionAgent} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {IBaseContext} from '../../contexts/BaseContext';
import {replacePublicPresetAccessOpsByPermissionOwner} from '../../permissionItems/utils';
import {ISplitFilePathWithDetails} from '../utils';
import {makeFilePublicAccessOps} from './accessOps';
import {IUploadFileParams} from './types';

export async function internalCreateFile(
  context: IBaseContext,
  agent: ISessionAgent,
  organization: IOrganization,
  pathWithDetails: ISplitFilePathWithDetails,
  data: IUploadFileParams,
  parentFolder: IFolder | null
) {
  const fileId = getNewId();
  const publicAccessOps = makeFilePublicAccessOps(
    agent,
    data.publicAccessActions
  );

  // if (data.inheritParentPublicAccessOps && parentFolder) {
  //   publicAccessOps = publicAccessOps.concat(
  //     getPublicAccessOpsForType(
  //       parentFolder.publicAccessOps,
  //       AppResourceType.File,
  //       [
  //         BasicCRUDActions.Read,
  //         BasicCRUDActions.Update,
  //         BasicCRUDActions.Delete,
  //       ]
  //     )
  //   );
  // }

  const file = await context.data.file.saveItem({
    publicAccessOps,
    organizationId: organization.resourceId,
    resourceId: fileId,
    extension: pathWithDetails.extension || defaultTo(data.extension, ''),
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

  await replacePublicPresetAccessOpsByPermissionOwner(
    context,
    agent,
    organization,
    file.resourceId,
    AppResourceType.File,
    publicAccessOps,
    file.resourceId
  );

  return file;
}
