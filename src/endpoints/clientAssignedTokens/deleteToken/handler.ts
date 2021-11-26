import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {checkAuthorizationForClientAssignedToken} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import PermissionItemQueries from '../../permissionItems/queries';
import ClientAssignedTokenQueries from '../queries';
import {DeleteClientAssignedTokenEndpoint} from './types';
import {deleteClientAssignedTokenJoiSchema} from './validation';

const deleteClientAssignedToken: DeleteClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deleteClientAssignedTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const token = await context.data.clientAssignedToken.assertGetItem(
    ClientAssignedTokenQueries.getById(data.tokenId)
  );

  const organization = await checkOrganizationExists(
    context,
    token.organizationId
  );

  await checkAuthorizationForClientAssignedToken(
    context,
    agent,
    organization.organizationId,
    token,
    BasicCRUDActions.Delete
  );

  await context.data.clientAssignedToken.deleteItem(
    ClientAssignedTokenQueries.getById(data.tokenId)
  );

  await context.data.permissionItem.deleteManyItems(
    PermissionItemQueries.getByPermissionEntity(
      token.tokenId,
      AppResourceType.ClientAssignedToken
    )
  );
};

export default deleteClientAssignedToken;
