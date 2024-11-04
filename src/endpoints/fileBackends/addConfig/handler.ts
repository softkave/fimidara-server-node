import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {fileBackendConfigExtractor} from '../utils.js';
import {AddFileBackendConfigEndpoint} from './types.js';
import {addFileBackendConfig} from './utils.js';
import {addConfigJoiSchema} from './validation.js';

const addFileBackendConfigEndpoint: AddFileBackendConfigEndpoint =
  async reqData => {
    const data = validate(reqData.data, addConfigJoiSchema);
    const {agent, workspace} = await initEndpoint(reqData, {
      data,
      action: kFimidaraPermissionActions.addFileBackendConfig,
    });

    const backend = await kSemanticModels.utils().withTxn(async opts => {
      return await addFileBackendConfig(agent, workspace, data, opts);
    });

    return {config: fileBackendConfigExtractor(backend)};
  };

export default addFileBackendConfigEndpoint;
