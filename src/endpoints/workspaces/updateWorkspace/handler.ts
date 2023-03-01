import {BasicCRUDActions} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkWorkspaceNameExists} from '../checkWorkspaceExists';
import {checkWorkspaceAuthorization02, workspaceExtractor} from '../utils';
import {UpdateWorkspaceEndpoint} from './types';
import {updateWorkspaceJoiSchema} from './validation';

const updateWorkspace: UpdateWorkspaceEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateWorkspaceJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  let {workspace} = await checkWorkspaceAuthorization02(
    context,
    agent,
    BasicCRUDActions.Update,
    data.workspaceId
  );

  await Promise.all([
    data.workspace.name &&
      data.workspace.name !== workspace.name &&
      checkWorkspaceNameExists(context, data.workspace.name),

    // TODO: allow changing workspace rootname
    // data.workspace.rootname &&
    //   data.workspace.rootname !== workspace.rootname &&
    //   checkWorkspaceRootnameExists(context, data.workspace.rootname),
  ]);

  const update: Partial<IWorkspace> = {
    ...data.workspace,
    lastUpdatedAt: getTimestamp(),
    lastUpdatedBy: getActionAgentFromSessionAgent(agent),
  };

  // TODO: replace with user defined usage thresholds when we implement billing
  // if (data.workspace.usageThresholds) {
  //   update.usageThresholds = transformUsageThresholInput(
  //     agent,
  //     data.workspace.usageThresholds
  //   );
  // }

  workspace = await context.semantic.workspace.getAndUpdateOneById(workspace.resourceId, update);
  return {workspace: workspaceExtractor(workspace)};
};

export default updateWorkspace;
