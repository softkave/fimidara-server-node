import {compact, first} from 'lodash-es';
import {DataQuery} from '../../../../contexts/data/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {getIgnoreCaseDataQueryRegExp} from '../../../../contexts/semantic/utils.js';
import {EmailJobParams} from '../../../../definitions/job.js';
import {User} from '../../../../definitions/user.js';
import {BaseEmailTemplateProps} from '../../../../emailTemplates/types.js';
import {appAssert} from '../../../../utils/assertion.js';

export async function getUserFromEmailJobParams(
  params: Pick<EmailJobParams, 'emailAddress' | 'userId'>
) {
  const userId = first(params.userId);
  const userEmail = first(params.emailAddress);
  const userIdQuery: DataQuery<User> | undefined = userId
    ? {resourceId: userId}
    : undefined;
  const userEmailQuery: DataQuery<User> | undefined = userEmail
    ? {email: getIgnoreCaseDataQueryRegExp(userEmail)}
    : undefined;

  const user =
    userIdQuery || userEmailQuery
      ? await kIjxSemantic
          .user()
          .getOneByQuery({$or: compact([userIdQuery, userEmailQuery])})
      : null;

  return {user};
}

export async function getBaseEmailTemplateProps(
  params: EmailJobParams
): Promise<{
  user?: User | null;
  base: BaseEmailTemplateProps;
  source: string;
}> {
  const suppliedConfig = kIjxUtils.suppliedConfig();

  appAssert(
    suppliedConfig.clientLoginLink,
    'clientLoginLink not present in config'
  );
  appAssert(
    suppliedConfig.clientSignupLink,
    'clientSignupLink not present in config'
  );
  appAssert(
    suppliedConfig.senderEmailAddress,
    'senderEmailAddress not present in config'
  );

  const {user} = await getUserFromEmailJobParams(params);
  return {
    user,
    source: suppliedConfig.senderEmailAddress,
    base: {
      firstName: user?.firstName,
      loginLink: suppliedConfig.clientLoginLink,
      signupLink: suppliedConfig.clientSignupLink,
    },
  };
}
