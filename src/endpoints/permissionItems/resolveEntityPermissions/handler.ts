import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {ResolveEntityPermissionsEndpoint} from './types';
import {
  INTERNAL_resolveEntityPermissions,
  checkResolveEntityPermissionsAuth,
} from './utils';
import {resolveEntityPermissionsJoiSchema} from './validation';

const resolveEntityPermissions: ResolveEntityPermissionsEndpoint = async instData => {
  const data = validate(instData.data, resolveEntityPermissionsJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkResolveEntityPermissionsAuth(agent, workspace, data);
  const checkResult = await INTERNAL_resolveEntityPermissions(agent, workspace, data);
  return {items: checkResult};
};

export default resolveEntityPermissions;
