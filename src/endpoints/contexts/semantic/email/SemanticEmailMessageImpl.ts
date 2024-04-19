import {EmailMessage} from '../../../../definitions/email';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticEmailMessageProvider} from './types';

export class SemanticEmailMessageProviderImpl
  extends DataSemanticWorkspaceResourceProvider<EmailMessage>
  implements SemanticEmailMessageProvider {
  // async getNextBatch(opts: SemanticProviderMutationParams): Promise<EmailMessage[]> {}
}
