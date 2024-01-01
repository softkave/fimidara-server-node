import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {fileBackendMountExtractor} from '../utils';
import {GetFileBackendMountEndpoint} from './types';
import {getFileBackendMountJoiSchema} from './validation';

const getFileBackendMount: GetFileBackendMountEndpoint = async instData => {
  const mountModel = kSemanticModels.fileBackendMount();
  const data = validate(instData.data, getFileBackendMountJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'readFileBackendMount', targetId: workspace.resourceId},
  });

  const mount = await mountModel.getOneById(data.mountId);
  appAssert(mount, kReuseableErrors.mount.notFound());

  return {mount: fileBackendMountExtractor(mount)};
};

export default getFileBackendMount;
