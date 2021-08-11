import {Connection} from 'mongoose';
import {ICollaborationRequest} from '../../../definitions/collaborationRequest';
import {
    collaborationRequestEmailHTML,
    collaborationRequestEmailText,
    ICollaborationRequestEmailProps,
} from '../../../email/collaborationRequestEmail';
import {appVariables} from '../../../resources/appVariables';
import {ServerError} from '../../../utilities/errors';
import singletonFunc from '../../../utilities/singletonFunc';
import BaseContext, {IBaseContext} from '../../contexts/BaseContext';
import {ISendRequestsContext} from './types';

export default class SendRequestsEndpointContext
    extends BaseContext
    implements ISendRequestsContext {
    public async sendRequestEmail(
        ctx: IBaseContext,
        request: ICollaborationRequest,
        isRecipientAUser: boolean,
        organizationName: string
    ) {
        try {
            const title = `Collaboration Request from ${organizationName}`;
            const props: ICollaborationRequestEmailProps = {
                isRecipientAUser,
                organizationName,
                title,
                signupLink: ctx.appVariables.clientSignupLink,
                loginLink: ctx.appVariables.clientLoginLink,
            };

            const htmlContent = collaborationRequestEmailHTML(props);
            const textContent = collaborationRequestEmailText(props);

            await ctx.ses
                .sendEmail({
                    Destination: {
                        ToAddresses: [request.recipientEmail],
                    },
                    Source: appVariables.emailSenderId,
                    Message: {
                        Subject: {
                            Charset: appVariables.awsEmailEncoding,
                            Data: title,
                        },
                        Body: {
                            Html: {
                                Charset: appVariables.awsEmailEncoding,
                                Data: htmlContent,
                            },
                            Text: {
                                Charset: appVariables.awsEmailEncoding,
                                Data: textContent,
                            },
                        },
                    },
                })
                .promise();
        } catch (error) {
            console.error(error);
            throw new ServerError();
        }
    }
}

export const getSendRequestsContext = singletonFunc(
    (connection: Connection) => new SendRequestsEndpointContext(connection)
);
