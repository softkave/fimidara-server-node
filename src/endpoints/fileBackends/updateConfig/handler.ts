import {pick} from 'lodash-es';
import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {FileBackendConfig} from '../../../definitions/fileBackend.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {configNameExists, fileBackendConfigExtractor} from '../utils.js';
import {UpdateFileBackendConfigEndpoint} from './types.js';
import {updateFileBackendConfigJoiSchema} from './validation.js';

const updateFileBackendConfig: UpdateFileBackendConfigEndpoint =
  async reqData => {
    const configModel = kSemanticModels.fileBackendConfig();
    const secretsManager = kUtilsInjectables.secretsManager();

    const data = validate(reqData.data, updateFileBackendConfigJoiSchema);
    const {agent, workspaceId} = await initEndpoint(reqData, {data});

    await checkAuthorizationWithAgent({
      agent,
      workspaceId,
      target: {
        action: kFimidaraPermissionActions.updateFileBackendConfig,
        targetId: data.configId,
      },
    });

    const updatedConfig = await kSemanticModels.utils().withTxn(async opts => {
      const config = await configModel.getOneById(data.configId, opts);
      appAssert(config, kReuseableErrors.config.notFound());

      const configUpdate: Partial<FileBackendConfig> = {
        ...pick(data.config, ['name', 'description']),
        lastUpdatedAt: getTimestamp(),
        lastUpdatedBy: getActionAgentFromSessionAgent(agent),
      };

      if (
        data.config.name &&
        data.config.name.toLowerCase() !== config.name.toLowerCase()
      ) {
        const configExists = await configNameExists({
          name: data.config.name,
          workspaceId,
        });

        if (configExists) {
          throw kReuseableErrors.config.configExists();
        }
      }

      if (data.config.credentials) {
        const unencryptedCredentials = JSON.stringify(data.config.credentials);
        const {secretId} = await secretsManager.updateSecret({
          name: config.resourceId,
          text: unencryptedCredentials,
          secretId: config.secretId,
        });
        configUpdate.secretId = secretId;
      }

      return await configModel.getAndUpdateOneById(
        config.resourceId,
        configUpdate,
        opts
      );
    });

    appAssert(updatedConfig);
    return {config: fileBackendConfigExtractor(updatedConfig)};
  };

export default updateFileBackendConfig;
