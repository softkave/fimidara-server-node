import {noopAsync} from 'softkave-js-utils';
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
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {
  AddFolderShardMeta,
  AddFolderShardPerInputOutputItem,
  NewFolderInput,
  kAddFolderShardRunnerPrefix,
} from './types.js';

function shardNewFolderInput(
  workspaceId: string,
  input: NewFolderInput | NewFolderInput[],
  meta: AddFolderShardMeta
) {
  return convertToArray(input).map(
    (nextInput): ShardedInput<NewFolderInput, AddFolderShardMeta> => {
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
        meta,
        shardId,
        done: noopAsync,
        input: nextInput,
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
  UNSAFE_skipAuthCheck = false,
  throwOnFolderExists = true,
  throwOnError: boolean
) {
  const shardInputList = shardNewFolderInput(
    workspace.resourceId,
    input,
    /** meta */ {
      agent,
      throwOnFolderExists,
      UNSAFE_skipAuthCheck,
      workspace,
    }
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
