import {Folder} from '../../../definitions/folder';
import {SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {convertToArray, pathSplit} from '../../../utils/fns';
import {
  ShardId,
  ShardedInput,
  kShardMatchStrategy,
  kShardQueueStrategy,
} from '../../../utils/shardedRunnerQueue';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {SemanticProviderMutationParams} from '../../contexts/semantic/types';
import {
  AddFolderShardMeta,
  AddFolderShardOutputItem,
  NewFolderInput,
  kAddFolderShardPart,
} from './types';

function shardNewFolderInput(
  workspaceId: string,
  input: NewFolderInput | NewFolderInput[],
  meta: AddFolderShardMeta
) {
  return convertToArray(input).map(
    (nextInput): ShardedInput<NewFolderInput, AddFolderShardMeta> => {
      const namepath = pathSplit(nextInput.folderpath);
      const shardId: ShardId = [
        kAddFolderShardPart,
        workspaceId,
        // TODO: can shard key use existing parent folder names, instead of
        // just the first folder name
        /** workspace rootname and folder0 */ ...namepath
          .slice(0, 2)
          .map(name => name.toLowerCase()),
      ];

      return {
        shardId,
        meta,
        input: [nextInput],
        queueStrategy: meta.opts?.txn
          ? kShardQueueStrategy.separateFromExisting
          : kShardQueueStrategy.appendToExisting,
        matchStrategy: kShardMatchStrategy.hierachichal,
      };
    }
  );
}

export async function createFolderList(
  agent: SessionAgent,
  workspace: Workspace,
  input: NewFolderInput | NewFolderInput[],
  UNSAFE_skipAuthCheck = false,
  throwOnFolderExists = true,
  opts: SemanticProviderMutationParams | undefined,
  throwOnError: boolean
) {
  const {success, failed} = await kUtilsInjectables
    .shardedRunner()
    .ingestAndRun<NewFolderInput, AddFolderShardOutputItem, AddFolderShardMeta>(
      shardNewFolderInput(workspace.resourceId, input, {
        agent,
        throwOnFolderExists,
        UNSAFE_skipAuthCheck,
        workspace,
        opts,
      })
    );

  if (throwOnError && failed.length) {
    if (failed.length === 1) {
      const error0 = failed[0];
      throw error0.reason;
    } else {
      throw failed;
    }
  }

  let newFolders: Folder[] = [];
  let existingFolders: Folder[] = [];

  success.forEach(successItem => {
    newFolders = newFolders.concat(successItem.output.newFolders);
    existingFolders = existingFolders.concat(successItem.output.existingFolders);
  });

  return {newFolders, existingFolders, failedInput: failed};
}
