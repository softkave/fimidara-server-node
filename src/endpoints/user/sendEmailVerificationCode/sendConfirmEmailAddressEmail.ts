import {
  ConfirmEmailAddressEmailProps,
  confirmEmailAddressEmailHTML,
  confirmEmailAddressEmailText,
  confirmEmailAddressEmailTitle,
} from '../../../emailTemplates/confirmEmailAddress';
import {BaseContext} from '../../contexts/types';

export interface SendConfirmEmailAddressEmailParams extends ConfirmEmailAddressEmailProps {
  emailAddress: string;
}

async function sendConfirmEmailAddressEmail(
  ctx: BaseContext,
  props: SendConfirmEmailAddressEmailParams
) {
  const html = confirmEmailAddressEmailHTML(props);
  const text = confirmEmailAddressEmailText(props);
  await ctx.email.sendEmail(ctx, {
    subject: confirmEmailAddressEmailTitle,
    body: {html, text},
    destination: [props.emailAddress],
    source: ctx.appVariables.appDefaultEmailAddressFrom,
  });
}

export default sendConfirmEmailAddressEmail;
