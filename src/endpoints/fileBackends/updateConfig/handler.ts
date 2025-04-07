import {pick} from 'lodash-es';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {FileBackendConfig} from '../../../definitions/fileBackend.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {configNameExists, fileBackendConfigExtractor} from '../utils.js';
import {UpdateFileBackendConfigEndpoint} from './types.js';
import {updateFileBackendConfigJoiSchema} from './validation.js';

const updateFileBackendConfig: UpdateFileBackendConfigEndpoint =
  async reqData => {
    const configModel = kIjxSemantic.fileBackendConfig();
    const secretsManager = kIjxUtils.secretsManager();

    const data = validate(reqData.data, updateFileBackendConfigJoiSchema);
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
        action: kFimidaraPermissionActions.updateFileBackendConfig,
        targetId: workspace.resourceId,
      },
    });

    const updatedConfig = await kIjxSemantic.utils().withTxn(async opts => {
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
          workspaceId: workspace.resourceId,
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
