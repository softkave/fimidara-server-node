import {IFile} from '../../../definitions/file';
import {ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {IBaseContext} from '../../contexts/types';
import {replacePublicPermissionGroupAccessOps} from '../../permissionItems/utils';
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
  const file = await context.semantic.file.getAndUpdateOneById(existingFile.resourceId, {
    ...data,
    extension: data.extension ?? pathWithDetails.extension ?? existingFile.extension,
    size: data.data.length,
    lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    lastUpdatedAt: getTimestamp(),
  });

  if (data.publicAccessAction) {
    const publicAccessOps = makeFilePublicAccessOps(agent, data.publicAccessAction);
    await replacePublicPermissionGroupAccessOps(context, agent, workspace, publicAccessOps, file);
  }

  await saveResourceAssignedItems(context, agent, workspace, file.resourceId, data, true);
  return file;
}
