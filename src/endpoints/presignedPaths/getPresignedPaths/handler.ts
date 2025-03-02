import {compact, keyBy, map, uniqBy} from 'lodash-es';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderOpParams} from '../../../contexts/semantic/types.js';
import {FileMatcher} from '../../../definitions/file.js';
import {PresignedPath} from '../../../definitions/presignedPath.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {appAssert} from '../../../utils/assertion.js';
import {mergeData} from '../../../utils/fns.js';
import {validate} from '../../../utils/validate.js';
import {NotFoundError} from '../../errors.js';
import {getFilepathInfo, stringifyFilenamepath} from '../../files/utils.js';
import {assertRootname} from '../../workspaces/utils.js';
import {
  GetPresignedPathsForFilesEndpoint,
  GetPresignedPathsForFilesItem,
} from './types.js';
import {getPresignedPathsForFilesJoiSchema} from './validation.js';

// TODO: filter out expired or spent presigned paths and delete them

const getPresignedPathsForFiles: GetPresignedPathsForFilesEndpoint =
  async reqData => {
    const data = validate(reqData.data, getPresignedPathsForFilesJoiSchema);
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    let pList: Array<PresignedPath> = [],
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
      pList = await kIjxSemantic.presignedPath().getManyByQuery({
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
      appAssert(
        workspace,
        new NotFoundError(
          `Workspace not found for path ${stringifyFilenamepath(nextPath)}`
        )
      );
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
  return await kIjxSemantic.utils().withTxn(async opts => {
    const fileIdList = compact(matchers.map(m => m.fileId));
    let pList: PresignedPath[] = [];

    if (fileIdList.length) {
      pList = await kIjxSemantic
        .presignedPath()
        .getManyByQuery({workspaceId, fileId: {$in: fileIdList}}, opts);
    }

    await Promise.all(
      matchers.map(async matcher => {
        if (!matcher.filepath) {
          return;
        }

        const pathinfo = getFilepathInfo(matcher.filepath, {
          containsRootname: true,
          allowRootFolder: false,
        });
        let workspace: Workspace | null;

        if (!workspaceId) {
          assertRootname(pathinfo.rootname);
          workspace = await kIjxSemantic
            .workspace()
            .getByRootname(pathinfo.rootname);
          appAssert(
            workspace,
            new NotFoundError(
              `Workspace with rootname ${pathinfo.rootname} not found`
            )
          );
          workspaceDict[workspace.resourceId] = workspace;
          workspaceId = workspace.resourceId;
        }

        const presignedPath = await kIjxSemantic
          .presignedPath()
          .getOneByFilepath(
            {
              workspaceId,
              namepath: pathinfo.namepath,
              ext: pathinfo.ext,
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
  pList: PresignedPath[],
  workspaceDict: Record<string, Workspace>
) {
  const unfetchedWorkspaceIdList = pList
    .filter(p => !workspaceDict[p.workspaceId])
    .map(p => p.workspaceId);
  mergeData(
    workspaceDict,
    keyBy(
      await kIjxSemantic.workspace().getManyByIdList(unfetchedWorkspaceIdList),
      w => w.resourceId
    ),
    {arrayUpdateStrategy: 'replace'}
  );
}

async function checkAuthOnPresignedPaths(
  agent: SessionAgent,
  pList: PresignedPath[],
  workspaceDict: Record<string, Workspace>,
  opts?: SemanticProviderOpParams
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
function filterActivePaths(presignedPaths: Array<PresignedPath | null>) {
  const activePaths: PresignedPath[] = [];
  const expiredOrSpentPaths: PresignedPath[] = [];
  const now = Date.now();

  presignedPaths.forEach(nextPath => {
    if (!nextPath) {
      return;
    } else if (
      (nextPath.maxUsageCount &&
        nextPath.maxUsageCount <= nextPath.spentUsageCount) ||
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
