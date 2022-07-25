import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {populateResourceListWithAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {PermissionDeniedError} from '../../user/errors';
import {checkWorkspaceExists} from '../../workspaces/utils';
import ProgramAccessTokenQueries from '../queries';
import {getPublicProgramToken} from '../utils';
import {GetWorkspaceProgramAccessTokenEndpoint} from './types';
import {getWorkspaceProgramAccessTokenJoiSchema} from './validation';

const getWorkspaceProgramAccessTokens: GetWorkspaceProgramAccessTokenEndpoint =
  async (context, instData) => {
    const data = validate(
      instData.data,
      getWorkspaceProgramAccessTokenJoiSchema
    );

    const agent = await context.session.getAgent(context, instData);
    const workspaceId = getWorkspaceId(agent, data.workspaceId);
    const workspace = await checkWorkspaceExists(context, workspaceId);
    const tokens = await context.data.programAccessToken.getManyItems(
      ProgramAccessTokenQueries.getByWorkspaceId(workspaceId)
    );

    // TODO: can we do this together, so that we don't waste compute
    const permittedReads = await Promise.all(
      tokens.map(item =>
        checkAuthorization({
          context,
          agent,
          workspace,
          resource: item,
          type: AppResourceType.ProgramAccessToken,
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

    allowedTokens =
      await populateResourceListWithAssignedPermissionGroupsAndTags(
        context,
        workspace.resourceId,
        allowedTokens,
        AppResourceType.ProgramAccessToken
      );

    return {
      tokens: allowedTokens.map(token => getPublicProgramToken(context, token)),
    };
  };

export default getWorkspaceProgramAccessTokens;
