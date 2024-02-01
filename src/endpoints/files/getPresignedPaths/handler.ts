import {compact, keyBy, map, merge, uniqBy} from 'lodash';
import {FileMatcher, FilePresignedPath} from '../../../definitions/file';
import {SessionAgent, kPermissionAgentTypes} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {SemanticProviderRunOptions} from '../../contexts/semantic/types';
import {getFilepathInfo, stringifyFilenamepath} from '../utils';
import {GetPresignedPathsForFilesEndpoint, GetPresignedPathsForFilesItem} from './types';
import {getPresignedPathsForFilesJoiSchema} from './validation';
import {assertRootname} from '../../workspaces/utils';

// TODO: filter out expired or spent presigned paths and delete them

const getPresignedPathsForFiles: GetPresignedPathsForFilesEndpoint = async instData => {
  const data = validate(instData.data, getPresignedPathsForFilesJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, kPermissionAgentTypes);
  let pList: Array<FilePresignedPath> = [],
    workspaceDict: Record<string, Workspace> = {};

  if (data.files) {
    const uniqFileMatcherList = uniqBy(
      data.files,
      matcher => matcher.fileId || matcher.filepath
    );

    // Fetch presigned paths generated for files with matcher and optional
    // workspaceId.
    ({pList, workspaceDict} = await getPresignedPathsByFileMatchers(
      agent,
      uniqFileMatcherList,
      data.workspaceId
    ));
  } else {
    // Fetch agent's presigned paths with optional workspaceId.
    pList = await kSemanticModels.filePresignedPath().getManyByQuery({
      issuerAgentTokenId: agent.agentTokenId,
      workspaceId: data.workspaceId,
    });
  }

  // TODO: delete expired or spent paths filtered out
  const {activePaths} = filterActivePaths(pList);
  await fetchAndMergeUnfetchedWorkspaces(activePaths, workspaceDict);

  // Map of presigned path to filepath with rootname ensuring returned paths are
  // unique.
  const activePathsMap: Record<
    /** presigned path resourceId */ string,
    /** filepath with workspace rootname */ string
  > = {};

  activePaths.forEach(nextPath => {
    const workspace = workspaceDict[nextPath.workspaceId];
    appAssert(workspace);
    const filepath = stringifyFilenamepath(nextPath, workspace.rootname);
    activePathsMap[nextPath.resourceId] = filepath;
  });

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
  agent: SessionAgent,
  matchers: FileMatcher[],
  workspaceId?: string
) {
  const workspaceDict: Record<string, Workspace> = {};
  return await kSemanticModels.utils().withTxn(async opts => {
    const fileIdList = compact(matchers.map(m => m.fileId));
    let pList: FilePresignedPath[] = [];

    if (fileIdList.length) {
      pList = await kSemanticModels
        .filePresignedPath()
        .getManyByQuery({workspaceId, fileId: {$in: fileIdList}}, opts);
    }

    await Promise.all(
      matchers.map(async matcher => {
        if (!matcher.filepath) {
          return;
        }

        const pathinfo = getFilepathInfo(matcher.filepath);
        let workspace: Workspace | null;

        if (!workspaceId) {
          assertRootname(pathinfo.rootname);
          workspace = await kSemanticModels.workspace().getByRootname(pathinfo.rootname);
          appAssert(workspace);
          workspaceDict[workspace.resourceId] = workspace;
          workspaceId = workspace.resourceId;
        }

        const presignedPath = await kSemanticModels.filePresignedPath().getOneByFilepath(
          {
            workspaceId,
            namepath: pathinfo.namepath,
            extension: pathinfo.extension,
          },
          opts
        );

        if (presignedPath) {
          pList.push(presignedPath);
        }
      })
    );

    await fetchAndMergeUnfetchedWorkspaces(pList, workspaceDict);
    await checkAuthOnPresignedPaths(agent, pList, workspaceDict, opts);

    return {workspaceDict, pList};
  });
}

async function fetchAndMergeUnfetchedWorkspaces(
  pList: FilePresignedPath[],
  workspaceDict: Record<string, Workspace>
) {
  const unfetchedWorkspaceIdList = pList
    .filter(p => !workspaceDict[p.workspaceId])
    .map(p => p.workspaceId);
  merge(
    workspaceDict,
    keyBy(
      await kSemanticModels.workspace().getManyByIdList(unfetchedWorkspaceIdList),
      w => w.resourceId
    )
  );
}

async function checkAuthOnPresignedPaths(
  agent: SessionAgent,
  pList: FilePresignedPath[],
  workspaceDict: Record<string, Workspace>,
  opts?: SemanticProviderRunOptions
) {
  await Promise.all(
    pList.map(async nextPath => {
      // Only fileId because it represents that the file exists. No need to
      // check auth on a file that does not exist
      if (nextPath.fileId) {
        const workspace = workspaceDict[nextPath.workspaceId];
        await checkAuthorizationWithAgent({
          agent,
          opts,
          workspace: workspace || undefined,
          target: {targetId: nextPath.fileId, action: nextPath.actions},
          workspaceId: nextPath.workspaceId,
        });
      }
    })
  );
}

/** Separates active paths from expired or spent paths. */
function filterActivePaths(presignedPaths: Array<FilePresignedPath | null>) {
  const activePaths: FilePresignedPath[] = [];
  const expiredOrSpentPaths: FilePresignedPath[] = [];
  const now = Date.now();

  presignedPaths.forEach(nextPath => {
    if (!nextPath) {
      return;
    } else if (
      (nextPath.maxUsageCount && nextPath.maxUsageCount <= nextPath.spentUsageCount) ||
      (nextPath.expiresAt && nextPath.expiresAt < now)
    ) {
      expiredOrSpentPaths.push(nextPath);
    } else {
      activePaths.push(nextPath);
    }
  });

  return {activePaths, expiredOrSpentPaths};
}

export default getPresignedPathsForFiles;
