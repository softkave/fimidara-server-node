import {ICollaborationRequest} from '../../../../definitions/collaborationRequest';
import {BaseMongoDataProvider} from '../utils';
import {ICollaborationRequestDataProvider} from './type';

export class CollaborationRequestMongoDataProvider
  extends BaseMongoDataProvider<ICollaborationRequest>
  implements ICollaborationRequestDataProvider {}
