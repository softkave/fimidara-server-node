import assert from 'assert';
import {flatten, keyBy, last, uniq, uniqBy} from 'lodash-es';
import {
  getNewId,
  kLoopAsyncSettlementType,
  loopAndCollate,
  loopAndCollateAsync,
  OmitFrom,
  pathJoin,
  waitTimeout,
} from 'softkave-js-utils';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {QueueContextSubscribeJsonFn} from '../../../contexts/pubsub/types.js';
import {IQueueMessage} from '../../../contexts/queue/types.js';
import {AgentToken} from '../../../definitions/agentToken.js';
import {Folder} from '../../../definitions/folder.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {Agent, kFimidaraResourceType} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {kStringFalse, kStringTrue} from '../../../utils/constants.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {NotFoundError} from '../../errors.js';
import {
  generateAndInsertTestFolders,
  generateTestFolderpath,
} from '../../testUtils/generate/folder.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  initTests,
  insertAgentTokenForTest,
  insertPermissionItemsForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils.js';
import {PermissionDeniedError} from '../../users/errors.js';
import {kFolderConstants} from '../constants.js';
import {getFolderpathInfo, stringifyFolderpath} from '../utils.js';
import {startHandleAddFolderQueue} from './handleAddFolderQueue.js';
import {
  IAddFolderQueueInput,
  IAddFolderQueueOutput,
  kAddFolderQueueOutputType,
} from './types.js';

// TODO: part of parent folder exists

let queueStart = 1;

beforeEach(async () => {
  await initTests({
    addFolderQueueNo: [],
    addFolderQueueStart: queueStart,
    addFolderQueueEnd: queueStart,
  });
});

afterEach(async () => {
  await completeTests();
  queueStart += 1;
});

interface ITestAddFolderQueueInput extends IAddFolderQueueInput {
  hasAccess: string;
}

function generateInput(workspace: Pick<Workspace, 'resourceId' | 'rootname'>) {
  const channel = `addFolder-${workspace.resourceId}`;
  return loopAndCollate(
    (): OmitFrom<IAddFolderQueueInput, keyof Agent | 'id'> => {
      return {
        channel,
        workspaceId: workspace.resourceId,
        folderpath: stringifyFolderpath({
          namepath: generateTestFolderpath({rootname: workspace.rootname}),
        }),
        UNSAFE_skipAuthCheck: kStringFalse,
        throwIfFolderExists: kStringFalse,
      };
    },
    /** count */ 5
  );
}

function populateWithAgent(
  input: OmitFrom<IAddFolderQueueInput, keyof Agent | 'id'>[],
  agents: Agent[],
  hasAccess: boolean
): ITestAddFolderQueueInput[] {
  return flatten(
    input.map(inputItem =>
      agents.map(agent => ({
        ...inputItem,
        ...agent,
        hasAccess: hasAccess ? kStringTrue : kStringFalse,
        id: getNewId(),
      }))
    )
  );
}

function tokensToAgents(tokens: AgentToken[]): Agent[] {
  return tokens.map(token => ({
    agentId: token.forEntityId || token.resourceId,
    agentType: token.entityType,
    agentTokenId: token.resourceId,
  }));
}

async function generateTokens(
  userToken: AgentToken,
  workspace: Workspace,
  count: number,
  hasAccess: boolean
) {
  const tokens = await loopAndCollateAsync(
    () => insertAgentTokenForTest(userToken, workspace.resourceId),
    count,
    kLoopAsyncSettlementType.all
  );
  const agents = tokensToAgents(tokens.map(token => token.rawToken));

  await Promise.all(
    tokens.map(token =>
      insertPermissionItemsForTest(userToken, workspace.resourceId, [
        {
          action: kFimidaraPermissionActions.addFolder,
          targetId: workspace.resourceId,
          access: hasAccess,
          entityId: token.token.resourceId,
        },
      ])
    )
  );

  return {tokens, agents};
}

async function readyChannel(
  input: IAddFolderQueueInput[],
  fn: QueueContextSubscribeJsonFn
) {
  await Promise.all(
    uniq(input.map(inputItem => inputItem.channel)).map(channel =>
      kUtilsInjectables.pubsub().subscribeJson(channel, fn)
    )
  );
}

