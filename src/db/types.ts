import {AppRuntimeStateModel} from './appRuntimeState';
import {JobModel} from './job';
import {ResourceModel} from './resource';

export interface AppMongoModels {
  resource: ResourceModel;
  job: JobModel;
  appRuntimeState: AppRuntimeStateModel;
}
