import {IAgent, SessionAgentType} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {workspaceExtractor} from '../utils';
import internalCreateWorkspace from './internalCreateWorkspace';
import {AddWorkspaceEndpoint} from './types';
import {addWorkspaceJoiSchema} from './validation';

const addWorkspace: AddWorkspaceEndpoint = async (context, instData) => {
  const data = validate(instData.data, addWorkspaceJoiSchema);
  const user = await context.session.getUser(context, instData);
  const agent: IAgent = {
    agentId: user.resourceId,
    agentType: SessionAgentType.User,
  };

  const {workspace} = await internalCreateWorkspace(context, data, agent, user);
  return {
    workspace: workspaceExtractor(workspace),
  };
};

export default addWorkspace;
