import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {workspaceExtractor} from '../utils.js';
import {GetWorkspaceEndpoint} from './types.js';
import {getWorkspaceJoiSchema} from './validation.js';

const getWorkspaceEndpoint: GetWorkspaceEndpoint = async reqData => {
  const data = validate(reqData.data, getWorkspaceJoiSchema);
  const {getWorkspace} = await initEndpoint(reqData, {data});
  const workspace = await getWorkspace(
    kFimidaraPermissionActions.readWorkspace
  );

  return {workspace: workspaceExtractor(workspace)};
};

export default getWorkspaceEndpoint;
