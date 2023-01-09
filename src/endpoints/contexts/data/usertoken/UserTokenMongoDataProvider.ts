import {IUserToken} from '../../../../definitions/userToken';
import {throwUserTokenNotFound} from '../../../user/utils';
import {BaseMongoDataProvider} from '../utils';
import {IUserTokenDataProvider} from './type';

export class UserTokenMongoDataProvider extends BaseMongoDataProvider<IUserToken> implements IUserTokenDataProvider {
  throwNotFound = throwUserTokenNotFound;
}
