import {
  getDeferredPromise,
  loopAndCollate,
  OmitFrom,
  TimeoutError,
  waitTimeout,
} from 'softkave-js-utils';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {kRegisterUtilsInjectables} from '../../../contexts/injection/register.js';
import {Folder} from '../../../definitions/folder.js';
import {Agent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {
  generateTestFolderpath,
  generateTestFolders,
} from '../../testUtils/generate/folder.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils.js';
import {kFolderConstants} from '../constants.js';
import {stringifyFolderpath} from '../utils.js';
import {createAddFolderQueue} from './handleAddFolderQueue.js';
import {queueAddFolder} from './queueAddFolder.js';
import {
  IAddFolderQueueInput,
  IAddFolderQueueOutput,
  kAddFolderQueueOutputType,
  NewFolderInput,
} from './types.js';

beforeEach(async () => {
  await initTests({addFolderQueueNo: -1});
  await createAddFolderQueue(/** queueNo */ 1);
});

afterEach(async () => {
  await completeTests();
});

function generateInput(
  workspace: Pick<Workspace, 'resourceId' | 'rootname'>,
  agent: Agent,
  count: number
) {
  return loopAndCollate((): NewFolderInput => {
    return {
      folderpath: stringifyFolderpath({
        namepath: generateTestFolderpath({rootname: workspace.rootname}),
      }),
      ...agent,
    };
  }, count);
}

describe('queueAddFolder', () => {
  test('queued + success', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [input] = generateInput(workspace, sessionAgent, /** count */ 1);

    const p = queueAddFolder(sessionAgent, workspace.resourceId, input);

    const channel = kFolderConstants.getAddFolderPubSubChannel(
      input.folderpath
    );
    const queueKey = kFolderConstants.getAddFolderQueueKey(input.folderpath);
    const dP = getDeferredPromise<Folder[]>();
    kUtilsInjectables.queue().waitOnStream(queueKey, async () => {
      const messages = await kUtilsInjectables
        .queue()
        .getMessages(queueKey, /** count */ 1);
      const expectedInput: OmitFrom<IAddFolderQueueInput, 'id'> = {
        ...input,
        channel,
        workspaceId: workspace.resourceId,
        agentId: sessionAgent.agentId,
        agentTokenId: sessionAgent.agentTokenId,
        agentType: sessionAgent.agentType,
      };
      expect(messages[0]).toMatchObject(expectedInput);

      const output: IAddFolderQueueOutput = {
        id: "doesn't matter",
        type: kAddFolderQueueOutputType.success,
        folders: generateTestFolders(/** count */ 1),
      };
      await kUtilsInjectables.pubsub().publish(channel, output);
      dP.resolve(output.folders);
    });

    const folders = await p;
    const output = await dP.promise;
    expect(folders).toEqual(output);
  });

  test('queued + error', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [input] = generateInput(workspace, sessionAgent, /** count */ 1);

    const channel = kFolderConstants.getAddFolderPubSubChannel(
      input.folderpath
    );
    const queueKey = kFolderConstants.getAddFolderQueueKey(input.folderpath);
    kUtilsInjectables.queue().waitOnStream(queueKey, async () => {
      const messages = await kUtilsInjectables
        .queue()
        .getMessages(queueKey, /** count */ 1);
      const expectedInput: OmitFrom<IAddFolderQueueInput, 'id'> = {
        ...input,
        channel,
        workspaceId: workspace.resourceId,
        agentId: sessionAgent.agentId,
        agentTokenId: sessionAgent.agentTokenId,
        agentType: sessionAgent.agentType,
      };
      expect(messages[0]).toMatchObject(expectedInput);

      const output: IAddFolderQueueOutput = {
        id: "doesn't matter",
        type: kAddFolderQueueOutputType.error,
        error: new Error('test'),
      };
      await kUtilsInjectables.pubsub().publish(channel, output);
    });

    await expect(async () => {
      await queueAddFolder(sessionAgent, workspace.resourceId, input);
    }).rejects.toThrowError('test');
  });

  test('queued + timeout', async () => {
    kRegisterUtilsInjectables.suppliedConfig({
      ...kUtilsInjectables.suppliedConfig(),
      addFolderTimeoutMs: 100,
    });

    const {userToken, sessionAgent} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [input] = generateInput(workspace, sessionAgent, /** count */ 1);

    await expect(() =>
      queueAddFolder(sessionAgent, workspace.resourceId, input)
    ).rejects.toThrow(TimeoutError);
  });

  test('queued + ack', async () => {
    kRegisterUtilsInjectables.suppliedConfig({
      ...kUtilsInjectables.suppliedConfig(),
      addFolderTimeoutMs: 700,
    });

    const {userToken, sessionAgent} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [input] = generateInput(workspace, sessionAgent, /** count */ 1);

    const p = queueAddFolder(sessionAgent, workspace.resourceId, input);

    const channel = kFolderConstants.getAddFolderPubSubChannel(
      input.folderpath
    );
    const queueKey = kFolderConstants.getAddFolderQueueKey(input.folderpath);
    const dF = getDeferredPromise<Folder[]>();
    kUtilsInjectables.queue().waitOnStream(queueKey, async () => {
      const messages = await kUtilsInjectables
        .queue()
        .getMessages(queueKey, /** count */ 1);
      const expectedInput: OmitFrom<IAddFolderQueueInput, 'id'> = {
        ...input,
        channel,
        workspaceId: workspace.resourceId,
        agentId: sessionAgent.agentId,
        agentTokenId: sessionAgent.agentTokenId,
        agentType: sessionAgent.agentType,
      };
      expect(messages[0]).toMatchObject(expectedInput);

      const ackOutput: IAddFolderQueueOutput = {
        type: kAddFolderQueueOutputType.ack,
        id: "doesn't matter",
      };
      await kUtilsInjectables.pubsub().publish(channel, ackOutput);
      await waitTimeout(500);

      const output: IAddFolderQueueOutput = {
        type: kAddFolderQueueOutputType.success,
        folders: generateTestFolders(/** count */ 1),
        id: "doesn't matter",
      };
      await kUtilsInjectables.pubsub().publish(channel, output);
      dF.resolve(output.folders);
    });

    const output = await dF.promise;
    const folders = await p;
    expect(folders).toEqual(output);
  });

  test('queued + cleanup', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [input] = generateInput(workspace, sessionAgent, /** count */ 1);

    const channel = kFolderConstants.getAddFolderPubSubChannel(
      input.folderpath
    );
    const queueKey = kFolderConstants.getAddFolderQueueKey(input.folderpath);
    kUtilsInjectables.queue().waitOnStream(queueKey, async () => {
      const messages = await kUtilsInjectables
        .queue()
        .getMessages(queueKey, /** count */ 1);
      const expectedInput: OmitFrom<IAddFolderQueueInput, 'id'> = {
        ...input,
        channel,
        workspaceId: workspace.resourceId,
        agentId: sessionAgent.agentId,
        agentTokenId: sessionAgent.agentTokenId,
        agentType: sessionAgent.agentType,
      };
      expect(messages[0]).toMatchObject(expectedInput);

      const output: IAddFolderQueueOutput = {
        type: kAddFolderQueueOutputType.error,
        error: new Error('test'),
        id: "doesn't matter",
      };
      await kUtilsInjectables.pubsub().publish(channel, output);
    });

    await expect(() =>
      queueAddFolder(sessionAgent, workspace.resourceId, input)
    ).rejects.toThrow(new Error('test'));

    await kUtilsInjectables.promises().flush();
    const messages = await kUtilsInjectables
      .queue()
      .getMessages(queueKey, /** count */ 1);
    expect(messages).toHaveLength(0);
  });
});
