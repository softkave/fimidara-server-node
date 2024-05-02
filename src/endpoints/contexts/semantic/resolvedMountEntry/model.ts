import {ResolvedMountEntry} from '../../../../definitions/fileBackend.js';
import {appAssert} from '../../../../utils/assertion.js';
import {FileBackendQueries} from '../../../fileBackends/queries.js';
import {DataQuery, ResolvedMountEntryQuery} from '../../data/types.js';
import {addIsDeletedIntoQuery} from '../DataSemanticDataAccessBaseProvider.js';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider.js';
import {SemanticProviderQueryParams} from '../types.js';
import {SemanticResolvedMountEntryProvider} from './types.js';

export class DataSemanticResolvedMountEntry
  extends DataSemanticWorkspaceResourceProvider<ResolvedMountEntry>
  implements SemanticResolvedMountEntryProvider
{
  getOneByMountIdAndFileId = async (
    mountId: string,
    fileId: string,
    opts?: SemanticProviderQueryParams<ResolvedMountEntry> | undefined
  ) => {
    const query = addIsDeletedIntoQuery<DataQuery<ResolvedMountEntry>>(
      {mountId, forId: fileId},
      opts?.includeDeleted || false
    );

    return await this.data.getOneByQuery(query, opts);
  };

  getLatestByFimidaraNamepathAndExt = async (
    workspaceId: string,
    fimidaraNamepath: string[],
    fimidaraExt: string | undefined,
    opts?: SemanticProviderQueryParams<ResolvedMountEntry> | undefined
  ) => {
    const query = addIsDeletedIntoQuery<DataQuery<ResolvedMountEntry>>(
      FileBackendQueries.getByFimidaraNamepath({
        workspaceId,
        fimidaraNamepath,
        fimidaraExt,
      }),
      opts?.includeDeleted || false
    );

    return await this.data.getManyByQuery(query, opts);
  };

  getLatestByForId = async (
    forId: string,
    opts?: SemanticProviderQueryParams<ResolvedMountEntry> | undefined
  ) => {
    const query = addIsDeletedIntoQuery<DataQuery<ResolvedMountEntry>>(
      {forId},
      opts?.includeDeleted || false
    );

    return await this.data.getManyByQuery(query, opts);
  };

  getLatestForManyFimidaraNamepathAndExt = async (
    workspaceId: string,
    entries: {fimidaraNamepath: string[]; fimidaraExt?: string | undefined}[],
    opts?: SemanticProviderQueryParams<ResolvedMountEntry> | undefined
  ) => {
    const queries = entries.map(entry =>
      addIsDeletedIntoQuery<DataQuery<ResolvedMountEntry>>(
        FileBackendQueries.getByFimidaraNamepath({workspaceId, ...entry}),
        opts?.includeDeleted || false
      )
    );
    const query: ResolvedMountEntryQuery = {
      $or: queries,
    };

    appAssert(queries.length);
    return await this.data.getManyByQuery(query, opts);
  };
}
