import {EmailMessage} from '../../../definitions/email.js';
import {SemanticWorkspaceResourceProvider} from '../SemanticWorkspaceResourceProvider.js';
import {SemanticEmailMessageProvider} from './types.js';

export class SemanticEmailMessageProviderImpl
  extends SemanticWorkspaceResourceProvider<EmailMessage>
  implements SemanticEmailMessageProvider {
  // async getNextBatch(opts: SemanticProviderMutationParams): Promise<EmailMessage[]> {}
}
