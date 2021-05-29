import {Connection} from 'mongoose';
import {ServerError} from '../../../utilities/errors';
import singletonFunc from '../../../utilities/singletonFunc';
import BaseContext, {IBaseContext} from '../../BaseContext';
import {ISendPhoneVerificationCodeEndpointContext} from './types';

export default class SendPhoneVerificationCodeEndpointContext
    extends BaseContext
    implements ISendPhoneVerificationCodeEndpointContext {
    public async sendCode(context: IBaseContext, phone: string) {
        try {
            const result = await context.twilio.verify
                .services(context.appVariables.twilioVerificationServiceSID)
                .verifications.create({to: phone, channel: 'sms'});

            return result.sid;
        } catch (error) {
            console.error(error);
            throw new ServerError();
        }
    }
}

export const getSendPhoneVerificationCodeContext = singletonFunc(
    (connection: Connection) =>
        new SendPhoneVerificationCodeEndpointContext(connection)
);
