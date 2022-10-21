import {IClientAssignedToken} from '../../../../definitions/clientAssignedToken';
import {BaseMongoDataProvider} from '../utils';
import {IClientAssignedTokenDataProvider} from './type';

export class ClientAssignedTokenMongoDataProvider
  extends BaseMongoDataProvider<IClientAssignedToken>
  implements IClientAssignedTokenDataProvider {}