async function insertInQueue(input: IAddFolderQueueInput[]) {
  const queueKeys = uniq(
    input.map(inputItem =>
      kFolderConstants.getAddFolderQueueKey(inputItem.folderpath)
    )
  );
  assert.ok(queueKeys.length === 1);
  const queueKey = queueKeys[0];

  await kUtilsInjectables
    .queue()
    .addMessages(queueKey, input as unknown as IQueueMessage[]);
}

async function getFoldersFromDB(input: IAddFolderQueueInput[]) {
  const folderpaths = uniqBy(
    input.map(inputItem => ({
      workspaceId: inputItem.workspaceId,
      ...getFolderpathInfo(inputItem.folderpath, {
        allowRootFolder: false,
        containsRootname: true,
      }),
    })),
    pathinfo => pathinfo.stringPath
  );

  const folders = await Promise.all(
    folderpaths.map(folderpath =>
      kSemanticModels.folder().getOneByNamepath(folderpath)
    )
  );
  const foldersRecord = keyBy(
    folders.filter(folder => folder) as Folder[],
    folder => pathJoin({input: folder!.namepath})
  );

  return {folders, foldersRecord, folderpaths};
}

async function checkFoldersCreatedInDB(
  input: IAddFolderQueueInput[],
  shouldBeCreated: boolean
) {
  const {foldersRecord, folderpaths} = await getFoldersFromDB(input);

  folderpaths.forEach(folderpath => {
    const folder = foldersRecord[folderpath.stringPath];

    if (shouldBeCreated) {
      assert.ok(folder);
      expect(folder.workspaceId).toBe(folderpath.workspaceId);
      expect(folder.namepath).toEqual(folderpath.namepath);
    } else {
      expect(folder).toBeFalsy();
    }
  });
}

async function checkFoldersNotDuplicated(input: IAddFolderQueueInput[]) {
  const {folders} = await getFoldersFromDB(input);
  const uniqInput = uniqBy(input, inputItem => inputItem.folderpath);
  assert.ok(folders.length === uniqInput.length);
}

async function checkAckNotified(
  input: IAddFolderQueueInput[],
  output: IAddFolderQueueOutput[]
) {
  const acks = output.filter(
    outputItem => outputItem.type === kAddFolderQueueOutputType.ack
  );
  expect(acks.length).toBe(input.length);
}

async function checkCorrectResponseReturned(
  input: ITestAddFolderQueueInput[],
  output: IAddFolderQueueOutput[]
) {
  const outputRecord = keyBy(
    output.filter(
      outputItem => outputItem.type !== kAddFolderQueueOutputType.ack
    ),
    outputItem => outputItem.id
  );

  input.forEach(inputItem => {
    const outputItem = outputRecord[inputItem.id];
    assert.ok(outputItem);

    if (inputItem.hasAccess === kStringTrue) {
      assert.ok(outputItem.type === kAddFolderQueueOutputType.success);
      expect(outputItem.folders.length).toBeGreaterThan(0);
      expect(pathJoin({input: last(outputItem.folders)!.namepath})).toBe(
        getFolderpathInfo(inputItem.folderpath, {
          allowRootFolder: false,
          containsRootname: true,
        }).stringPath
      );
    } else {
      assert.ok(outputItem.type === kAddFolderQueueOutputType.error);
      const expectedError = new PermissionDeniedError();
      expect((outputItem.error as Error).message).toBe(expectedError.message);
      expect((outputItem.error as Error).name).toBe(expectedError.name);
    }
  });
}

