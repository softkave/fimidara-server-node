import {AgentToken} from '../../../../definitions/agentToken';
import {EmailJobParams, kEmailJobType} from '../../../../definitions/job';
import {
  kCurrentJWTTokenVersion,
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../../definitions/system';
import {User} from '../../../../definitions/user';
import {
  ConfirmEmailAddressEmailProps,
  confirmEmailAddressEmailHTML,
  confirmEmailAddressEmailText,
  kConfirmEmailAddressEmail,
} from '../../../../emailTemplates/confirmEmailAddress';
import {kSystemSessionAgent} from '../../../../utils/agent';
import {appAssert} from '../../../../utils/assertion';
import {getTimestamp} from '../../../../utils/dateFns';
import {newResource} from '../../../../utils/resource';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {kUserConstants} from '../../../users/constants';
import {getBaseEmailTemplateProps} from './utils';

export async function getLinkWithConfirmEmailToken(user: User, urlPath: string) {
  return kSemanticModels.utils().withTxn(async opts => {
    const url = new URL(urlPath);
    let token = await kSemanticModels
      .agentToken()
      .getOneAgentToken(user.resourceId, kTokenAccessScope.ConfirmEmailAddress, opts);

    if (!token) {
      token = newResource<AgentToken>(kFimidaraResourceType.AgentToken, {
        scope: [kTokenAccessScope.ConfirmEmailAddress],
        version: kCurrentJWTTokenVersion,
        forEntityId: user.resourceId,
        workspaceId: null,
        entityType: kFimidaraResourceType.User,
        createdBy: kSystemSessionAgent,
        lastUpdatedBy: kSystemSessionAgent,
      });
      await kSemanticModels.agentToken().insertItem(token, opts);
    }

    const encodedToken = kUtilsInjectables
      .session()
      .encodeToken(token.resourceId, token.expiresAt);
    url.searchParams.set(kUserConstants.confirmEmailTokenQueryParam, encodedToken);
    return url.toString();
  }, /** reuseTxn */ true);
}

export async function sendConfirmEmailAddressEmail(
  jobId: string,
  params: EmailJobParams
) {
  appAssert(
    params.type === kEmailJobType.confirmEmailAddress,
    `Email job type is not ${kEmailJobType.confirmEmailAddress}`
  );
  const {user, base, source} = await getBaseEmailTemplateProps(params);

  if (!user) {
    throw new Error(`Recipient user not found for job ${jobId}`);
  }

  const suppliedConfig = kUtilsInjectables.suppliedConfig();
  appAssert(suppliedConfig.verifyEmailLink, 'verifyEmailLink not present in config');
  const confirmEmailUrl = await getLinkWithConfirmEmailToken(
    user,
    suppliedConfig.verifyEmailLink
  );

  const emailProps: ConfirmEmailAddressEmailProps = {
    ...base,
    link: confirmEmailUrl,
    firstName: user.firstName,
  };
  const html = confirmEmailAddressEmailHTML(emailProps);
  const text = confirmEmailAddressEmailText(emailProps);
  const result = await kUtilsInjectables.email().sendEmail({
    source,
    subject: kConfirmEmailAddressEmail.title,
    body: {html, text},
    destination: params.emailAddress,
  });

  kUtilsInjectables.promises().forget(
    kSemanticModels.utils().withTxn(async opts => {
      await kSemanticModels
        .user()
        .updateOneById(
          user.resourceId,
          {emailVerificationEmailSentAt: getTimestamp()},
          opts
        );
    }, /** reuseTxn */ false)
  );

  return result;
}
