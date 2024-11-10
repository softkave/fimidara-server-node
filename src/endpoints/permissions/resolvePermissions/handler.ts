import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {ResolvePermissionsEndpoint} from './types.js';
import {checkResolvePermissionsAuth, resolvePermissions} from './utils.js';
import {resolvePermissionsJoiSchema} from './validation.js';

const resolvePermissionsEndpoint: ResolvePermissionsEndpoint =
  async reqData => {
    const data = validate(reqData.data, resolvePermissionsJoiSchema);
    const {agent, workspaceId} = await initEndpoint(reqData, {data});

    await checkResolvePermissionsAuth(agent, workspaceId, data);
    const checkResult = await resolvePermissions(agent, workspaceId, data);

    return {items: checkResult};
  };

export default resolvePermissionsEndpoint;
