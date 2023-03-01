import {ICollaborationRequest} from '../../../../definitions/collaborationRequest';
import {DataQuery, IBaseDataProvider} from '../types';

export type ICollaborationRequestQuery = DataQuery<ICollaborationRequest>;
export type ICollaborationRequestDataProvider =
  IBaseDataProvider<ICollaborationRequest>;
