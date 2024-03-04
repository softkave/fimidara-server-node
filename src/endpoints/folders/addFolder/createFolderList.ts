import {Folder} from '../../../definitions/folder';
import {SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {convertToArray, pathSplit} from '../../../utils/fns';
import {ShardedInput} from '../../../utils/shardedRunnerQueue';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {SemanticProviderMutationTxnOptions} from '../../contexts/semantic/types';
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
      return {
        meta,
        input: [nextInput],
        shardId: [
          kAddFolderShardPart,
          workspaceId,
          // TODO: can shard key use existing parent folder names, instead of
          // just the first folder name
          /** workspace rootname and folder0 */ ...namepath.slice(0, 2),
        ],
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
  opts: SemanticProviderMutationTxnOptions | undefined
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

  let newFolders: Folder[] = [];
  let existingFolders: Folder[] = [];

  success.forEach(successItem => {
    newFolders = newFolders.concat(successItem.output.newFolders);
    existingFolders = existingFolders.concat(successItem.output.existingFolders);
  });

  return {newFolders, existingFolders, failedInput: failed};
}
