import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {checkAuthorizatonForClientAssignedToken} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import ClientAssignedTokenQueries from '../queries';
import {ClientAssignedTokenUtils} from '../utils';
import {GetOrganizationClientAssignedTokenEndpoint} from './types';
import {getOrganizationClientAssignedTokenJoiSchema} from './validation';

const getOrganizationTokens: GetOrganizationClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(
    instData.data,
    getOrganizationClientAssignedTokenJoiSchema
  );

  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExists(
    context,
    data.organizationId
  );

  const tokens = await context.data.clientAssignedToken.getManyItems(
    ClientAssignedTokenQueries.getByOrganizationId(data.organizationId)
  );

  // TODO: can we do this together, so that we don't waste compute
  const permittedReads = await Promise.all(
    tokens.map(item =>
      checkAuthorizatonForClientAssignedToken(
        context,
        agent,
        organization.organizationId,
        item,
        BasicCRUDActions.Read
      )
    )
  );

  const allowedTokens = tokens.filter((item, i) => !!permittedReads[i]);

  return {
    tokens: ClientAssignedTokenUtils.extractPublicTokenList(allowedTokens),
  };
};

export default getOrganizationTokens;