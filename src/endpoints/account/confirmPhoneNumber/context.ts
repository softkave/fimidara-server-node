import {Connection} from 'mongoose';
import {ServerError} from '../../../utilities/errors';
import singletonFunc from '../../../utilities/singletonFunc';
import BaseContext, {IBaseContext} from '../../BaseContext';
import {VerificationFailedError} from '../errors';
import {IConfirmPhoneNumberEndpointContext} from './types';

export default class ConfirmPhoneNumberEndpointContext
    extends BaseContext
    implements IConfirmPhoneNumberEndpointContext {
    public async verifyCode(
        context: IBaseContext,
        phone: string,
        code: string
    ) {
        try {
            const result = await context.twilio.verify
                .services(context.appVariables.twilioVerificationServiceSID)
                .verificationChecks.create({code, to: phone});

            if (result.status !== 'approved') {
                throw new VerificationFailedError();
            }
        } catch (error) {
            console.error(error);
            throw new ServerError();
        }
    }
}

export const getConfirmPhoneNumberContext = singletonFunc(
    (connection: Connection) =>
        new ConfirmPhoneNumberEndpointContext(connection)
);
