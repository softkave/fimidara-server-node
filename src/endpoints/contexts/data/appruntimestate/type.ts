import {IAppRuntimeState} from '../../../../definitions/system';
import {DataQuery, IBaseDataProvider} from '../types';

export type IAppRuntimeStateQuery = DataQuery<IAppRuntimeState>;
export type IAppRuntimeStateDataProvider = IBaseDataProvider<IAppRuntimeState>;
