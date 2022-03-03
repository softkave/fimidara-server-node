import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import PermissionItemQueries from '../../permissionItems/queries';
import EndpointReusableQueries from '../../queries';
import {checkClientAssignedTokenAuthorization03} from '../utils';
import {DeleteClientAssignedTokenEndpoint} from './types';
import {deleteClientAssignedTokenJoiSchema} from './validation';

/**
 * deleteClientAssignedToken.
 * Deletes a client assigned token and it's artifacts.
 *
 * Ensure that:
 * - Auth check
 * - Delete token and artifacts
 */

const deleteClientAssignedToken: DeleteClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deleteClientAssignedTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {token} = await checkClientAssignedTokenAuthorization03(
    context,
    agent,
    data,
    BasicCRUDActions.Delete
  );

  await waitOnPromises([
    // Delete permission items that belong to the token
    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByPermissionEntity(
        token.resourceId,
        AppResourceType.ClientAssignedToken
      )
    ),

    // Delete permission items that explicitly give access to the token but belong to other
    // permission carrying resources, e.g a progam access token
    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByResource(
        token.resourceId,
        AppResourceType.ClientAssignedToken
      )
    ),

    context.data.clientAssignedToken.deleteItem(
      EndpointReusableQueries.getById(token.resourceId)
    ),
  ]);
};

export default deleteClientAssignedToken;
