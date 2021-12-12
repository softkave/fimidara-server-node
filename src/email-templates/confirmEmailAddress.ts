import {
  emailTemplateConstants,
  emailTemplateStyles,
  getFooterHTML,
  getHeaderHTML,
  getHeaderText,
} from './helpers';

export const confirmEmailAddressEmailTitle = 'Confirm Your Email Address';

export interface IConfirmEmailAddressEmailProps {
  firstName: string;
  link: string;
}

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
        <style>${emailTemplateStyles}</style>
        <style>
        .${emailTemplateConstants.classNamePrefix}-app-verify-code {
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
                    Hi ${props.firstName}, follow this 
                    <a href=${props.link}>link</a> to verify your email address.
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
    -
    Hi ${props.firstName}, visit this link to verify your email address:
    ${props.link} 
    `;

  return text;
}
