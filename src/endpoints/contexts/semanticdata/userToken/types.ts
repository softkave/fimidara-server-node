import {TokenFor} from '../../../../definitions/system';
import {IUserToken} from '../../../../definitions/userToken';
import {ISemanticDataAccessBaseProvider} from '../types';

export interface ISemanticDataAccessUserTokenProvider
  extends ISemanticDataAccessBaseProvider<IUserToken> {
  getOneByUserId(userId: string, tokenFor?: TokenFor | TokenFor[]): Promise<IUserToken | null>;
  deleteUserExistingTokens(userId: string, tokenFor?: TokenFor | TokenFor[]): Promise<void>;
}
