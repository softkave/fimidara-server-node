import {
  forgotPasswordEmailHTML,
  forgotPasswordEmailText,
  forgotPasswordEmailTitle,
} from '../../../email-templates/forgotPassword';
import {IBaseContext} from '../../contexts/BaseContext';

export interface ISendChangePasswordEmailParams {
  emailAddress: string;
  link: string;
  expiration: Date;
}

async function sendChangePasswordEmail(
  ctx: IBaseContext,
  props: ISendChangePasswordEmailParams
) {
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
