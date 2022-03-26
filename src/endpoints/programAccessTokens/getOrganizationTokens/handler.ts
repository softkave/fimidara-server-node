import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import {PermissionDeniedError} from '../../user/errors';
import ProgramAccessTokenQueries from '../queries';
import {getPublicProgramToken} from '../utils';
import {GetOrganizationProgramAccessTokenEndpoint} from './types';
import {getOrganizationProgramAccessTokenJoiSchema} from './validation';

/**
 * getOrganizationProgramAccessTokens.
 * Returns the referenced organization's program access tokens
 * the calling agent has read access to.
 *
 * Ensure that:
 * - Auth check and permission check
 * - Return tokens
 */

const getOrganizationProgramAccessTokens: GetOrganizationProgramAccessTokenEndpoint =
  async (context, instData) => {
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
        checkAuthorization({
          context,
          agent,
          organization,
          resource: item,
          type: AppResourceType.ProgramAccessToken,
          permissionOwners: makeOrgPermissionOwnerList(organization.resourceId),
          action: BasicCRUDActions.Read,
          nothrow: true,
        })
      )
    );

    const allowedTokens = tokens
      .filter((item, i) => !!permittedReads[i])
      .map(token => getPublicProgramToken(context, token));

    if (allowedTokens.length === 0 && tokens.length > 0) {
      throw new PermissionDeniedError();
    }

    return {
      tokens: allowedTokens,
    };
  };

export default getOrganizationProgramAccessTokens;
