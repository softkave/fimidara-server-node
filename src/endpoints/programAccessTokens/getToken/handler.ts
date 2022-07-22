import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {withAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {getProgramAccessTokenId} from '../../contexts/SessionContext';
import {
  checkProgramAccessTokenAuthorization02,
  getPublicProgramToken,
} from '../utils';
import {GetProgramAccessTokenEndpoint} from './types';
import {getProgramAccessTokenJoiSchema} from './validation';

const getProgramAccessToken: GetProgramAccessTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const tokenId = getProgramAccessTokenId(
    agent,
    data.tokenId,
    data.onReferenced
  );

  let {token} = await checkProgramAccessTokenAuthorization02(
    context,
    agent,
    tokenId,
    BasicCRUDActions.Read
  );

  token = await withAssignedPermissionGroupsAndTags(
    context,
    token.workspaceId,
    token,
    AppResourceType.ProgramAccessToken
  );

  return {
    token: getPublicProgramToken(context, token),
  };
};

export default getProgramAccessToken;
