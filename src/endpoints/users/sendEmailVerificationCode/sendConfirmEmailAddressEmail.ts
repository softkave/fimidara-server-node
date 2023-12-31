import {
  ConfirmEmailAddressEmailProps,
  confirmEmailAddressEmailHTML,
  confirmEmailAddressEmailText,
  confirmEmailAddressEmailTitle,
} from '../../../emailTemplates/confirmEmailAddress';
import {appAssert} from '../../../utils/assertion';
import {kUtilsInjectables} from '../../contexts/injectables';

export interface SendConfirmEmailAddressEmailParams
  extends ConfirmEmailAddressEmailProps {
  emailAddress: string;
}

async function sendConfirmEmailAddressEmail(props: SendConfirmEmailAddressEmailParams) {
  const suppliedConfig = kUtilsInjectables.suppliedConfig();
  appAssert(suppliedConfig.appDefaultEmailAddressFrom);

  const html = confirmEmailAddressEmailHTML(props);
  const text = confirmEmailAddressEmailText(props);
  await kUtilsInjectables.email().sendEmail({
    subject: confirmEmailAddressEmailTitle,
    body: {html, text},
    destination: [props.emailAddress],
    source: suppliedConfig.appDefaultEmailAddressFrom,
  });
}

export default sendConfirmEmailAddressEmail;
