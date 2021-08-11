import {Connection} from 'mongoose';
import {ServerError} from '../../../utilities/errors';
import singletonFunc from '../../../utilities/singletonFunc';
import BaseContext, {IBaseContext} from '../../contexts/BaseContext';
import sendConfirmEmailAddressEmail from './sendConfirmEmailAddressEmail';
import {ISendEmailVerificationCodeEndpointContext} from './types';

export default class SendEmailVerificationCodeEndpointContext
    extends BaseContext
    implements ISendEmailVerificationCodeEndpointContext {
    public async sendEmail(
        context: IBaseContext,
        email: string,
        firstName: string,
        link: string
    ) {
        try {
            await sendConfirmEmailAddressEmail(context, {
                firstName,
                link,
                emailAddress: email,
            });
        } catch (error) {
            console.error(error);
            throw new ServerError();
        }
    }
}

export const getSendEmailVerificationCodeContext = singletonFunc(
    (connection: Connection) =>
        new SendEmailVerificationCodeEndpointContext(connection)
);
