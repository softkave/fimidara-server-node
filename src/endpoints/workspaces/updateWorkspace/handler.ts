import {omit} from 'lodash';
import {BasicCRUDActions} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {getDateString} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {checkWorkspaceNameExists} from '../checkWorkspaceNameExists';
import {
  assertWorkspace,
  checkWorkspaceAuthorization02,
  workspaceExtractor,
} from '../utils';
import {UpdateWorkspaceEndpoint} from './types';
import {updateWorkspaceJoiSchema} from './validation';

const updateWorkspace: UpdateWorkspaceEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateWorkspaceJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const {workspace} = await checkWorkspaceAuthorization02(
    context,
    agent,
    workspaceId,
    BasicCRUDActions.Update
  );

  if (data.workspace.name && data.workspace.name !== workspace.name) {
    await checkWorkspaceNameExists(context, data.workspace.name);
  }

  // if (
  //   data.workspace.rootname &&
  //   data.workspace.rootname !== workspace.rootname
  // ) {
  //   await checkWorkspaceRootnameExists(context, data.workspace.rootname);
  // }

  const update: Partial<IWorkspace> = {
    ...omit(data.workspace, ['usageThresholds']),
    lastUpdatedAt: getDateString(),
    lastUpdatedBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
  };

  // TODO: replace with user defined usage thresholds when we implement billing
  // if (data.workspace.usageThresholds) {
  //   update.usageThresholds = transformUsageThresholInput(
  //     agent,
  //     data.workspace.usageThresholds
  //   );
  // }

  const updatedWorkspace = await context.cacheProviders.workspace.updateById(
    context,
    workspace.resourceId,
    update
  );

  assertWorkspace(updatedWorkspace);
  return {workspace: workspaceExtractor(updatedWorkspace)};
};

export default updateWorkspace;
