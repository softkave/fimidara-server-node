import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import EndpointReusableQueries from '../../queries';
import {PermissionDeniedError} from '../../user/errors';
import {getPublicClientToken} from '../utils';
import {GetOrganizationClientAssignedTokenEndpoint} from './types';
import {getOrganizationClientAssignedTokenJoiSchema} from './validation';

/**
 * getOrganizationTokens.
 * Returns a list of read-permissible client assigned tokens the agent
 * has access to.
 *
 * Ensure that:
 * - Auth check
 * - Return a list of tokens the agent has access to.
 */

const getOrganizationClientAssignedTokens: GetOrganizationClientAssignedTokenEndpoint =
  async (context, instData) => {
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
      EndpointReusableQueries.getByOrganizationId(data.organizationId)
    );

    // TODO: can we do this together, so that we don't waste compute
    const permittedReads = await Promise.all(
      tokens.map(item =>
        checkAuthorization({
          context,
          agent,
          organization,
          resource: item,
          type: AppResourceType.ClientAssignedToken,
          permissionOwners: makeOrgPermissionOwnerList(organization.resourceId),
          action: BasicCRUDActions.Read,
          nothrow: true,
        })
      )
    );

    const allowedTokens = tokens
      .filter((item, i) => !!permittedReads[i])
      .map(token => getPublicClientToken(context, token));

    if (allowedTokens.length === 0 && tokens.length > 0) {
      throw new PermissionDeniedError();
    }

    return {
      tokens: allowedTokens,
    };
  };

export default getOrganizationClientAssignedTokens;
