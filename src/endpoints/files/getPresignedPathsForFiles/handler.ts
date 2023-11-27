import {compact, map} from 'lodash';
import {FileMatcher, FilePresignedPath} from '../../../definitions/file';
import {PERMISSION_AGENT_TYPES, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {indexArray} from '../../../utils/indexArray';
import {validate} from '../../../utils/validate';
import {FilePresignedPathQuery} from '../../contexts/data/types';
import {BaseContextType} from '../../contexts/types';
import {folderConstants} from '../../folders/constants';
import {addRootnameToPath} from '../../folders/utils';
import {getFilepathInfo} from '../utils';
import {GetPresignedPathsForFilesEndpoint, GetPresignedPathsForFilesItem} from './types';
import {getPresignedPathsForFilesJoiSchema} from './validation';

// TODO: filter out expired or spent presigned paths and delete them

const getPresignedPathsForFiles: GetPresignedPathsForFilesEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getPresignedPathsForFilesJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  let presignedPaths: Array<FilePresignedPath | null> = [];

  if (data.files) {
    // Fetch presigned paths generated for files with matcher and optional
    // workspaceId.
    presignedPaths = await getPresignedPathsByFileMatchers(
      context,
      agent,
      data.files,
      data.workspaceId
    );
  } else {
    // Fetch agent's presigned paths with optional workspaceId.
    presignedPaths = await context.semantic.filePresignedPath.getManyByQuery({
      agentTokenId: agent.agentTokenId,
      workspaceId: data.workspaceId,
    });
  }

  // TODO: delete expired or spent paths filtered out
  const {activePaths} = filterOutPaths(presignedPaths);

  // Since we're returning filepaths and not fileIds, we need to resolve
  // presigned path's workspaceIds to rootnames to add to file name paths.
  const workspaceIds = compact(activePaths.map(p => p?.workspaceId));
  const workspaces = await context.semantic.workspace.getManyByIdList(workspaceIds);
  const workspacesMap = indexArray(workspaces, {path: 'resourceId'});

  // Map of presigned path to filepath with rootname ensuring returned paths are
  // unique.
  const activePathsMap: Record<
    /** presigned path resourceId */ string,
    /** filepath with workspace rootname */ string
  > = {};

  activePaths.forEach(p => {
    if (!p) return;

    const workspace = workspacesMap[p.workspaceId];
    const filepath = addRootnameToPath(
      p.fileNamePath.join(folderConstants.nameSeparator),
      workspace.rootname
    );
    activePathsMap[p.resourceId] = filepath;
  });

  // Transform presigned paths map to items.
  const paths: GetPresignedPathsForFilesItem[] = map(
    activePathsMap,
    (filepath, pathId) => ({
      filepath,
      path: pathId,
    })
  );
  return {paths};
};

async function getPresignedPathsByFileMatchers(
  context: BaseContextType,
  agent: SessionAgent,
  matchers: FileMatcher[],
  workspaceId?: string
) {
  let fileIdList: string[] = [];
  const filepathList: Array<{
    namepath: string[];
    extension?: string;
    workspaceId?: string;
    workspaceRootname?: string;
  }> = [];

  // Sort matcher into fileId and filepath arrays. We're going to use the
  // fileIds to get the filepaths since presigned paths keep filepaths and not
  // fileIds
  matchers.forEach(matcher => {
    if (matcher.fileId) {
      fileIdList.push(matcher.fileId);
    } else if (matcher.filepath) {
      const filepathInfo = getFilepathInfo(matcher.filepath);
      filepathList.push({
        workspaceId,
        namepath: filepathInfo.filepathExcludingExt,
        extension: filepathInfo.extension,
        workspaceRootname: filepathInfo.workspaceRootname,
      });
    }
  });

  // Fetch files with fileId if present, and extract filepath and workspaceId
  // from them
  if (fileIdList.length) {
    fileIdList = compact(fileIdList);
    const files = await context.semantic.file.getManyByIdList(fileIdList);
    files.forEach(f =>
      filepathList.push({
        namepath: f.namePath,
        extension: f.extension,
        workspaceId: f.workspaceId,
      })
    );
  }

  // From the filepath structure above, the workspaceId is not resolved, i.e,
  // it's not always present, e.g when filepaths are provided in matcher and an
  // overall workspaceId is not provided. Presigned paths keep the workspaceId
  // and not rootname, so we need to resolve filepath entries with rootname into
  // workspaceId, and remove entries without workspaceId. We're going to use the
  // resulting structure to retrieve requested presigned paths.
  const resolvedFilepathList: Array<{
    namepath: string[];
    extension?: string;
    workspaceId: string;
  }> = [];
  let workspacesMap: Record<string, Workspace> = {};

  // Short-circuit. If there's an overall workspaceId, then we don't need to
  // resolve rootnames to workspaceId.
  if (!workspaceId) {
    const workspaceRootnames = compact(filepathList.map(f => f.workspaceRootname));
    const workspaces = await context.semantic.workspace.getManyByQuery({
      rootname: {$in: workspaceRootnames},
    });
    workspacesMap = indexArray(workspaces, {path: 'rootname'});
  }

  // Filter out entries without workspaceId. If there isn't an overall
  // workspaceId, workspacesMap would be filled in, mapping rootnames to
  // workspaces for resolving entries with workspace rootname. Entries where the
  // workpspace's not found are filtered out instead of throwing error.
  filepathList.forEach(f => {
    if (f.workspaceId) {
      resolvedFilepathList.push({
        namepath: f.namepath,
        extension: f.extension,
        workspaceId: f.workspaceId,
      });
    } else if (f.workspaceRootname) {
      const workspace = workspacesMap[f.workspaceRootname];

      if (workspace) {
        resolvedFilepathList.push({
          namepath: f.namepath,
          extension: f.extension,
          workspaceId: workspace.resourceId,
        });
      }
    }
  });

  // Fetch and return presigned paths.
  // TODO: replace with $or query when we implement $or query
  // TODO: compact before use
  const queries = resolvedFilepathList.map(
    (matcher): FilePresignedPathQuery => ({
      fileNamePath: {$all: matcher.namepath, $size: matcher.namepath.length},
      fileExtension: matcher.extension,
      workspaceId: matcher.workspaceId,
      agentTokenId: agent.agentTokenId,
    })
  );
  return await context.semantic.filePresignedPath.getManyByQueryList(queries);
}

/** Separates active paths from expired or spent paths. */
function filterOutPaths(presignedPaths: Array<FilePresignedPath | null>) {
  const activePaths: FilePresignedPath[] = [];
  const expiredOrSpentPaths: FilePresignedPath[] = [];
  const now = Date.now();

  presignedPaths.forEach(p => {
    if (!p) return;

    if (
      (p.usageCount && p.usageCount <= p.spentUsageCount) ||
      (p.expiresAt && p.expiresAt < now)
    ) {
      expiredOrSpentPaths.push(p);
    } else {
      activePaths.push(p);
    }
  });

  return {activePaths, expiredOrSpentPaths};
}

export default getPresignedPathsForFiles;
