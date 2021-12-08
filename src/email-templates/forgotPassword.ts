import {
  getFooterHTML,
  getHeaderHTML,
  getHeaderText,
  getEmailTemplateStyles,
} from './helpers';
import {format, formatDistance} from 'date-fns';

export const forgotPasswordEmailTitle = 'Change Your Password';

export interface IForgotPasswordEmailProps {
  link: string;
  expiration: Date;
}

export function forgotPasswordEmailHTML(
  props: IForgotPasswordEmailProps
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>${getHeaderText(forgotPasswordEmailTitle)}</title>
        <style>
        ${getEmailTemplateStyles()}
        </style>
    </head>
    <body>
        ${getHeaderHTML(forgotPasswordEmailTitle)}
        <div class="email-body">
            <div class="email-content-center">
                <p>
                    To change your password,
                    <a href="${props.link}">Click here</a>
                </p>
                <p>- OR -</p>
                <p>
                    Copy the following link, and visit in your browser :-<br />
                    <a href="${props.link}">${props.link}</a>
                </p>
                <p>
                    <strong>
                        This link expires in ${formatDistance(
                          props.expiration,
                          new Date()
                        )}, on ${format(props.expiration, 'MM/DD/YYYY hh:mmA')}
                    </strong>
                </p>
                <p>
                    If you did not request a change of password, please ignore this
                    mail.
                    <br />
                    Also, do not share this link with anybody, as they'll be able to
                    change your password with it.
                </p>
            </div>
        </div>
        ${getFooterHTML()}
    </body>
    </html>
  `;
}

export function forgotPasswordEmailText(
  props: IForgotPasswordEmailProps
): string {
  const text = `
    ${getHeaderText(forgotPasswordEmailTitle)}

    To change your password, copy the following link, and visit in your browser - ${
      props.link
    }

    This link expires:
    - Immediately after you change your password -OR-
    - In ${formatDistance(props.expiration, new Date())}, on ${format(
    props.expiration,
    'MM/DD/YYYY hh:mmA'
  )}

    If you did not request a change of password, please ignore this mail.
    Also, do not share this link with anybody, as they'll be able to change your password with it.
    `;

  return text;
}
