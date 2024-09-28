import {AnyObject} from 'softkave-js-utils';
import {UnionToIntersection} from 'type-fest';
import {DataProviderFilterValueOperator} from '../contexts/data/DataProvider.js';
import DataProviderFilterBuilder from '../contexts/data/DataProviderFilterBuilder.js';
import {DataQuery} from '../contexts/data/types.js';
import {mergeData} from '../utils/fns.js';

function getByWorkspaceId(id: string) {
  return new DataProviderFilterBuilder<{workspaceId: string}>()
    .addItem('workspaceId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByWorkspaceIdAndExcludeResourceIdList(
  workspaceId: string,
  idList: string[] | undefined
) {
  const f = new DataProviderFilterBuilder<{
    workspaceId: string;
    resourceId: string;
  }>().addItem(
    'workspaceId',
    workspaceId,
    DataProviderFilterValueOperator.Equal
  );
  if (idList?.length) {
    f.addItem('resourceId', idList, DataProviderFilterValueOperator.NotIn);
  }

  return f.build();
}

function getByWorkspaceIdAndName(workspaceId: string, name: string) {
  return new DataProviderFilterBuilder<{workspaceId: string; name: string}>()
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .addItem(
      'name',
      new RegExp(`^${name}$`, 'i'),
      DataProviderFilterValueOperator.Regex
    )
    .build();
}

function getByResourceId(id: string) {
  return new DataProviderFilterBuilder<{resourceId: string}>()
    .addItem('resourceId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByResourceIdList(ids: string[]) {
  return new DataProviderFilterBuilder<{
    resourceId: string;
  }>()
    .addItem('resourceId', ids, DataProviderFilterValueOperator.In)
    .build();
}

function getByWorkspaceIdAndResourceIdList(workspaceId: string, ids: string[]) {
  return new DataProviderFilterBuilder<{
    resourceId: string;
    workspaceId: string;
  }>()
    .addItem('resourceId', ids, DataProviderFilterValueOperator.In)
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByProvidedId(workspaceId: string, id: string) {
  return new DataProviderFilterBuilder<{
    providedResourceId: string;
    workspaceId: string;
  }>()
    .addItem('providedResourceId', id, DataProviderFilterValueOperator.Equal)
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .build();
}

function mergeQueries<TQueries extends DataQuery<AnyObject>[]>(
  ...queries: TQueries
) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return queries.reduce(
    (dest, query) => mergeData(dest, query, {arrayUpdateStrategy: 'replace'}),
    {}
  ) as UnionToIntersection<TQueries[number]>;
}

export default abstract class EndpointReusableQueries {
  static getByWorkspaceId = getByWorkspaceId;
  static getByWorkspaceIdAndName = getByWorkspaceIdAndName;
  static getByResourceId = getByResourceId;
  static getByResourceIdList = getByResourceIdList;
  static getByProvidedId = getByProvidedId;
  static getByWorkspaceIdAndResourceIdList = getByWorkspaceIdAndResourceIdList;
  static getByWorkspaceIdAndExcludeResourceIdList =
    getByWorkspaceIdAndExcludeResourceIdList;
  static merge = mergeQueries;
}
