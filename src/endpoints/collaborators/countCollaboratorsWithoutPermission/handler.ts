import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getCollaboratorsQuery} from '../getCollaborators/utils.js';
import {getPagedCollaboratorsWithoutPermission} from '../getCollaboratorsWithoutPermission/handler.js';
import {CountCollaboratorsWithoutPermissionEndpoint} from './types.js';
import {countCollaboratorsWithoutPermissionJoiSchema} from './validation.js';

const countCollaboratorsWithoutPermissionEndpoint: CountCollaboratorsWithoutPermissionEndpoint =
  async reqData => {
    const data = validate(
      reqData.data,
      countCollaboratorsWithoutPermissionJoiSchema
    );
    const {agent, workspaceId} = await initEndpoint(reqData, {data});

    const assignedItemsQuery = await getCollaboratorsQuery(agent, workspaceId);
    const collaboratorIdList =
      await getPagedCollaboratorsWithoutPermission(assignedItemsQuery);
    const count = collaboratorIdList.length;

    return {count};
  };

export default countCollaboratorsWithoutPermissionEndpoint;
