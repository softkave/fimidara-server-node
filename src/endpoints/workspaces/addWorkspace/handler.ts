import {AppResourceType} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {workspaceExtractor} from '../utils';
import internalCreateWorkspace from './internalCreateWorkspace';
import {AddWorkspaceEndpoint} from './types';
import {addWorkspaceJoiSchema} from './validation';

const addWorkspace: AddWorkspaceEndpoint = async (context, instData) => {
  const data = validate(instData.data, addWorkspaceJoiSchema);
  const agent = await context.session.getAgent(context, instData, AppResourceType.User);
  const {workspace} = await internalCreateWorkspace(context, data, agent, agent.user!);
  return {workspace: workspaceExtractor(workspace)};
};

export default addWorkspace;
