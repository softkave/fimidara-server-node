import {omit} from 'lodash';
import {IFolder} from '../../../definitions/folder';
import {AppActionType, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {checkFolderAuthorization02, folderExtractor} from '../utils';
import {UpdateFolderEndpoint} from './types';
import {updateFolderJoiSchema} from './validation';

const updateFolder: UpdateFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  let folder = await executeWithMutationRunOptions(context, async opts => {
    let {workspace, folder} = await checkFolderAuthorization02(
      context,
      agent,
      data,
      AppActionType.Update,
      /** workspace */ undefined,
      opts
    );
    const update: Partial<IFolder> = {
      ...omit(data.folder, 'publicAccessOps'),
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    };
    folder = await context.semantic.folder.getAndUpdateOneById(folder.resourceId, update, opts);

    // const incomingPublicAccessOps = data.folder.publicAccessOps;
    // const hasPublicAccessOpsChanges = !!incomingPublicAccessOps || data.folder.removePublicAccessOps;
    // let publicAccessOps = incomingPublicAccessOps
    //   ? incomingPublicAccessOps.map(op => ({
    //       ...op,
    //       markedAt: getTimestamp(),
    //       markedBy: agent,
    //     }))
    //   : [];

    // if (data.folder.removePublicAccessOps) {
    //   publicAccessOps = [];
    // }

    // // TODO: delete/replace folder public access ops
    // await updatePublicPermissionGroupAccessOps(context, agent, workspace, publicAccessOps, folder);

    await saveResourceAssignedItems(
      context,
      agent,
      workspace,
      folder.resourceId,
      data.folder,
      /** delete existing */ true,
      opts
    );

    return folder;
  });
  folder = await populateAssignedTags(context, folder.workspaceId, folder);
  return {folder: folderExtractor(folder!)};
};

export default updateFolder;
