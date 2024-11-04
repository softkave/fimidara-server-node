import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {DeleteFileBackendConfigEndpoint} from './types.js';
import {beginDeleteFileBackendConfig} from './utils.js';
import {deleteFileBackendConfigJoiSchema} from './validation.js';

const deleteFileBackendConfig: DeleteFileBackendConfigEndpoint =
  async reqData => {
    const configModel = kSemanticModels.fileBackendConfig();
    const data = validate(reqData.data, deleteFileBackendConfigJoiSchema);
    const {agent, workspace} = await initEndpoint(reqData, {data});

    await checkAuthorizationWithAgent({
      agent,
      workspaceId: workspace.resourceId,
      target: {
        action: kFimidaraPermissionActions.deleteFileBackendConfig,
        targetId: data.configId,
      },
    });

    const config = await configModel.getOneById(data.configId);
    appAssert(config, kReuseableErrors.config.notFound());

    const configMountsCount = await kSemanticModels
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
