import {Model} from 'mongoose';
import {IResourceBase} from '../definitions/system';

export interface IAppMongoModels {
  resource: Model<IResourceBase>;
}
