import {IUser} from '../../../../definitions/user';
import {BaseMongoDataProvider} from '../utils';
import {IUserDataProvider} from './type';

export class UserMongoDataProvider
  extends BaseMongoDataProvider<IUser>
  implements IUserDataProvider {}
