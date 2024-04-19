import {EmailBlocklist} from '../../../../definitions/email';
import {DataQuery} from '../../data/types';
import {addIsDeletedIntoQuery} from '../DataSemanticDataAccessBaseProvider';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderOpParams} from '../types';
import {getIgnoreCaseDataQueryRegExp} from '../utils';
import {SemanticEmailBlocklistProvider} from './types';

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
