import * as argon2 from 'argon2';
import {AppResourceType} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from '../login/utils';
import {assertUser} from '../utils';
import {ChangePasswordEndpoint} from './types';
import {changePasswordJoiSchema} from './validation';

const changePassword: ChangePasswordEndpoint = async (context, instData) => {
  const result = validate(instData.data, changePasswordJoiSchema);
  const agent = await context.session.getAgent(context, instData, AppResourceType.User);
  const hash = await argon2.hash(result.password);
  const updatedUser = await context.semantic.user.getAndUpdateOneById(agent.agentId, {
    hash,
    passwordLastChangedAt: getTimestamp(),
  });
  assertUser(updatedUser);
  const completeUserData = await populateUserWorkspaces(context, updatedUser);

  // Delete user token and incomingTokenData since they are no longer valid
  delete instData.agent?.agentToken;
  delete instData.incomingTokenData;

  // Delete existing user tokens cause they're no longer valid
  await context.semantic.agentToken.deleteAgentTokens(completeUserData.resourceId);
  const [userToken, clientAssignedToken] = await Promise.all([
    getUserToken(context, agent.agentId),
    getUserClientAssignedToken(context, agent.agentId),
  ]);
  instData.user = completeUserData;
  return toLoginResult(context, completeUserData, userToken, clientAssignedToken);
};

export default changePassword;
