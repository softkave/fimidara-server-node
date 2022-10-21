import {IAppRuntimeState} from '../../../../definitions/system';
import {BaseMongoDataProvider} from '../utils';
import {IAppRuntimeStateDataProvider} from './type';

export class AppRuntimeStateMongoDataProvider
  extends BaseMongoDataProvider<IAppRuntimeState>
  implements IAppRuntimeStateDataProvider {}
