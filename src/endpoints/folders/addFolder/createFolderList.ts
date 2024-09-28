import {noopAsync} from 'softkave-js-utils';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {Folder} from '../../../definitions/folder.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {convertToArray, pathSplit} from '../../../utils/fns.js';
import {
  ShardId,
  ShardedInput,
  kShardMatchStrategy,
  kShardQueueStrategy,
} from '../../../utils/shardedRunnerQueue.js';
import {
  AddFolderShardMeta,
  AddFolderShardNewFolderInput,
  AddFolderShardPerInputOutputItem,
  NewFolderInput,
  kAddFolderShardRunnerPrefix,
} from './types.js';

function shardNewFolderInput(
  agent: SessionAgent,
  workspaceId: string,
  input: NewFolderInput | NewFolderInput[],
  UNSAFE_skipAuthCheck: boolean,
  throwOnFolderExists: boolean,
  meta: AddFolderShardMeta
) {
  return convertToArray(input).map(
    (
      nextInput,
      index,
      array
    ): ShardedInput<AddFolderShardNewFolderInput, AddFolderShardMeta> => {
      const namepath = pathSplit(nextInput.folderpath);
      const shardId: ShardId = [
        kAddFolderShardRunnerPrefix,
        workspaceId,
        // TODO: can shard key use existing parent folder names, instead of
        // just the first folder name
        /** folder[0] */ ...namepath
          .slice(/** minus rootname */ 1, 2)
          .map(name => name.toLowerCase()),
      ];

      return {
        shardId,
        meta,
        done: noopAsync,
        input: {
          ...nextInput,
          agent,
          throwOnFolderExists,
          UNSAFE_skipAuthCheck,
          isLeafFolder: index === array.length,
        },
        queueStrategy: kShardQueueStrategy.appendToExisting,
        matchStrategy: kShardMatchStrategy.hierachichal,
      };
    }
  );
}

export async function createFolderList(
  agent: SessionAgent,
  workspace: Workspace,
  input: NewFolderInput | NewFolderInput[],
  UNSAFE_skipAuthCheck: boolean,
  throwOnFolderExists: boolean,
  throwOnError: boolean
) {
  const shardInputList = shardNewFolderInput(
    agent,
    workspace.resourceId,
    input,
    UNSAFE_skipAuthCheck,
    throwOnFolderExists,
    /** meta */ {workspace}
  );

  const {success, failed} = await kUtilsInjectables
    .shardedRunner()
    .ingestAndRun<
      NewFolderInput,
      AddFolderShardPerInputOutputItem,
      AddFolderShardMeta
    >(shardInputList);

  if (throwOnError && failed.length) {
    if (failed.length === 1) {
      const error0 = failed[0];
      throw error0.reason;
    } else {
      throw failed;
    }
  }

  let folders: Folder[] = [];

  success.forEach(successItem => {
    folders = folders.concat(successItem.output);
  });

  return {folders, failedInput: failed};
}
