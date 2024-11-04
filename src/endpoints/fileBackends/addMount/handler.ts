import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {fileBackendMountExtractor} from '../utils.js';
import {AddFileBackendMountEndpoint} from './types.js';
import {addFileBackendMount} from './utils.js';
import {addFileBackendMountJoiSchema} from './validation.js';

const addFileBackendMountEndpoint: AddFileBackendMountEndpoint =
  async reqData => {
    const data = validate(reqData.data, addFileBackendMountJoiSchema);
    const {agent, workspace} = await initEndpoint(reqData, {
      data,
      action: kFimidaraPermissionActions.addFileBackendMount,
    });

    const mount = await kSemanticModels.utils().withTxn(async opts => {
      return await addFileBackendMount(agent, workspace, data, opts);
    });

    return {mount: fileBackendMountExtractor(mount)};
  };

export default addFileBackendMountEndpoint;
