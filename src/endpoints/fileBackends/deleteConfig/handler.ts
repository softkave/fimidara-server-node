import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {validate} from '../../../utils/validate.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {DeleteFileBackendConfigEndpoint} from './types.js';
import {beginDeleteFileBackendConfig} from './utils.js';
import {deleteFileBackendConfigJoiSchema} from './validation.js';

const deleteFileBackendConfig: DeleteFileBackendConfigEndpoint =
  async reqData => {
    const configModel = kIjxSemantic.fileBackendConfig();
    const data = validate(reqData.data, deleteFileBackendConfigJoiSchema);
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
      target: {
        action: kFimidaraPermissionActions.deleteFileBackendConfig,
        targetId: workspace.resourceId,
      },
    });

    const config = await configModel.getOneById(data.configId);
    appAssert(config, kReuseableErrors.config.notFound());

    const configMountsCount = await kIjxSemantic
      .fileBackendMount()
      .countByQuery({configId: config.resourceId});

    if (configMountsCount > 0) {
      throw kReuseableErrors.config.configInUse(configMountsCount);
    }

    const [job] = await beginDeleteFileBackendConfig({
      agent,
      workspaceId: workspace.resourceId,
      resources: [config],
    });
    appAssert(job);

    return {jobId: job.resourceId};
  };

export default deleteFileBackendConfig;
