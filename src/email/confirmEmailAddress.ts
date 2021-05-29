import {
    getFooterHTML,
    getHeaderHTML,
    getHeaderText,
    getTemplateCSS,
} from './helpers';
import {appVariables} from '../resources/appVariables';

export const confirmEmailAddressEmailTitle = 'Confirm Your Email Address';

export interface IConfirmEmailAddressEmailProps {
    code: string;
    firstName: string;
}

// TODO: use better wordings
// TODO: better design
// TODO: show time code expires?

export function confirmEmailAddressEmailHTML(
    props: IConfirmEmailAddressEmailProps
): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>${getHeaderText(confirmEmailAddressEmailTitle)}</title>
        <style>
        ${getTemplateCSS()}

        .shop-code {
            text-align: center;
            font-size: 24px;
            margin: 24px 0px;
        }
        </style>
    </head>
    <body>
        ${getHeaderHTML(confirmEmailAddressEmailTitle)}
        <div class="email-body">
            <div class="email-content-center">
                <p>
                    Hi ${props.firstName}, thank you for 
                    signing up at ${
                        appVariables.appName
                    }. Enter this code in the Shops website to confirm your email address
                </p>
                <div class="shop-code">${props.code}</div>
                <p>
                    If you did not signup on ${
                        appVariables.appName
                    }, please ignore this mail.
                </p>
            </div>
        </div>
        ${getFooterHTML()}
    </body>
    </html>
  `;
}

export function confirmEmailAddressEmailText(
    props: IConfirmEmailAddressEmailProps
): string {
    const text = `
    ${getHeaderText(confirmEmailAddressEmailTitle)}

    Hi ${props.firstName}, thank you for signing up at ${appVariables.appName}.
    Enter this code in the website to verify your email address - ${props.code}

    If you did not signup on ${appVariables.appName}, please ignore this mail.
    `;

    return text;
}
