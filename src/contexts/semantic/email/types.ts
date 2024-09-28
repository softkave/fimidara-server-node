import {EmailBlocklist, EmailMessage} from '../../../definitions/email.js';
import {
  SemanticBaseProviderType,
  SemanticProviderOpParams,
  SemanticWorkspaceResourceProviderType,
} from '../types.js';

export interface SemanticEmailMessageProvider
  extends SemanticBaseProviderType<EmailMessage>,
    SemanticWorkspaceResourceProviderType<EmailMessage> {
  /** returns a list of 1000 or less unsent email entries */
  // getNextBatch(opts: SemanticProviderMutationParams): Promise<EmailMessage[]>;
}

export interface SemanticEmailBlocklistProvider
  extends SemanticBaseProviderType<EmailBlocklist>,
    SemanticWorkspaceResourceProviderType<EmailBlocklist> {
  isInBlocklist(
    emailAddress: string,
    opts: SemanticProviderOpParams
  ): Promise<boolean>;
}
