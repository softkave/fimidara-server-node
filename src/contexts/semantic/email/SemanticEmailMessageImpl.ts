import {EmailMessage} from '../../../definitions/email.js';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider.js';
import {SemanticEmailMessageProvider} from './types.js';

export class SemanticEmailMessageProviderImpl
  extends DataSemanticWorkspaceResourceProvider<EmailMessage>
  implements SemanticEmailMessageProvider {
  // async getNextBatch(opts: SemanticProviderMutationParams): Promise<EmailMessage[]> {}
}
