import {AppResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {workspaceExtractor} from '../utils';
import internalCreateWorkspace from './internalCreateWorkspace';
import {AddWorkspaceEndpoint} from './types';
import {addWorkspaceJoiSchema} from './validation';

const addWorkspace: AddWorkspaceEndpoint = async (context, instData) => {
  const data = validate(instData.data, addWorkspaceJoiSchema);
  const agent = await context.session.getAgent(context, instData, AppResourceType.User);
  const {workspace} = await executeWithMutationRunOptions(context, async opts => {
    appAssert(agent.user);
    return await internalCreateWorkspace(context, data, agent, agent.user.resourceId, opts);
  });
  return {workspace: workspaceExtractor(workspace)};
};

export default addWorkspace;
