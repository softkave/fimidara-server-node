import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {fileBackendMountExtractor} from '../utils.js';
import {GetFileBackendMountEndpoint} from './types.js';
import {getFileBackendMountJoiSchema} from './validation.js';

const getFileBackendMount: GetFileBackendMountEndpoint = async reqData => {
  const mountModel = kSemanticModels.fileBackendMount();
  const data = validate(reqData.data, getFileBackendMountJoiSchema);
  const {agent, workspace} = await initEndpoint(reqData, {data});

  await checkAuthorizationWithAgent({
    agent,
    workspaceId: workspace.resourceId,
    target: {
      action: kFimidaraPermissionActions.readFileBackendMount,
      targetId: data.mountId,
    },
  });

  const mount = await mountModel.getOneById(data.mountId);
  appAssert(mount, kReuseableErrors.mount.notFound());

  return {mount: fileBackendMountExtractor(mount)};
};

export default getFileBackendMount;
