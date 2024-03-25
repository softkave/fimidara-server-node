import {EmailBlocklist} from '../../../../definitions/email';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderTxnOptions} from '../types';
import {getIgnoreCaseDataQueryRegExp} from '../utils';
import {SemanticEmailBlocklistProvider} from './types';

export class SemanticEmailBlocklistProviderImpl
  extends DataSemanticWorkspaceResourceProvider<EmailBlocklist>
  implements SemanticEmailBlocklistProvider
{
  async isInBlocklist(
    emailAddress: string,
    opts: SemanticProviderTxnOptions
  ): Promise<boolean> {
    return await this.data.existsByQuery(
      {emailAddress: getIgnoreCaseDataQueryRegExp(emailAddress)},
      opts
    );
  }
}
