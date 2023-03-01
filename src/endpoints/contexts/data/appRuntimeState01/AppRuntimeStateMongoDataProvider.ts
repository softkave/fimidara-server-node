import {IAppRuntimeState} from '../../../../definitions/system';
import {throwAppRuntimeStateFound} from '../../../runtime/utils';
import {BaseMongoDataProvider} from '../utils';
import {IAppRuntimeStateDataProvider} from './type';

export class AppRuntimeStateMongoDataProvider
  extends BaseMongoDataProvider<IAppRuntimeState>
  implements IAppRuntimeStateDataProvider
{
  throwNotFound = throwAppRuntimeStateFound;
}
