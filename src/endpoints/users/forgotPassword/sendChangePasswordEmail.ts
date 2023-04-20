import {
  forgotPasswordEmailHTML,
  forgotPasswordEmailText,
  forgotPasswordEmailTitle,
} from '../../../emailTemplates/forgotPassword';
import {BaseContext} from '../../contexts/types';

export interface SendChangePasswordEmailParams {
  emailAddress: string;
  link: string;
  expiration: Date;
}

async function sendChangePasswordEmail(ctx: BaseContext, props: SendChangePasswordEmailParams) {
  const html = forgotPasswordEmailHTML(props);
  const text = forgotPasswordEmailText(props);
  await ctx.email.sendEmail(ctx, {
    subject: forgotPasswordEmailTitle,
    body: {html, text},
    destination: [props.emailAddress],
    source: ctx.appVariables.appDefaultEmailAddressFrom,
  });
}

export default sendChangePasswordEmail;
