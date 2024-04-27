import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {ResolveEntityPermissionsEndpoint} from './types';
import {
  INTERNAL_resolveEntityPermissions,
  checkResolveEntityPermissionsAuth,
} from './utils';
import {resolveEntityPermissionsJoiSchema} from './validation';

const resolveEntityPermissions: ResolveEntityPermissionsEndpoint = async instData => {
  const data = validate(instData.data, resolveEntityPermissionsJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkResolveEntityPermissionsAuth(agent, workspace, data);
  const checkResult = await INTERNAL_resolveEntityPermissions(agent, workspace, data);
  return {items: checkResult};
};

export default resolveEntityPermissions;
