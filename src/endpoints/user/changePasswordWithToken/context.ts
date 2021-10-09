import {Connection} from 'mongoose';
import singletonFunc from '../../../utilities/singletonFunc';
import BaseContext, {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import changePassword from '../changePassword/changePassword';
import {IChangePasswordParameters} from '../changePassword/types';
import {IChangePasswordWithTokenContext} from './types';

export default class ChangePasswordWithTokenContext
  extends BaseContext
  implements IChangePasswordWithTokenContext {
  public async changePassword(
    context: IBaseContext,
    instData: RequestData<IChangePasswordParameters>
  ) {
    return await changePassword(context, instData);
  }
}

export const getChangePasswordWithTokenContext = singletonFunc(
  (connection: Connection) => new ChangePasswordWithTokenContext(connection)
);
