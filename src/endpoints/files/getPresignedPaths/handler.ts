import {compact, map} from 'lodash';
import {FileMatcher, FilePresignedPath} from '../../../definitions/file';
import {PERMISSION_AGENT_TYPES, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {kFolderConstants} from '../../folders/constants';
import {addRootnameToPath} from '../../folders/utils';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getFilepathInfo} from '../utils';
import {GetPresignedPathsForFilesEndpoint, GetPresignedPathsForFilesItem} from './types';
import {getPresignedPathsForFilesJoiSchema} from './validation';

// TODO: filter out expired or spent presigned paths and delete them

const getPresignedPathsForFiles: GetPresignedPathsForFilesEndpoint = async instData => {
  const data = validate(instData.data, getPresignedPathsForFilesJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, PERMISSION_AGENT_TYPES);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  let presignedPaths: Array<FilePresignedPath | null> = [];

  if (data.files) {
    // Fetch presigned paths generated for files with matcher and optional
    // workspaceId.
    presignedPaths = await getPresignedPathsByFileMatchers(agent, data.files, workspace);
  } else {
    // Fetch agent's presigned paths with optional workspaceId.
    presignedPaths = await kSemanticModels.filePresignedPath().getManyByQuery({
      agentTokenId: agent.agentTokenId,
      workspaceId: workspace.resourceId,
    });
  }

  // TODO: delete expired or spent paths filtered out
  const {activePaths} = filterActivePaths(presignedPaths);

  // Map of presigned path to filepath with rootname ensuring returned paths are
  // unique.
  const activePathsMap: Record<
    /** presigned path resourceId */ string,
    /** filepath with workspace rootname */ string
  > = {};

  activePaths.forEach(nextPath => {
    if (!nextPath) {
      return;
    }

    const filepath = addRootnameToPath(
      nextPath.filepath.join(kFolderConstants.separator),
      workspace.rootname
    );
    activePathsMap[nextPath.resourceId] = filepath;
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
  agent: SessionAgent,
  matchers: FileMatcher[],
  workspace: Workspace
) {
  return await kSemanticModels.utils().withTxn(async opts => {
    const paths = compact(
      await Promise.all(
        matchers.map(matcher => {
          if (matcher.fileId) {
            return kSemanticModels
              .filePresignedPath()
              .getOneByFileId(matcher.fileId, opts);
          } else if (matcher.filepath) {
            const pathinfo = getFilepathInfo(matcher.filepath);
            return kSemanticModels.filePresignedPath().getOneByFilepath(
              {
                workspaceId: workspace.resourceId,
                namepath: pathinfo.namepath,
                extension: pathinfo.extension,
              },
              opts
            );
          }

          appAssert(false, kReuseableErrors.file.invalidMatcher());
        })
      )
    );
    await Promise.all(
      paths.map(async nextPath => {
        if (nextPath.fileId) {
          await checkAuthorizationWithAgent({
            agent,
            workspace,
            opts,
            target: {targetId: nextPath.fileId, action: nextPath.action},
            workspaceId: nextPath.workspaceId,
          });
        }
      })
    );

    return paths;
  });
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
      (nextPath.usageCount && nextPath.usageCount <= nextPath.spentUsageCount) ||
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
