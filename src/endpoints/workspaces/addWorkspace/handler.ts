import {AppResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {workspaceExtractor} from '../utils';
import internalCreateWorkspace from './internalCreateWorkspace';
import {AddWorkspaceEndpoint} from './types';
import {addWorkspaceJoiSchema} from './validation';

const addWorkspace: AddWorkspaceEndpoint = async (context, instData) => {
  const data = validate(instData.data, addWorkspaceJoiSchema);
  const agent = await context.session.getAgent(context, instData, AppResourceType.User);
  appAssert(agent.user);
  const {workspace} = await internalCreateWorkspace(context, data, agent, agent.user.resourceId);
  return {workspace: workspaceExtractor(workspace)};
};

export default addWorkspace;
