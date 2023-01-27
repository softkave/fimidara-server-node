import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {waitOnPromises} from '../../../utils/waitOnPromises';
import {deleteResourceAssignedItems} from '../../assignedItems/deleteAssignedItems';
import PermissionItemQueries from '../../permissionItems/queries';
import EndpointReusableQueries from '../../queries';
import {checkClientAssignedTokenAuthorization03} from '../utils';
import {DeleteClientAssignedTokenEndpoint} from './types';
import {deleteClientAssignedTokenJoiSchema} from './validation';

const deleteClientAssignedToken: DeleteClientAssignedTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteClientAssignedTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {token} = await checkClientAssignedTokenAuthorization03(context, agent, data, BasicCRUDActions.Delete);

  await waitOnPromises([
    // Delete permission items that belong to the token
    context.data.permissionItem.deleteManyByQuery(
      PermissionItemQueries.getByPermissionEntity(token.resourceId, AppResourceType.ClientAssignedToken)
    ),

    // Delete permission items that explicitly give access to the token but belong to other
    // permission carrying resources, e.g a progam access token
    context.data.permissionItem.deleteManyByQuery(
      PermissionItemQueries.getByResource(token.workspaceId, token.resourceId, AppResourceType.ClientAssignedToken)
    ),

    // Delete all assigned items
    deleteResourceAssignedItems(context, token.workspaceId, token.resourceId, AppResourceType.ClientAssignedToken),

    // Delete client token
    context.data.clientAssignedToken.deleteOneByQuery(EndpointReusableQueries.getById(token.resourceId)),
  ]);
};

export default deleteClientAssignedToken;
