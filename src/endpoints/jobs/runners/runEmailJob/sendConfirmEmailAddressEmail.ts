import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../../contexts/injection/injectables.js';
import {AgentToken} from '../../../../definitions/agentToken.js';
import {EmailJobParams, kEmailJobType} from '../../../../definitions/job.js';
import {
  kCurrentJWTTokenVersion,
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../../definitions/system.js';
import {User} from '../../../../definitions/user.js';
import {
  ConfirmEmailAddressEmailProps,
  confirmEmailAddressEmailHTML,
  confirmEmailAddressEmailText,
  kConfirmEmailAddressEmail,
} from '../../../../emailTemplates/confirmEmailAddress.js';
import {kSystemSessionAgent} from '../../../../utils/agent.js';
import {appAssert} from '../../../../utils/assertion.js';
import {getTimestamp} from '../../../../utils/dateFns.js';
import {newResource} from '../../../../utils/resource.js';
import {kUserConstants} from '../../../users/constants.js';
import {getBaseEmailTemplateProps} from './utils.js';

export async function getLinkWithConfirmEmailToken(
  user: User,
  urlPath: string
) {
  return kSemanticModels.utils().withTxn(async opts => {
    const url = new URL(urlPath);
    let token = await kSemanticModels
      .agentToken()
      .getUserAgentToken(
        user.resourceId,
        kTokenAccessScope.confirmEmailAddress,
        opts
      );

    if (!token) {
      token = newResource<AgentToken>(kFimidaraResourceType.AgentToken, {
        scope: [kTokenAccessScope.confirmEmailAddress],
        version: kCurrentJWTTokenVersion,
        forEntityId: user.resourceId,
        workspaceId: null,
        entityType: kFimidaraResourceType.User,
        createdBy: kSystemSessionAgent,
        lastUpdatedBy: kSystemSessionAgent,
      });
      await kSemanticModels.agentToken().insertItem(token, opts);
    }

    const encodedToken = await kUtilsInjectables.session().encodeToken({
      tokenId: token.resourceId,
      expiresAt: token.expiresAt,
      issuedAt: token.createdAt,
    });
    url.searchParams.set(
      kUserConstants.confirmEmailTokenQueryParam,
      encodedToken.jwtToken
    );

    return url.toString();
  });
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
  appAssert(
    suppliedConfig.verifyEmailLink,
    'verifyEmailLink not present in config'
  );
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
    })
  );

  return result;
}
