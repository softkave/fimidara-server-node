import {
  confirmEmailAddressEmailHTML,
  confirmEmailAddressEmailText,
  confirmEmailAddressEmailTitle,
  IConfirmEmailAddressEmailProps,
} from '../../../emailTemplates/confirmEmailAddress';
import {IBaseContext} from '../../contexts/types';

export interface ISendConfirmEmailAddressEmailParams extends IConfirmEmailAddressEmailProps {
  emailAddress: string;
}

async function sendConfirmEmailAddressEmail(
  ctx: IBaseContext,
  props: ISendConfirmEmailAddressEmailParams
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
