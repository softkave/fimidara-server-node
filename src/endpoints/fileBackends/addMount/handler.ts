import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {fileBackendMountExtractor} from '../utils';
import {AddFileBackendMountEndpoint} from './types';
import {INTERNAL_addFileBackendMount} from './utils';
import {addFileBackendMountJoiSchema} from './validation';

const addFileBackendMountEndpoint: AddFileBackendMountEndpoint = async instData => {
  const data = validate(instData.data, addFileBackendMountJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
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

  const mount = await kSemanticModels.utils().withTxn(async opts => {
    return await INTERNAL_addFileBackendMount(agent, workspace, data.mount, opts);
  }, /** reuseTxn */ false);

  return {mount: fileBackendMountExtractor(mount)};
};

export default addFileBackendMountEndpoint;
