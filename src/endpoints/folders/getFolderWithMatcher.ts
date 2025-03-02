import {last} from 'lodash-es';
import {FileQuery} from '../../contexts/data/types.js';
import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderOpParams,
} from '../../contexts/semantic/types.js';
import {Folder, FolderMatcher} from '../../definitions/folder.js';
import {SessionAgent} from '../../definitions/system.js';
import {FolderQueries} from './queries.js';
import {assertFolder, readOrIngestFolderByFolderpath} from './utils.js';

export async function getClosestExistingFolder(
  workspaceId: string,
  namepath: string[],
  opts?: SemanticProviderOpParams
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
  const folders = await kIjxSemantic
    .folder()
    .getManyByQuery({$or: folderQueries}, opts);
  folders.sort((f1, f2) => f1.namepath.length - f2.namepath.length);
  return {folders, closestFolder: last(folders)};
}

export async function getFolderWithMatcher(
  agent: SessionAgent,
  matcher: FolderMatcher,
  opts?: SemanticProviderMutationParams,
  workspaceId?: string
) {
  if (matcher.folderId) {
    return await kIjxSemantic.folder().getOneById(matcher.folderId, opts);
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
  agent: SessionAgent,
  matcher: FolderMatcher,
  opts?: SemanticProviderMutationParams,
  workspaceId?: string
) {
  const folder = await getFolderWithMatcher(agent, matcher, opts, workspaceId);
  assertFolder(folder);
  return folder;
}
