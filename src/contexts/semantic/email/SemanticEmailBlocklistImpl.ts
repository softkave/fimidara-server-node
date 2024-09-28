import {EmailBlocklist} from '../../../definitions/email.js';
import {DataQuery} from '../../data/types.js';
import {addIsDeletedIntoQuery} from '../DataSemanticDataAccessBaseProvider.js';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider.js';
import {SemanticProviderOpParams} from '../types.js';
import {getIgnoreCaseDataQueryRegExp} from '../utils.js';
import {SemanticEmailBlocklistProvider} from './types.js';

export class SemanticEmailBlocklistProviderImpl
  extends DataSemanticWorkspaceResourceProvider<EmailBlocklist>
  implements SemanticEmailBlocklistProvider
{
  async isInBlocklist(
    emailAddress: string,
    opts: SemanticProviderOpParams
  ): Promise<boolean> {
    const query = addIsDeletedIntoQuery<DataQuery<EmailBlocklist>>(
      {emailAddress: getIgnoreCaseDataQueryRegExp(emailAddress)},
      opts?.includeDeleted || false
    );
    return await this.data.existsByQuery(query, opts);
  }
}
