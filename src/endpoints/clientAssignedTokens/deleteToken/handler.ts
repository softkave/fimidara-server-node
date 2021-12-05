import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {getClientAssignedTokenId} from '../../contexts/SessionContext';
import PermissionItemQueries from '../../permissionItems/queries';
import ClientAssignedTokenQueries from '../queries';
import {checkClientAssignedTokenAuthorization02} from '../utils';
import {DeleteClientAssignedTokenEndpoint} from './types';
import {deleteClientAssignedTokenJoiSchema} from './validation';

const deleteClientAssignedToken: DeleteClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deleteClientAssignedTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const tokenId = getClientAssignedTokenId(
    agent,
    data.onReferenced && data.tokenId
  );

  const {token} = await checkClientAssignedTokenAuthorization02(
    context,
    agent,
    tokenId,
    BasicCRUDActions.Delete
  );

  await context.data.clientAssignedToken.deleteItem(
    ClientAssignedTokenQueries.getById(token.tokenId)
  );

  await context.data.permissionItem.deleteManyItems(
    PermissionItemQueries.getByPermissionEntity(
      token.tokenId,
      AppResourceType.ClientAssignedToken
    )
  );

  // TODO: delete permissionItems by resourceId and type
};

export default deleteClientAssignedToken;
