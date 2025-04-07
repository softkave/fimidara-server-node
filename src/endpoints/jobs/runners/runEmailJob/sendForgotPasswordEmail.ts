import {add} from 'date-fns';
import {stringify} from 'querystring';
import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {AgentToken} from '../../../../definitions/agentToken.js';
import {EmailJobParams, kEmailJobType} from '../../../../definitions/job.js';
import {
  kCurrentJWTTokenVersion,
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../../definitions/system.js';
import {User} from '../../../../definitions/user.js';
import {
  ForgotPasswordEmailProps,
  forgotPasswordEmailHTML,
  forgotPasswordEmailText,
  kForgotPasswordEmailArtifacts,
} from '../../../../emailTemplates/forgotPassword.js';
import {kSystemSessionAgent} from '../../../../utils/agent.js';
import {appAssert} from '../../../../utils/assertion.js';
import {getDate} from '../../../../utils/dateFns.js';
import {newResource} from '../../../../utils/resource.js';
import {kUserConstants} from '../../../users/constants.js';
import {getBaseEmailTemplateProps} from './utils.js';

function getForgotPasswordExpiration() {
  return add(new Date(), {
    days: kUserConstants.changePasswordTokenExpDurationInDays,
  });
}

export async function getForgotPasswordLinkFromToken(forgotToken: AgentToken) {
  const suppliedConfig = kIjxUtils.suppliedConfig();
  const encodedToken = await kIjxUtils.session().encodeToken({
    tokenId: forgotToken.resourceId,
    expiresAt: forgotToken.expiresAt,
    issuedAt: forgotToken.createdAt,
  });
  const tokenQueryParam = stringify({
    [kUserConstants.defaultTokenQueryParam]: encodedToken.jwtToken,
  });

  return `${suppliedConfig.changePasswordLink}?${tokenQueryParam}`;
}

export async function getForgotPasswordToken(user: User) {
  const expiration = getForgotPasswordExpiration();
  const forgotToken = newResource<AgentToken>(
    kFimidaraResourceType.AgentToken,
    {
      scope: [kTokenAccessScope.changePassword],
      version: kCurrentJWTTokenVersion,
      expiresAt: expiration.valueOf(),
      forEntityId: user.resourceId,
      workspaceId: null,
      entityType: kFimidaraResourceType.User,
      createdBy: kSystemSessionAgent,
      lastUpdatedBy: kSystemSessionAgent,
    }
  );

  await kIjxSemantic.utils().withTxn(async opts => {
    await kIjxSemantic
      .agentToken()
      .softDeleteAgentTokens(
        user.resourceId,
        kTokenAccessScope.changePassword,
        opts
      );
    await kIjxSemantic.agentToken().insertItem(forgotToken, opts);
  });

  return forgotToken;
}

export async function sendForgotPasswordEmail(
  jobId: string,
  params: EmailJobParams
) {
  appAssert(
    params.type === kEmailJobType.forgotPassword,
    `Email job type is not ${kEmailJobType.forgotPassword}`
  );
  const {user, base, source} = await getBaseEmailTemplateProps(params);

  if (!user) {
    throw new Error(`User not found for job ${jobId}`);
  }

  const forgotToken = await getForgotPasswordToken(user);
  appAssert(
    forgotToken?.expiresAt,
    `Forgot password token ${forgotToken.resourceId} does not have an expiration date set`
  );

  const link = await getForgotPasswordLinkFromToken(forgotToken);
  const emailProps: ForgotPasswordEmailProps = {
    ...base,
    link,
    expiration: getDate(forgotToken.expiresAt),
  };
  const html = forgotPasswordEmailHTML(emailProps);
  const text = forgotPasswordEmailText(emailProps);

  return await kIjxUtils.email().sendEmail({
    source,
    subject: kForgotPasswordEmailArtifacts.title,
    body: {html, text},
    destination: params.emailAddress,
  });
}
