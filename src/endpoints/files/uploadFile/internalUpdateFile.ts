import {IFile} from '../../../definitions/file';
import {AppResourceType, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {getDate} from '../../../utilities/dateFns';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {IBaseContext} from '../../contexts/types';
import {replacePublicPermissionGroupAccessOpsByPermissionOwner} from '../../permissionItems/utils';
import EndpointReusableQueries from '../../queries';
import {ISplitfilepathWithDetails} from '../utils';
import {makeFilePublicAccessOps} from './accessOps';
import {IUploadFileEndpointParams} from './types';

export async function internalUpdateFile(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  pathWithDetails: ISplitfilepathWithDetails,
  existingFile: IFile,
  data: IUploadFileEndpointParams
) {
  const file = await context.data.file.assertUpdateItem(
    EndpointReusableQueries.getById(existingFile.resourceId),
    {
      ...data,
      extension:
        data.extension || pathWithDetails.extension || existingFile.extension,
      size: data.data.length,
      lastUpdatedBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
      lastUpdatedAt: getDate(),
    }
  );

  if (data.publicAccessAction) {
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
  }

  await saveResourceAssignedItems(
    context,
    agent,
    workspace,
    file.resourceId,
    AppResourceType.File,
    data,
    true
  );

  return file;
}
