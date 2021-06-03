import {Connection} from 'mongoose';
import singletonFunc from '../../../utilities/singletonFunc';
import BaseContext, {IBaseContext} from '../../contexts/BaseContext';
import sendChangePasswordEmail, {
    ISendChangePasswordEmailParams,
} from './sendChangePasswordEmail';
import {IForgotPasswordContext} from './types';

export default class ForgotPasswordContext
    extends BaseContext
    implements IForgotPasswordContext {
    public async sendChangePasswordEmail(
        ctx: IBaseContext,
        props: ISendChangePasswordEmailParams
    ) {
        await sendChangePasswordEmail(ctx, props);
    }
}

export const getForgotPasswordContext = singletonFunc(
    (connection: Connection) => new ForgotPasswordContext(connection)
);
