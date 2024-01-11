import {
  ForgotPasswordEmailProps,
  forgotPasswordEmailHTML,
  forgotPasswordEmailText,
  kForgotPasswordEmailArtifacts,
} from '../../../emailTemplates/forgotPassword';
import {appAssert} from '../../../utils/assertion';
import {kUtilsInjectables} from '../../contexts/injection/injectables';

async function sendChangePasswordEmail(
  emailAddress: string,
  props: ForgotPasswordEmailProps
) {
  const suppliedConfig = kUtilsInjectables.suppliedConfig();
  appAssert(suppliedConfig.appDefaultEmailAddressFrom);

  const html = forgotPasswordEmailHTML(props);
  const text = forgotPasswordEmailText(props);
  await kUtilsInjectables.email().sendEmail({
    subject: kForgotPasswordEmailArtifacts.title,
    body: {html, text},
    destination: [emailAddress],
    source: suppliedConfig.appDefaultEmailAddressFrom,
  });
}

export default sendChangePasswordEmail;
