import {appVariables} from '../../../resources/appVariables';
import {
    forgotPasswordEmailHTML,
    forgotPasswordEmailTitle,
} from '../../../email/forgotPasswordEmail';
import {IBaseContext} from '../../BaseContext';

export interface ISendChangePasswordEmailParams {
    emailAddress: string;
    link: string;
    expiration: Date;
}

async function sendChangePasswordEmail(
    ctx: IBaseContext,
    props: ISendChangePasswordEmailParams
) {
    const {emailAddress} = props;
    const htmlContent = forgotPasswordEmailHTML(props);
    const textContent = forgotPasswordEmailHTML(props);

    const result = await ctx.ses
        .sendEmail({
            Destination: {
                ToAddresses: [emailAddress],
            },
            Source: appVariables.emailSenderId,
            Message: {
                Subject: {
                    Charset: appVariables.awsEmailEncoding,
                    Data: forgotPasswordEmailTitle,
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

    return result;
}

export default sendChangePasswordEmail;
