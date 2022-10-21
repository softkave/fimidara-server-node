import {IUserToken} from '../../../../definitions/userToken';
import {BaseMongoDataProvider} from '../utils';
import {IUserTokenDataProvider} from './type';

export class UserTokenMongoDataProvider
  extends BaseMongoDataProvider<IUserToken>
  implements IUserTokenDataProvider {}
