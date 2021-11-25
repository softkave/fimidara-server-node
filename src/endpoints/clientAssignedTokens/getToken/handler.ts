import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {checkAuthorizatonForClientAssignedToken} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import ClientAssignedTokenQueries from '../queries';
import {ClientAssignedTokenUtils} from '../utils';
import {GetClientAssignedTokenEndpoint} from './types';
import {getClientAssignedTokenJoiSchema} from './validation';

const getClientAssignedToken: GetClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getClientAssignedTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const token = await context.data.clientAssignedToken.assertGetItem(
    ClientAssignedTokenQueries.getById(data.tokenId)
  );

  const organization = await checkOrganizationExists(
    context,
    token.organizationId
  );

  await checkAuthorizatonForClientAssignedToken(
    context,
    agent,
    organization.organizationId,
    token,
    BasicCRUDActions.Read
  );

  return {
    token: ClientAssignedTokenUtils.extractPublicToken(token),
  };
};

export default getClientAssignedToken;
