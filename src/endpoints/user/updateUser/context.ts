import {Connection} from 'mongoose';
import singletonFunc from '../../../utilities/singletonFunc';
import BaseContext from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {getSendEmailVerificationCodeContext} from '../sendEmailVerificationCode/context';
import sendEmailVerificationCode from '../sendEmailVerificationCode/handler';
import {IUpdateUserEndpointContext} from './types';

export default class UpdateUserEndpointContext
  extends BaseContext
  implements IUpdateUserEndpointContext {
  public async sendEmailVerificationCode(instData: RequestData) {
    return sendEmailVerificationCode(
      getSendEmailVerificationCodeContext(this.dbConnection),
      instData
    );
  }
}

export const getUpdateUserEndpointContext = singletonFunc(
  (connection: Connection) => new UpdateUserEndpointContext(connection)
);
