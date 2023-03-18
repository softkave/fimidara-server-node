import {Model} from 'mongoose';
import {IResource} from '../definitions/system';

export interface IAppMongoModels {
  resource: Model<IResource>;
}
