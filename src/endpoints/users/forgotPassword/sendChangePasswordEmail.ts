import {
  ForgotPasswordEmailProps,
  forgotPasswordEmailHTML,
  forgotPasswordEmailText,
  forgotPasswordEmailTitle,
} from '../../../emailTemplates/forgotPassword';
import {kUtilsInjectables} from '../../contexts/injectables';

async function sendChangePasswordEmail(
  emailAddress: string,
  props: ForgotPasswordEmailProps
) {
  const html = forgotPasswordEmailHTML(props);
  const text = forgotPasswordEmailText(props);
  await kUtilsInjectables.email().sendEmail({
    subject: forgotPasswordEmailTitle,
    body: {html, text},
    destination: [emailAddress],
    source: kUtilsInjectables.config().appDefaultEmailAddressFrom,
  });
}

export default sendChangePasswordEmail;
