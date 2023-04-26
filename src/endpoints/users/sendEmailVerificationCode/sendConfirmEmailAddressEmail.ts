import {
  ConfirmEmailAddressEmailProps,
  confirmEmailAddressEmailHTML,
  confirmEmailAddressEmailText,
  confirmEmailAddressEmailTitle,
} from '../../../emailTemplates/confirmEmailAddress';
import {BaseContextType} from '../../contexts/types';

export interface SendConfirmEmailAddressEmailParams extends ConfirmEmailAddressEmailProps {
  emailAddress: string;
}

async function sendConfirmEmailAddressEmail(
  ctx: BaseContextType,
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
