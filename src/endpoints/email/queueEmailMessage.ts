import {compact} from 'lodash-es';
import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {EmailMessage, EmailMessageParams} from '../../definitions/email.js';
import {kFimidaraResourceType} from '../../definitions/system.js';
import {newResource} from '../../utils/resource.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';

export async function queueEmailMessage(
  emailAddress: string,
  params: EmailMessageParams,
  workspaceId: string | undefined,
  userId: string | undefined
) {
  return await kIjxSemantic.utils().withTxn(async opts => {
    const isInBlocklist = await kIjxSemantic
      .emailBlocklist()
      .isInBlocklist(emailAddress, opts);

    if (isInBlocklist) {
      throw kReuseableErrors.email.inBlocklist();
    }

    const emailMessage = newResource<EmailMessage>(
      kFimidaraResourceType.emailMessage,
      {
        workspaceId,
        userId: compact(userId),
        emailAddress: [emailAddress],
        type: params.type,
        params: params.params,
      }
    );
    return kIjxSemantic.emailMessage().insertItem(emailMessage, opts);
  });
}
