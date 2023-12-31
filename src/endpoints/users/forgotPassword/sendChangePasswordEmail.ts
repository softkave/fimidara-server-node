import {
  ForgotPasswordEmailProps,
  forgotPasswordEmailHTML,
  forgotPasswordEmailText,
  forgotPasswordEmailTitle,
} from '../../../emailTemplates/forgotPassword';
import {appAssert} from '../../../utils/assertion';
import {kUtilsInjectables} from '../../contexts/injectables';

async function sendChangePasswordEmail(
  emailAddress: string,
  props: ForgotPasswordEmailProps
) {
  const suppliedConfig = kUtilsInjectables.suppliedConfig();
  appAssert(suppliedConfig.appDefaultEmailAddressFrom);

  const html = forgotPasswordEmailHTML(props);
  const text = forgotPasswordEmailText(props);
  await kUtilsInjectables.email().sendEmail({
    subject: forgotPasswordEmailTitle,
    body: {html, text},
    destination: [emailAddress],
    source: suppliedConfig.appDefaultEmailAddressFrom,
  });
}

export default sendChangePasswordEmail;
