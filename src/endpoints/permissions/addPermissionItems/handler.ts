import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {AddPermissionItemsEndpoint} from './types.js';
import {addPermissionItems} from './utils.js';
import {addPermissionItemsJoiSchema} from './validation.js';

const addPermissionItemsEndpoint: AddPermissionItemsEndpoint =
  async reqData => {
    const data = validate(reqData.data, addPermissionItemsJoiSchema);
    const {agent, workspace} = await initEndpoint(reqData, {
      data,
      action: kFimidaraPermissionActions.updatePermission,
    });

    await kSemanticModels
      .utils()
      .withTxn(
        async opts => await addPermissionItems(agent, workspace, data, opts)
      );
  };

export default addPermissionItemsEndpoint;
