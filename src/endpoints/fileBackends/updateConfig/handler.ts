import {pick} from 'lodash';
import {container} from 'tsyringe';
import {FileBackendConfig} from '../../../definitions/fileBackend';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {SecretManagerProvider} from '../../contexts/encryption/types';
import {kInjectionKeys} from '../../contexts/injection';
import {SemanticFileBackendConfigProvider} from '../../contexts/semantic/fileBackendConfig/types';
import {SemanticProviderUtils} from '../../contexts/semantic/types';
import {NotFoundError, ResourceExistsError} from '../../errors';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {fileBackendConfigExtractor} from '../utils';
import {UpdateFileBackendConfigEndpoint} from './types';
import {updateFileBackendConfigJoiSchema} from './validation';

const updateFileBackendConfig: UpdateFileBackendConfigEndpoint = async (
  context,
  instData
) => {
  const configModel = container.resolve<SemanticFileBackendConfigProvider>(
    kInjectionKeys.semantic.fileBackendConfig
  );
  const semanticUtils = container.resolve<SemanticProviderUtils>(
    kInjectionKeys.semantic.utils
  );
  const encryptionProvider = container.resolve<SecretManagerProvider>(
    kInjectionKeys.encryption
  );

  const data = validate(instData.data, updateFileBackendConfigJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'updateFileBackendConfig', targetId: workspace.resourceId},
  });

  const updatedConfig = await semanticUtils.withTxn(async opts => {
    const config = await configModel.getOneById(data.configId, opts);
    appAssert(config, new NotFoundError('File backend config not found.'));

    const configUpdate: Partial<FileBackendConfig> = {
      ...pick(data.config, ['name', 'description']),
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    };

    if (data.config.credentials) {
      const unencryptedCredentials = JSON.stringify(data.config.credentials);
      const {cipher, encryptedText} = await encryptionProvider.addSecret(
        unencryptedCredentials
      );
      configUpdate.credentials = encryptedText;
      configUpdate.cipher = cipher;
    }

    if (
      data.config.name &&
      data.config.name.toLowerCase() !== config.name.toLowerCase()
    ) {
      const configExists = await configModel.getByName(
        workspace.resourceId,
        data.config.name,
        opts
      );

      if (configExists) {
        throw new ResourceExistsError(
          `File backend config with name ${data.config.name} exists.`
        );
      }
    }

    return await configModel.getAndUpdateOneById(config.resourceId, configUpdate, opts);
  });

  appAssert(updatedConfig);
  return {config: fileBackendConfigExtractor(updatedConfig)};
};

export default updateFileBackendConfig;
