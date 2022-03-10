import {defaultTo} from 'lodash';
import {IFile} from '../../../definitions/file';
import {IOrganization} from '../../../definitions/organization';
import {AppResourceType, ISessionAgent} from '../../../definitions/system';
import {getDate} from '../../../utilities/dateFns';
import {IBaseContext} from '../../contexts/BaseContext';
import {updatePublicPresetAccessOps} from '../../permissionItems/utils';
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
  const existingPublicAccessOps = existingFile.publicAccessOps;
  const publicAccessOps = makeFilePublicAccessOps(
    agent,
    data.publicAccessActions,
    existingPublicAccessOps
  );

  const file = await context.data.file.assertUpdateItem(
    EndpointReusableQueries.getById(existingFile.resourceId),
    {
      publicAccessOps,
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

  await updatePublicPresetAccessOps(
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
