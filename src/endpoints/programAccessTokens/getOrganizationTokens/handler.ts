import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeBasePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import ProgramAccessTokenQueries from '../queries';
import {ProgramAccessTokenUtils} from '../utils';
import {GetOrganizationProgramAccessTokenEndpoint} from './types';
import {getOrganizationProgramAccessTokenJoiSchema} from './validation';

const getOrganizationProgramAccessTokens: GetOrganizationProgramAccessTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(
    instData.data,
    getOrganizationProgramAccessTokenJoiSchema
  );

  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExists(
    context,
    data.organizationId
  );

  const tokens = await context.data.programAccessToken.getManyItems(
    ProgramAccessTokenQueries.getByOrganizationId(data.organizationId)
  );

  // TODO: can we do this together, so that we don't waste compute
  const permittedReads = await Promise.all(
    tokens.map(item =>
      checkAuthorization(
        context,
        agent,
        organization.organizationId,
        item.tokenId,
        AppResourceType.ProgramAccessToken,
        makeBasePermissionOwnerList(organization.organizationId),
        BasicCRUDActions.Read
      )
    )
  );

  const allowedTokens = tokens.filter((item, i) => !!permittedReads[i]);

  return {
    tokens: ProgramAccessTokenUtils.extractPublicTokenList(allowedTokens),
  };
};

export default getOrganizationProgramAccessTokens;