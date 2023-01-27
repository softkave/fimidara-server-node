import {IClientAssignedToken} from '../../../../definitions/clientAssignedToken';
import {throwClientAssignedTokenNotFound} from '../../../clientAssignedTokens/utils';
import {BaseMongoDataProvider} from '../utils';
import {IClientAssignedTokenDataProvider} from './type';

export class ClientAssignedTokenMongoDataProvider
  extends BaseMongoDataProvider<IClientAssignedToken>
  implements IClientAssignedTokenDataProvider
{
  throwNotFound = throwClientAssignedTokenNotFound;
}
