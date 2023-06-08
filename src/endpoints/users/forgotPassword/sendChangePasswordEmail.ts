import {
  ForgotPasswordEmailProps,
  forgotPasswordEmailHTML,
  forgotPasswordEmailText,
  forgotPasswordEmailTitle,
} from '../../../emailTemplates/forgotPassword';
import {BaseContextType} from '../../contexts/types';

async function sendChangePasswordEmail(
  ctx: BaseContextType,
  emailAddress: string,
  props: ForgotPasswordEmailProps
) {
  const html = forgotPasswordEmailHTML(props);
  const text = forgotPasswordEmailText(props);
  await ctx.email.sendEmail(ctx, {
    subject: forgotPasswordEmailTitle,
    body: {html, text},
    destination: [emailAddress],
    source: ctx.appVariables.appDefaultEmailAddressFrom,
  });
}

export default sendChangePasswordEmail;
