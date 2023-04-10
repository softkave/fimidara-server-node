import {omit} from 'lodash';
import {AppActionType, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {objectHasData} from '../../../utils/fns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {assertWorkspace} from '../../workspaces/utils';
import {checkFileAuthorization03, fileExtractor} from '../utils';
import {UpdateFileDetailsEndpoint} from './types';
import {updateFileDetailsJoiSchema} from './validation';

/**
 * TODO:
 * - [Medium] Implement name and path update
 */

const updateFileDetails: UpdateFileDetailsEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateFileDetailsJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  let file = await executeWithMutationRunOptions(context, async opts => {
    let {file} = await checkFileAuthorization03(context, agent, data, AppActionType.Update, opts);

    if (objectHasData(omit(data.file, 'tags'))) {
      file = await context.semantic.file.getAndUpdateOneById(
        file.resourceId,
        {
          ...data.file,
          lastUpdatedAt: getTimestamp(),
          lastUpdatedBy: getActionAgentFromSessionAgent(agent),
        },
        opts
      );
    }

    const workspace = await context.semantic.workspace.getOneById(file.workspaceId);
    assertWorkspace(workspace);

    // if (data.file.publicAccessAction) {
    //   const permissionItemInputs = makeFilePublicAccessOps(file, data.file.publicAccessAction);
    //   await updatePublicPermissionGroupAccessOps({
    //     context,
    //     agent,
    //     workspace,
    //     opts,
    //     items: permissionItemInputs,
    //     deleteItems: [{target: {targetId: file.resourceId}}],
    //   });
    // }

    await saveResourceAssignedItems(
      context,
      agent,
      workspace,
      file.resourceId,
      data.file,
      /** delete existing */ true,
      opts
    );
    return file;
  });

  file = await populateAssignedTags(context, file.workspaceId, file);
  return {file: fileExtractor(file)};
};

export default updateFileDetails;
