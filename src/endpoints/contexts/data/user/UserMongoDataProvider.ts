import {IUser} from '../../../../definitions/user';
import {throwUserNotFound} from '../../../user/utils';
import {BaseMongoDataProvider} from '../utils';
import {IUserDataProvider} from './type';

export class UserMongoDataProvider extends BaseMongoDataProvider<IUser> implements IUserDataProvider {
  throwNotFound = throwUserNotFound;
}