describe('handleAddFolderQueue', () => {
  test('handleAddFolderQueue', async () => {
    const {userToken} = await insertUserForTest();
    const [w1, w2] = await Promise.all([
      insertWorkspaceForTest(userToken),
      insertWorkspaceForTest(userToken),
    ]);

    const [w1a1, w1a2, w2a1, w2a2] = await Promise.all([
      generateTokens(
        userToken,
        w1.rawWorkspace,
        /** count */ 2,
        /** hasAccess */ true
      ),
      generateTokens(
        userToken,
        w1.rawWorkspace,
        /** count */ 2,
        /** hasAccess */ false
      ),
      generateTokens(
        userToken,
        w2.rawWorkspace,
        /** count */ 2,
        /** hasAccess */ true
      ),
      generateTokens(
        userToken,
        w2.rawWorkspace,
        /** count */ 2,
        /** hasAccess */ false
      ),
    ]);

    const w1i1 = generateInput(w1.rawWorkspace);
    const w1i2 = generateInput(w1.rawWorkspace);
    const w2i1 = generateInput(w2.rawWorkspace);
    const w2i2 = generateInput(w2.rawWorkspace);

    const w1i1a1 = populateWithAgent(w1i1, w1a1.agents, /** hasAccess */ true);
    const w1i1a2 = populateWithAgent(w1i1, w1a2.agents, /** hasAccess */ false);
    const w1i2a2 = populateWithAgent(w1i2, w1a2.agents, /** hasAccess */ false);
    const w2i1a1 = populateWithAgent(w2i1, w2a1.agents, /** hasAccess */ true);
    const w2i1a2 = populateWithAgent(w2i1, w2a2.agents, /** hasAccess */ false);
    const w2i2a2 = populateWithAgent(w2i2, w2a2.agents, /** hasAccess */ false);

    const input = [
      ...w1i1a1,
      ...w1i1a2,
      ...w1i2a2,
      ...w2i1a1,
      ...w2i1a2,
      ...w2i2a2,
    ];

    const output: IAddFolderQueueOutput[] = [];
    const fn: QueueContextSubscribeJsonFn = response => {
      output.push(response as IAddFolderQueueOutput);
    };

    await readyChannel(input, fn);
    await insertInQueue(input);

    await startHandleAddFolderQueue(queueStart);
    await waitTimeout(1_000);
    await kUtilsInjectables.promises().flush();

    await checkFoldersCreatedInDB(w1i1a1, /** shouldBeCreated */ true);
    await checkFoldersCreatedInDB(w1i1a2, /** shouldBeCreated */ true);
    await checkFoldersCreatedInDB(w1i2a2, /** shouldBeCreated */ false);
    await checkFoldersCreatedInDB(w2i1a1, /** shouldBeCreated */ true);
    await checkFoldersCreatedInDB(w2i1a2, /** shouldBeCreated */ true);
    await checkFoldersCreatedInDB(w2i2a2, /** shouldBeCreated */ false);

    await checkFoldersNotDuplicated(input);
    await checkAckNotified(input, output);
    await checkCorrectResponseReturned(input, output);
  });

  test('handleAddFolderQueue, workspace not found', async () => {
    const {userToken} = await insertUserForTest();
    const w1 = await insertWorkspaceForTest(userToken);

    const w1a1 = await generateTokens(
      userToken,
      w1.rawWorkspace,
      /** count */ 2,
      /** hasAccess */ true
    );

    const w1i1 = generateInput({
      resourceId: getNewIdForResource(kFimidaraResourceType.Workspace),
      rootname: 'rootname',
    });
    const w1i1a1 = populateWithAgent(w1i1, w1a1.agents, /** hasAccess */ true);
    const input = [...w1i1a1];

    const output: IAddFolderQueueOutput[] = [];
    const fn: QueueContextSubscribeJsonFn = response => {
      output.push(response as IAddFolderQueueOutput);
    };

    await readyChannel(input, fn);
    await insertInQueue(input);

    await startHandleAddFolderQueue(queueStart);

    output
      .filter(outputItem => outputItem.type !== kAddFolderQueueOutputType.ack)
      .forEach(outputItem => {
        assert.ok(outputItem.type === kAddFolderQueueOutputType.error);
        const expectedError = new NotFoundError('Workspace not found');
        expect((outputItem.error as Error).name).toBe(expectedError.name);
        expect((outputItem.error as Error).message).toBe(expectedError.message);
      });
  });

  test('handleAddFolderQueue, agent not found', async () => {
    const {userToken} = await insertUserForTest();
    const w1 = await insertWorkspaceForTest(userToken);

    const w1i1 = generateInput(w1.rawWorkspace);
    const w1i1a1 = populateWithAgent(
      w1i1,
      [
        {
          agentId: getNewIdForResource(kFimidaraResourceType.AgentToken),
          agentType: kFimidaraResourceType.AgentToken,
          agentTokenId: getNewIdForResource(kFimidaraResourceType.AgentToken),
        },
      ],
      /** hasAccess */ true
    );
    const input = [...w1i1a1];

    const output: IAddFolderQueueOutput[] = [];
    const fn: QueueContextSubscribeJsonFn = response => {
      output.push(response as IAddFolderQueueOutput);
    };

    await readyChannel(input, fn);
    await insertInQueue(input);

    await startHandleAddFolderQueue(queueStart);

    output
      .filter(outputItem => outputItem.type !== kAddFolderQueueOutputType.ack)
      .forEach(outputItem => {
        assert.ok(outputItem.type === kAddFolderQueueOutputType.error);
      });
  });

  test('handleAddFolderQueue, wait on stream', async () => {
    const {userToken} = await insertUserForTest();
    const w1 = await insertWorkspaceForTest(userToken);

    const w1a1 = await generateTokens(
      userToken,
      w1.rawWorkspace,
      /** count */ 2,
      /** hasAccess */ true
    );

    const w1i1 = generateInput(w1.rawWorkspace);
    const w1i1a1 = populateWithAgent(w1i1, w1a1.agents, /** hasAccess */ true);
    const input = [...w1i1a1];

    const output: IAddFolderQueueOutput[] = [];
    const fn: QueueContextSubscribeJsonFn = response => {
      output.push(response as IAddFolderQueueOutput);
    };

    await startHandleAddFolderQueue(queueStart);

    await readyChannel(input, fn);
    await insertInQueue(input);

    await waitTimeout(500);
    await kUtilsInjectables.promises().flush();

    await checkFoldersCreatedInDB(w1i1a1, /** shouldBeCreated */ true);
    await checkFoldersNotDuplicated(input);
    await checkAckNotified(input, output);
    await checkCorrectResponseReturned(input, output);
  });

  test.each([kStringTrue, kStringFalse])(
    'handleAddFolderQueue, UNSAFE_skipAuthCheck=%s',
    async UNSAFE_skipAuthCheck => {
      const {userToken} = await insertUserForTest();
      const w1 = await insertWorkspaceForTest(userToken);

      const w1a2 = await generateTokens(
        userToken,
        w1.rawWorkspace,
        /** count */ 2,
        /** hasAccess */ false
      );

      const w1i1 = generateInput(w1.rawWorkspace);
      const w1i1a2 = populateWithAgent(
        w1i1,
        w1a2.agents,
        /** hasAccess */ UNSAFE_skipAuthCheck === kStringTrue
      );

      const input = w1i1a2.map(inputItem => ({
        ...inputItem,
        UNSAFE_skipAuthCheck,
      }));

      const output: IAddFolderQueueOutput[] = [];
      const fn: QueueContextSubscribeJsonFn = response => {
        output.push(response as IAddFolderQueueOutput);
      };

      await readyChannel(input, fn);
      await insertInQueue(input);

      await startHandleAddFolderQueue(queueStart);
      await waitTimeout(1_000);
      await kUtilsInjectables.promises().flush();

      await checkFoldersCreatedInDB(
        w1i1a2,
        /** shouldBeCreated */ UNSAFE_skipAuthCheck === kStringTrue
      );

      await checkFoldersNotDuplicated(input);
      await checkAckNotified(input, output);
      await checkCorrectResponseReturned(input, output);
    }
  );

  test.each([kStringTrue, kStringFalse])(
    'handleAddFolderQueue, throwIfFolderExists=%s',
    async throwIfFolderExists => {
      const {userToken} = await insertUserForTest();
      const w1 = await insertWorkspaceForTest(userToken);

      const w1a1 = await generateTokens(
        userToken,
        w1.rawWorkspace,
        /** count */ 2,
        /** hasAccess */ true
      );

      const inputFolderpath = generateTestFolderpath({length: 3});
      const [f0] = await generateAndInsertTestFolders(1, {
        workspaceId: w1.rawWorkspace.resourceId,
        parentId: null,
        name: inputFolderpath[0],
        namepath: [inputFolderpath[0]],
      });
      const [f1] = await generateAndInsertTestFolders(1, {
        workspaceId: w1.rawWorkspace.resourceId,
        parentId: f0.resourceId,
        name: inputFolderpath[1],
        namepath: inputFolderpath.slice(0, 2),
      });
      const [f2] = await generateAndInsertTestFolders(1, {
        workspaceId: w1.rawWorkspace.resourceId,
        parentId: f1.resourceId,
        name: inputFolderpath[2],
        namepath: inputFolderpath,
      });

      const w1i1 = generateInput(w1.rawWorkspace);
      const w1i1a1 = populateWithAgent(
        w1i1,
        w1a1.agents,
        /** hasAccess */ true
      );

      const input = [...w1i1a1].map(inputItem => ({
        ...inputItem,
        throwIfFolderExists,
        folderpath: stringifyFolderpath(f2, w1.rawWorkspace.rootname),
      }));

      const output: IAddFolderQueueOutput[] = [];
      const fn: QueueContextSubscribeJsonFn = response => {
        output.push(response as IAddFolderQueueOutput);
      };

      await readyChannel(input, fn);
      await insertInQueue(input);

      await startHandleAddFolderQueue(queueStart);
      await waitTimeout(1_000);
      await kUtilsInjectables.promises().flush();

      await checkFoldersNotDuplicated(input);
      output
        .filter(outputItem => outputItem.type !== kAddFolderQueueOutputType.ack)
        .forEach(outputItem => {
          if (throwIfFolderExists) {
            assert.ok(outputItem.type === kAddFolderQueueOutputType.error);
            expect((outputItem.error as Error).name).toBe('FolderExistsError');
          } else {
            assert.ok(outputItem.type === kAddFolderQueueOutputType.success);
            expect(last(outputItem.folders)!.resourceId).toEqual(f2.resourceId);
          }
        });
    }
  );

  test.each([true, false])(
    'handleAddFolderQueue, folders exist but agent without permission=%s',
    async hasAccess => {
      const {userToken} = await insertUserForTest();
      const w1 = await insertWorkspaceForTest(userToken);

      const w1a1 = await generateTokens(
        userToken,
        w1.rawWorkspace,
        /** count */ 2,
        hasAccess
      );

      const inputFolderpath = generateTestFolderpath({length: 3});
      const [f0] = await generateAndInsertTestFolders(1, {
        workspaceId: w1.rawWorkspace.resourceId,
        parentId: null,
        name: inputFolderpath[0],
        namepath: [inputFolderpath[0]],
      });
      const [f1] = await generateAndInsertTestFolders(1, {
        workspaceId: w1.rawWorkspace.resourceId,
        parentId: f0.resourceId,
        name: inputFolderpath[1],
        namepath: inputFolderpath.slice(0, 2),
      });
      const [f2] = await generateAndInsertTestFolders(1, {
        workspaceId: w1.rawWorkspace.resourceId,
        parentId: f1.resourceId,
        name: inputFolderpath[2],
        namepath: inputFolderpath,
      });

      const w1i1 = generateInput(w1.rawWorkspace);
      const w1i1a1 = populateWithAgent(w1i1, w1a1.agents, hasAccess);

      const input = [...w1i1a1].map(inputItem => ({
        ...inputItem,
        folderpath: stringifyFolderpath(f2, w1.rawWorkspace.rootname),
      }));

      const output: IAddFolderQueueOutput[] = [];
      const fn: QueueContextSubscribeJsonFn = response => {
        output.push(response as IAddFolderQueueOutput);
      };

      await readyChannel(input, fn);
      await insertInQueue(input);

      await startHandleAddFolderQueue(queueStart);
      await waitTimeout(1_000);
      await kUtilsInjectables.promises().flush();

      await checkFoldersNotDuplicated(input);
      output
        .filter(outputItem => outputItem.type !== kAddFolderQueueOutputType.ack)
        .forEach(outputItem => {
          if (hasAccess) {
            assert.ok(outputItem.type === kAddFolderQueueOutputType.success);
            expect(last(outputItem.folders)!.resourceId).toEqual(f2.resourceId);
          } else {
            assert.ok(outputItem.type === kAddFolderQueueOutputType.error);
            const error = new PermissionDeniedError();
            expect((outputItem.error as Error).name).toBe(error.name);
          }
        });
    }
  );
});
