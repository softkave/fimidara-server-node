import {EmailBlocklist, EmailMessage} from '../../../../definitions/email';
import {
  SemanticBaseProviderType,
  SemanticProviderTxnOptions,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticEmailMessageProvider
  extends SemanticBaseProviderType<EmailMessage>,
    SemanticWorkspaceResourceProviderType<EmailMessage> {
  /** returns a list of 1000 or less unsent email entries */
  // getNextBatch(opts: SemanticProviderMutationTxnOptions): Promise<EmailMessage[]>;
}

export interface SemanticEmailBlocklistProvider
  extends SemanticBaseProviderType<EmailBlocklist>,
    SemanticWorkspaceResourceProviderType<EmailBlocklist> {
  isInBlocklist(emailAddress: string, opts: SemanticProviderTxnOptions): Promise<boolean>;
}
