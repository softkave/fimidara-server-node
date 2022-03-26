import {defaultTo} from 'lodash';
import {IFile} from '../../../definitions/file';
import {IOrganization} from '../../../definitions/organization';
import {
  AppResourceType,
  IPublicAccessOp,
  ISessionAgent,
} from '../../../definitions/system';
import {getDate} from '../../../utilities/dateFns';
import {IBaseContext} from '../../contexts/BaseContext';
import {replacePublicPresetAccessOpsByPermissionOwner} from '../../permissionItems/utils';
import EndpointReusableQueries from '../../queries';
import {ISplitFilePathWithDetails} from '../utils';
import {makeFilePublicAccessOps} from './accessOps';
import {IUploadFileParams} from './types';

export async function internalUpdateFile(
  context: IBaseContext,
  agent: ISessionAgent,
  organization: IOrganization,
  pathWithDetails: ISplitFilePathWithDetails,
  existingFile: IFile,
  data: IUploadFileParams
) {
  let publicAccessOps: IPublicAccessOp[] = [];

  if (data.publicAccessActions) {
    publicAccessOps = makeFilePublicAccessOps(agent, data.publicAccessActions);
  }

  const file = await context.data.file.assertUpdateItem(
    EndpointReusableQueries.getById(existingFile.resourceId),
    {
      extension: pathWithDetails.extension || defaultTo(data.extension, ''),
      mimetype: data.mimetype,
      size: data.data.length,
      lastUpdatedBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
      lastUpdatedAt: getDate(),
      description: data.description,
      encoding: data.encoding,
    }
  );

  if (data.publicAccessActions) {
    await replacePublicPresetAccessOpsByPermissionOwner(
      context,
      agent,
      organization,
      file.resourceId,
      AppResourceType.File,
      publicAccessOps,
      file.resourceId
    );
  }

  return file;
}
