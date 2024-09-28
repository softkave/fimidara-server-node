import {FolderQuery} from '../../contexts/data/types.js';
import {getStringListQuery} from '../../contexts/semantic/utils.js';
import {Folder} from '../../definitions/folder.js';
import EndpointReusableQueries from '../queries.js';

function getByNamepathOnly(folder: Pick<Folder, 'namepath'>): FolderQuery {
  const {namepath} = folder;
  return getStringListQuery<Folder>(
    namepath,
    /** prefix */ 'namepath',
    /** matcher op */ '$regex',
    /** include size */ true
  );
}

function getByNamepath(
  folder: Pick<Folder, 'workspaceId' | 'namepath'>
): FolderQuery {
  const {workspaceId} = folder;
  return EndpointReusableQueries.merge(
    {workspaceId},
    getByNamepathOnly(folder)
  );
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
    ...getStringListQuery<Folder>(
      namepath,
      /** prefix */ 'namepath',
      /** matcher op */ '$regex',
      /** include size */ false
    ),
    namepath: {$size: namepath.length + 1},
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
