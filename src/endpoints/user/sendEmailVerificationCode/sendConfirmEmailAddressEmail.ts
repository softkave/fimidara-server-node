import {appVariables} from '../../../resources/appVariables';
import {
    confirmEmailAddressEmailHTML,
    confirmEmailAddressEmailText,
    confirmEmailAddressEmailTitle,
    IConfirmEmailAddressEmailProps,
} from '../../../email/confirmEmailAddress';
import {IBaseContext} from '../../contexts/BaseContext';

export interface ISendConfirmEmailAddressEmailParams
    extends IConfirmEmailAddressEmailProps {
    emailAddress: string;
}

async function sendConfirmEmailAddressEmail(
    ctx: IBaseContext,
    props: ISendConfirmEmailAddressEmailParams
) {
    const htmlContent = confirmEmailAddressEmailHTML(props);
    const textContent = confirmEmailAddressEmailText(props);

    const result = await ctx.ses
        .sendEmail({
            Destination: {
                ToAddresses: [props.emailAddress],
            },
            Source: appVariables.emailSenderId,
            Message: {
                Subject: {
                    Charset: appVariables.awsEmailEncoding,
                    Data: confirmEmailAddressEmailTitle,
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

export default sendConfirmEmailAddressEmail;
