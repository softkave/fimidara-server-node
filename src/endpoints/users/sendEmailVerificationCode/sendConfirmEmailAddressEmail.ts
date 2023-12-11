import {
  ConfirmEmailAddressEmailProps,
  confirmEmailAddressEmailHTML,
  confirmEmailAddressEmailText,
  confirmEmailAddressEmailTitle,
} from '../../../emailTemplates/confirmEmailAddress';
import {kUtilsInjectables} from '../../contexts/injectables';

export interface SendConfirmEmailAddressEmailParams
  extends ConfirmEmailAddressEmailProps {
  emailAddress: string;
}

async function sendConfirmEmailAddressEmail(props: SendConfirmEmailAddressEmailParams) {
  const html = confirmEmailAddressEmailHTML(props);
  const text = confirmEmailAddressEmailText(props);
  await kUtilsInjectables.email().sendEmail({
    subject: confirmEmailAddressEmailTitle,
    body: {html, text},
    destination: [props.emailAddress],
    source: kUtilsInjectables.config().appDefaultEmailAddressFrom,
  });
}

export default sendConfirmEmailAddressEmail;
