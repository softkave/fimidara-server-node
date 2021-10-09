import {Connection} from 'mongoose';
import singletonFunc from '../../../utilities/singletonFunc';
import BaseContext, {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import changePassword from '../changePassword/changePassword';
import {IChangePasswordWithCurrentPasswordContext} from './types';

export default class ChangePasswordWithCurrentPasswordContext
  extends BaseContext
  implements IChangePasswordWithCurrentPasswordContext {
  public async changePassword(
    context: IBaseContext,
    instData: RequestData,
    password: string
  ) {
    return changePassword(
      context,
      new RequestData({
        ...instData,
        data: {
          password: password,
        },
      })
    );
  }
}

export const getChangePasswordWithCurrentPasswordContext = singletonFunc(
  (connection: Connection) =>
    new ChangePasswordWithCurrentPasswordContext(connection)
);
