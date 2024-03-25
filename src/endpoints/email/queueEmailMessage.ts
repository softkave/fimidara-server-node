import {compact} from 'lodash';
import {EmailMessage, EmailMessageParams} from '../../definitions/email';
import {kFimidaraResourceType} from '../../definitions/system';
import {newResource} from '../../utils/resource';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {kSemanticModels} from '../contexts/injection/injectables';

export async function queueEmailMessage(
  emailAddress: string,
  params: EmailMessageParams,
  workspaceId: string | undefined,
  userId: string | undefined,
  opts: {reuseTxn: boolean}
) {
  const {reuseTxn} = opts;
  return await kSemanticModels.utils().withTxn(async opts => {
    const isInBlocklist = await kSemanticModels
      .emailBlocklist()
      .isInBlocklist(emailAddress, opts);

    if (isInBlocklist) {
      throw kReuseableErrors.email.inBlocklist();
    }

    const emailMessage = newResource<EmailMessage>(kFimidaraResourceType.emailMessage, {
      workspaceId,
      userId: compact(userId),
      emailAddress: [emailAddress],
      type: params.type,
      params: params.params,
    });
    return kSemanticModels.emailMessage().insertItem(emailMessage, opts);
  }, reuseTxn);
}
