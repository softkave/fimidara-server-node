import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {IUser} from '../../../definitions/user';
import {IUserToken} from '../../../definitions/userToken';
import { getDateString } from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {IBaseContext} from '../../contexts/BaseContext';
import {TokenType} from '../../contexts/SessionContext';
import EndpointReusableQueries from '../../queries';
import {userExtractor} from '../utils';
import {ILoginResult} from './types';

export function toLoginResult(
  context: IBaseContext,
  user: IUser,
  token: IUserToken,
  clientAssignedToken: IClientAssignedToken
): ILoginResult {
  return {
    user: userExtractor(user),
    token: context.session.encodeToken(
      context,
      token.resourceId,
      TokenType.UserToken,
      token.expires
    ),
    clientAssignedToken: context.session.encodeToken(
      context,
      clientAssignedToken.resourceId,
      TokenType.ClientAssignedToken,
      token.expires
    ),
  };
}

export async function getUserClientAssignedToken(
  context: IBaseContext,
  userId: string
) {
  let token = await context.data.clientAssignedToken.getItem(
    EndpointReusableQueries.getByProvidedId(
      context.appVariables.filesOrganizationId,
      userId
    )
  );

  if (!token) {
    token = await context.data.clientAssignedToken.saveItem({
      resourceId: getNewId(),
      providedResourceId: userId,
      audience: [TokenAudience.Login],
      issuedAt: getDateString(),
      version: CURRENT_TOKEN_VERSION,


      createdAt: getDateString(),
      createdBy: IAgent;
      lastUpdatedBy?: IAgent;
      lastUpdatedAt?: Date | string;
      organizationId: string;
      // environmentId: string;
      version: number;
      presets: IAssignedPresetPermissionsGroup[];
    
      // not same as iat in token, may be a litte bit behind or after
      // and is a ISO string, where iat is time in seconds
      issuedAt: string;
      expires?: number;
    });
  }
}
