import {validate} from '../../../utils/validate';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {ResolveEntityPermissionsEndpoint} from './types';
import {INTERNAL_resolveEntityPermissions, checkResolveEntityPermissionsAuth} from './utils';
import {resolveEntityPermissionsJoiSchema} from './validation';

const resolveEntityPermissions: ResolveEntityPermissionsEndpoint = async (context, instData) => {
  const data = validate(instData.data, resolveEntityPermissionsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkResolveEntityPermissionsAuth(context, agent, workspace, data);
  const checkResult = await INTERNAL_resolveEntityPermissions(context, agent, workspace, data);
  return {items: checkResult};
};

export default resolveEntityPermissions;
