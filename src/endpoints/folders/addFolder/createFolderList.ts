import {Folder} from '../../../definitions/folder.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {convertToArray} from '../../../utils/fns.js';
import {queueAddFolder} from './queueAddFolder.js';
import {NewFolderInput} from './types.js';

export async function createFolderList(
  agent: SessionAgent,
  workspace: Workspace,
  input: NewFolderInput | NewFolderInput[],
  UNSAFE_skipAuthCheck: boolean,
  throwOnFolderExists: boolean,
  throwOnError: boolean
) {
  const outputList = await Promise.all(
    convertToArray(input).map(
      async (
        nextInput
      ): Promise<
        {success: true; output: Folder[]} | {success: false; reason: unknown}
      > => {
        try {
          const output = await queueAddFolder(
            agent,
            workspace.resourceId,
            nextInput,
            UNSAFE_skipAuthCheck,
            throwOnFolderExists
          );

          return {success: true, output};
        } catch (reason) {
          return {success: false, reason};
        }
      }
    )
  );
  const success = outputList.filter(output => output.success) as Array<{
    success: true;
    output: Folder[];
  }>;
  const failed = outputList.filter(output => !output.success) as Array<{
    success: false;
    reason: unknown;
  }>;

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
