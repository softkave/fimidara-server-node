import {add} from 'date-fns';
import stringify from 'safe-stable-stringify';
import {AgentToken} from '../../../../definitions/agentToken';
import {EmailJobParams, kEmailJobType} from '../../../../definitions/job';
import {
  kCurrentJWTTokenVersion,
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../../definitions/system';
import {User} from '../../../../definitions/user';
import {
  ForgotPasswordEmailProps,
  forgotPasswordEmailHTML,
  forgotPasswordEmailText,
  kForgotPasswordEmailArtifacts,
} from '../../../../emailTemplates/forgotPassword';
import {kSystemSessionAgent} from '../../../../utils/agent';
import {appAssert} from '../../../../utils/assertion';
import {getDate} from '../../../../utils/dateFns';
import {newResource} from '../../../../utils/resource';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {kUserConstants} from '../../../users/constants';
import {getBaseEmailTemplateProps} from './utils';

function getForgotPasswordExpiration() {
  return add(new Date(), {
    days: kUserConstants.changePasswordTokenExpDurationInDays,
  });
}

export function getForgotPasswordLinkFromToken(forgotToken: AgentToken) {
  const suppliedConfig = kUtilsInjectables.suppliedConfig();
  const encodedToken = kUtilsInjectables
    .session()
    .encodeToken(forgotToken.resourceId, forgotToken.expiresAt);
  const tokenQueryParam = stringify({
    [kUserConstants.defaultTokenQueryParam]: encodedToken,
  });
  return `${suppliedConfig.changePasswordLink}?${tokenQueryParam}`;
}

export async function getForgotPasswordToken(user: User) {
  const expiration = getForgotPasswordExpiration();
  const forgotToken = newResource<AgentToken>(kFimidaraResourceType.AgentToken, {
    scope: [kTokenAccessScope.ChangePassword],
    version: kCurrentJWTTokenVersion,
    expiresAt: expiration.valueOf(),
    forEntityId: user.resourceId,
    workspaceId: null,
    entityType: kFimidaraResourceType.User,
    createdBy: kSystemSessionAgent,
    lastUpdatedBy: kSystemSessionAgent,
  });

  await kSemanticModels.utils().withTxn(async opts => {
    await kSemanticModels
      .agentToken()
      .softDeleteAgentTokens(user.resourceId, kTokenAccessScope.ChangePassword, opts);
    await kSemanticModels.agentToken().insertItem(forgotToken, opts);
  }, /** reuseTxn */ false);

  return forgotToken;
}

export async function sendForgotPasswordEmail(jobId: string, params: EmailJobParams) {
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

  const link = getForgotPasswordLinkFromToken(forgotToken);
  const emailProps: ForgotPasswordEmailProps = {
    ...base,
    link,
    expiration: getDate(forgotToken.expiresAt),
  };
  const html = forgotPasswordEmailHTML(emailProps);
  const text = forgotPasswordEmailText(emailProps);

  return await kUtilsInjectables.email().sendEmail({
    source,
    subject: kForgotPasswordEmailArtifacts.title,
    body: {html, text},
    destination: params.emailAddress,
  });
}
