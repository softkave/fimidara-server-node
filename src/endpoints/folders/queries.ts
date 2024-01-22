import {Folder} from '../../definitions/folder';
import {FolderQuery} from '../contexts/data/types';
import {getStringListQuery} from '../contexts/semantic/utils';
import EndpointReusableQueries from '../queries';

function getByNamepathOnly(folder: Pick<Folder, 'namepath'>): FolderQuery {
  const {namepath} = folder;
  return {
    // MongoDB array queries with `{$all: [], $size: 0}` do not work, so using
    // `{$eq: []}` instead, since that works
    namepath:
      namepath.length === 0 ? {$eq: []} : {$all: namepath, $size: namepath.length},
  };
}

function getByNamepath(folder: Pick<Folder, 'workspaceId' | 'namepath'>): FolderQuery {
  const {workspaceId} = folder;
  return EndpointReusableQueries.merge({workspaceId}, getByNamepathOnly(folder));
}

function getByAncestor(
  folder: Pick<Folder, 'workspaceId' | 'namepath'>
): Pick<FolderQuery, 'workspaceId' | 'namepath'> {
  const {namepath, workspaceId} = folder;
  return {
    workspaceId,
    ...getStringListQuery<Folder>(
      namepath,
      /** prefix */ 'namepath',
      /** matcher op */ '$regex',
      /** include size */ false
    ),
  };
}

function getByParentPath(
  folder: Pick<Folder, 'workspaceId' | 'namepath'>
): Pick<FolderQuery, 'workspaceId' | 'namepath'> {
  const {namepath, workspaceId} = folder;
  return {
    workspaceId,
    namepath: {$size: namepath.length + 1},
    ...getStringListQuery<Folder>(
      namepath,
      /** prefix */ 'namepath',
      /** matcher op */ '$regex',
      /** include size */ false
    ),
  };
}

function getByParentId(
  folder: Pick<Folder, 'workspaceId' | 'resourceId'>
): Pick<FolderQuery, 'workspaceId' | 'parentId'> {
  const {resourceId, workspaceId} = folder;
  return {workspaceId, parentId: resourceId};
}

export abstract class FolderQueries {
  static getByNamepath = getByNamepath;
  static getByNamepathOnly = getByNamepathOnly;
  static getByAncestor = getByAncestor;
  static getByParentId = getByParentId;
  static getByParentPath = getByParentPath;
}
