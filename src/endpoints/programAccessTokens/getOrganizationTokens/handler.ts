import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {resourceListWithAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';
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

    let allowedTokens = tokens.filter((item, i) => !!permittedReads[i]);

    if (allowedTokens.length === 0 && tokens.length > 0) {
      throw new PermissionDeniedError();
    }

    allowedTokens = await resourceListWithAssignedPresetsAndTags(
      context,
      organization.resourceId,
      allowedTokens,
      AppResourceType.ProgramAccessToken
    );

    return {
      tokens: allowedTokens.map(token => getPublicProgramToken(context, token)),
    };
  };

export default getOrganizationProgramAccessTokens;
