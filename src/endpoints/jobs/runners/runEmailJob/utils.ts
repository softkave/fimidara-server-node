import {compact, first} from 'lodash';
import {EmailJobParams} from '../../../../definitions/job';
import {User} from '../../../../definitions/user';
import {BaseEmailTemplateProps} from '../../../../emailTemplates/types';
import {appAssert} from '../../../../utils/assertion';
import {DataQuery} from '../../../contexts/data/types';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {getIgnoreCaseDataQueryRegExp} from '../../../contexts/semantic/utils';

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
      ? await kSemanticModels
          .user()
          .getOneByQuery({$or: compact([userIdQuery, userEmailQuery])})
      : null;

  return {user};
}

export async function getBaseEmailTemplateProps(params: EmailJobParams): Promise<{
  user?: User | null;
  base: BaseEmailTemplateProps;
  source: string;
}> {
  const suppliedConfig = kUtilsInjectables.suppliedConfig();

  appAssert(suppliedConfig.clientLoginLink);
  appAssert(suppliedConfig.clientSignupLink);
  appAssert(suppliedConfig.appDefaultEmailAddressFrom);

  const {user} = await getUserFromEmailJobParams(params);
  return {
    user,
    source: suppliedConfig.appDefaultEmailAddressFrom,
    base: {
      loginLink: suppliedConfig.clientLoginLink,
      signupLink: suppliedConfig.clientSignupLink,
      firstName: user?.firstName,
    },
  };
}
