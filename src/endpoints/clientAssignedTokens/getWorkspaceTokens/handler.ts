import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {resourceListWithAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkWorkspaceExists} from '../../workspaces/utils';
import EndpointReusableQueries from '../../queries';
import {PermissionDeniedError} from '../../user/errors';
import {getPublicClientToken} from '../utils';
import {GetWorkspaceClientAssignedTokenEndpoint} from './types';
import {getWorkspaceClientAssignedTokenJoiSchema} from './validation';
import {getWorkspaceId} from '../../contexts/SessionContext';

const getWorkspaceClientAssignedTokens: GetWorkspaceClientAssignedTokenEndpoint =
  async (context, instData) => {
    const data = validate(
      instData.data,
      getWorkspaceClientAssignedTokenJoiSchema
    );

    const agent = await context.session.getAgent(context, instData);
    const workspaceId = getWorkspaceId(agent, data.workspaceId);
    const workspace = await checkWorkspaceExists(context, workspaceId);
    const tokens = await context.data.clientAssignedToken.getManyItems(
      EndpointReusableQueries.getByWorkspaceId(workspaceId)
    );

    // TODO: can we do this together, so that we don't waste compute
    const permittedReads = await Promise.all(
      tokens.map(item =>
        checkAuthorization({
          context,
          agent,
          workspace,
          resource: item,
          type: AppResourceType.ClientAssignedToken,
          permissionOwners: makeWorkspacePermissionOwnerList(
            workspace.resourceId
          ),
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
      workspace.resourceId,
      allowedTokens,
      AppResourceType.ClientAssignedToken
    );

    return {
      tokens: allowedTokens.map(token => getPublicClientToken(context, token)),
    };
  };

export default getWorkspaceClientAssignedTokens;
