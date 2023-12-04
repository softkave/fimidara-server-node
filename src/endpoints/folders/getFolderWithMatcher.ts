import {last} from 'lodash';
import {Folder, FolderMatcher} from '../../definitions/folder';
import {FileQuery} from '../contexts/data/types';
import {
  SemanticProviderMutationRunOptions,
  SemanticProviderRunOptions,
} from '../contexts/semantic/types';
import {assertFolder, readOrIngestFolderByFolderpath} from './utils';
import {kSemanticModels} from '../contexts/injectables';

export async function getClosestExistingFolder(
  workspaceId: string,
  namepath: string[],
  opts?: SemanticProviderRunOptions
): Promise<{folders: Folder[]; closestFolder: Folder | undefined}> {
  const folderQueries = namepath
    .map((p, i) => namepath.slice(0, i + 1))
    .map(
      (nextnamepath): FileQuery => ({
        workspaceId: workspaceId,
        namepath: {$all: nextnamepath, $size: nextnamepath.length},
      })
    );
  const folders = await kSemanticModels.folder().getManyByQueryList(folderQueries, opts);
  folders.sort((f1, f2) => f1.namepath.length - f2.namepath.length);
  return {folders, closestFolder: last(folders)};
}

export async function getFolderWithMatcher(
  matcher: FolderMatcher,
  opts?: SemanticProviderMutationRunOptions,
  workspaceId?: string
) {
  if (matcher.folderId) {
    return await kSemanticModels.folder().getOneById(matcher.folderId, opts);
  } else if (matcher.folderpath) {
    if (opts)
      return await readOrIngestFolderByFolderpath(matcher.folderpath, opts, workspaceId);
  }

  return null;
}

export async function assertGetFolderWithMatcher(
  matcher: FolderMatcher,
  opts?: SemanticProviderMutationRunOptions,
  workspaceId?: string
) {
  const folder = await getFolderWithMatcher(matcher, opts, workspaceId);
  assertFolder(folder);
  return folder;
}
