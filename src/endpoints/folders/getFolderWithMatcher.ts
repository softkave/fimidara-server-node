import {last} from 'lodash';
import {Folder, FolderMatcher} from '../../definitions/folder';
import {Agent} from '../../definitions/system';
import {FileQuery} from '../contexts/data/types';
import {kSemanticModels} from '../contexts/injection/injectables';
import {
  SemanticProviderMutationTxnOptions,
  SemanticProviderTxnOptions,
} from '../contexts/semantic/types';
import {FolderQueries} from './queries';
import {assertFolder, readOrIngestFolderByFolderpath} from './utils';

export async function getClosestExistingFolder(
  workspaceId: string,
  namepath: string[],
  opts?: SemanticProviderTxnOptions
): Promise<{folders: Folder[]; closestFolder: Folder | undefined}> {
  const folderQueries = namepath
    .map((p, i) => namepath.slice(0, i + 1))
    .map(
      (nextNamepath): FileQuery =>
        FolderQueries.getByNamepath({
          workspaceId: workspaceId,
          namepath: nextNamepath,
        })
    );
  const folders = await kSemanticModels
    .folder()
    .getManyByQuery({$or: folderQueries}, opts);
  folders.sort((f1, f2) => f1.namepath.length - f2.namepath.length);
  return {folders, closestFolder: last(folders)};
}

export async function getFolderWithMatcher(
  agent: Agent,
  matcher: FolderMatcher,
  opts?: SemanticProviderMutationTxnOptions,
  workspaceId?: string
) {
  if (matcher.folderId) {
    return await kSemanticModels.folder().getOneById(matcher.folderId, opts);
  } else if (matcher.folderpath) {
    return await readOrIngestFolderByFolderpath(
      agent,
      matcher.folderpath,
      opts,
      workspaceId
    );
  }

  return null;
}

export async function assertGetFolderWithMatcher(
  agent: Agent,
  matcher: FolderMatcher,
  opts?: SemanticProviderMutationTxnOptions,
  workspaceId?: string
) {
  const folder = await getFolderWithMatcher(agent, matcher, opts, workspaceId);
  assertFolder(folder);
  return folder;
}
