import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {ResolveEntityPermissionsEndpoint} from './types.js';
import {
  INTERNAL_resolveEntityPermissions,
  checkResolveEntityPermissionsAuth,
} from './utils.js';
import {resolveEntityPermissionsJoiSchema} from './validation.js';

const resolveEntityPermissions: ResolveEntityPermissionsEndpoint =
  async reqData => {
    const data = validate(reqData.data, resolveEntityPermissionsJoiSchema);
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    await checkResolveEntityPermissionsAuth(agent, workspace, data);
    const checkResult = await INTERNAL_resolveEntityPermissions(
      agent,
      workspace,
      data
    );
    return {items: checkResult};
  };

export default resolveEntityPermissions;
