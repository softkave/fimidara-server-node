import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {Workspace} from '../../../definitions/workspace.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {checkWorkspaceNameExists} from '../checkWorkspaceExists.js';
import {assertWorkspace, workspaceExtractor} from '../utils.js';
import {UpdateWorkspaceEndpoint} from './types.js';
import {updateWorkspaceJoiSchema} from './validation.js';

const updateWorkspaceEndpoint: UpdateWorkspaceEndpoint = async reqData => {
  const data = validate(reqData.data, updateWorkspaceJoiSchema);
  const {agent, workspace} = await initEndpoint(reqData, {
    data,
    action: kFimidaraPermissionActions.updateWorkspace,
  });

  const updatedWorkspace = await kSemanticModels.utils().withTxn(async opts => {
    await Promise.all([
      data.workspace.name && data.workspace.name !== workspace.name
        ? checkWorkspaceNameExists(
            /** params */ {
              name: data.workspace.name,
              workspaceId: workspace.workspaceId,
            },
            opts
          )
        : undefined,
    ]);

    const update: Partial<Workspace> = {
      ...data.workspace,
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    };
    const updatedWorkspace = await kSemanticModels
      .workspace()
      .getAndUpdateOneById(workspace.resourceId, update, opts);

    assertWorkspace(updatedWorkspace);
    return updatedWorkspace;
  });

  return {workspace: workspaceExtractor(updatedWorkspace)};
};

export default updateWorkspaceEndpoint;
