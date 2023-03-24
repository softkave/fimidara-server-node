import {IAppRuntimeStateModel} from './appRuntimeState';
import {IJobModel} from './job';
import {IResourceModel} from './resource';

export interface IAppMongoModels {
  resource: IResourceModel;
  job: IJobModel;
  appRuntimeState: IAppRuntimeStateModel;
}
