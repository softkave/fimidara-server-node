import {pick} from 'lodash';
import {FileBackendConfig} from '../../../definitions/fileBackend';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {configNameExists, fileBackendConfigExtractor} from '../utils';
import {UpdateFileBackendConfigEndpoint} from './types';
import {updateFileBackendConfigJoiSchema} from './validation';

const updateFileBackendConfig: UpdateFileBackendConfigEndpoint = async instData => {
  const configModel = kSemanticModels.fileBackendConfig();
  const secretsManager = kUtilsInjectables.secretsManager();

  const data = validate(instData.data, updateFileBackendConfigJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'updateFileBackendConfig', targetId: workspace.resourceId},
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
        workspaceId: workspace.resourceId,
      });

      if (configExists) {
        throw kReuseableErrors.config.configExists();
      }
    }

    if (data.config.credentials) {
      const unencryptedCredentials = JSON.stringify(data.config.credentials);
      const {secretId: secretId} = await secretsManager.updateSecret({
        name: config.resourceId,
        text: unencryptedCredentials,
        secretId: config.secretId,
      });

      configUpdate.secretId = secretId;
    }

    return await configModel.getAndUpdateOneById(config.resourceId, configUpdate, opts);
  });

  appAssert(updatedConfig);
  return {config: fileBackendConfigExtractor(updatedConfig)};
};

export default updateFileBackendConfig;
