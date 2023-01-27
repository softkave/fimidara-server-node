import {ICollaborationRequest} from '../../../../definitions/collaborationRequest';
import {throwCollaborationRequestNotFound} from '../../../collaborationRequests/utils';
import {BaseMongoDataProvider} from '../utils';
import {ICollaborationRequestDataProvider} from './type';

export class CollaborationRequestMongoDataProvider
  extends BaseMongoDataProvider<ICollaborationRequest>
  implements ICollaborationRequestDataProvider
{
  throwNotFound = throwCollaborationRequestNotFound;
}
