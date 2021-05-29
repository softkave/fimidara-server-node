import {Connection} from 'mongoose';
import singletonFunc from '../../../utilities/singletonFunc';
import BaseContext from '../../BaseContext';
import RequestData from '../../RequestData';
import {getSendEmailVerificationCodeContext} from '../sendEmailVerificationCode/context';
import sendEmailVerificationCode from '../sendEmailVerificationCode/handler';
import {ISignupContext} from './types';

export default class SignupContext
    extends BaseContext
    implements ISignupContext {
    public async sendEmailVerificationCode(instData: RequestData) {
        return sendEmailVerificationCode(
            getSendEmailVerificationCodeContext(this.dbConnection),
            instData
        );
    }
}

export const getSignupContext = singletonFunc(
    (connection: Connection) => new SignupContext(connection)
);
