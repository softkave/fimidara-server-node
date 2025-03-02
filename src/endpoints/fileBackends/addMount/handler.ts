import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {fileBackendMountExtractor} from '../utils.js';
import {AddFileBackendMountEndpoint} from './types.js';
import {INTERNAL_addFileBackendMount} from './utils.js';
import {addFileBackendMountJoiSchema} from './validation.js';

const addFileBackendMountEndpoint: AddFileBackendMountEndpoint =
  async reqData => {
    const data = validate(reqData.data, addFileBackendMountJoiSchema);
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    await checkAuthorizationWithAgent({
      agent,
      workspace,
      workspaceId: workspace.resourceId,
      target: {action: 'addFileBackendMount', targetId: workspace.resourceId},
    });

    const mount = await kIjxSemantic.utils().withTxn(async opts => {
      return await INTERNAL_addFileBackendMount(agent, workspace, data, opts);
    });

    return {mount: fileBackendMountExtractor(mount)};
  };

export default addFileBackendMountEndpoint;
