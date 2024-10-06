import assert from 'assert';
import {flatten, keyBy, last, uniq, uniqBy} from 'lodash-es';
import {
  getNewId,
  kLoopAsyncSettlementType,
  loopAndCollate,
  loopAndCollateAsync,
  OmitFrom,
  waitTimeout,
} from 'softkave-js-utils';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {QueueContextSubscribeJsonFn} from '../../../contexts/pubsub/types.js';
import {AgentToken} from '../../../definitions/agentToken.js';
import {Folder} from '../../../definitions/folder.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {Agent, kFimidaraResourceType} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {NotFoundError} from '../../errors.js';
import {generateTestFolderpath} from '../../testUtils/generate/folder.js';
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
import {handleAddFolderQueue} from './handleAddFolderQueue.js';
import {
  IAddFolderQueueInput,
  IAddFolderQueueOutput,
  kAddFolderQueueOutputType,
} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

interface ITestAddFolderQueueInput extends IAddFolderQueueInput {
  hasAccess: boolean;
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
      agents.map(agent => ({hasAccess, ...inputItem, ...agent, id: getNewId()}))
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

  await kUtilsInjectables.queue().addMessages(queueKey, input);
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
    folder => folder!.namepath.join('/')
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
      assert.ok(!folder);
    }
  });
}

async function checkFoldersNotDuplicated(input: IAddFolderQueueInput[]) {
  const {folders, foldersRecord} = await getFoldersFromDB(input);
  const uniqInput = uniqBy(input, inputItem => inputItem.folderpath);

  assert.ok(folders.length === uniqInput.length);
  uniqInput.forEach(inputItem => {
    const folder = foldersRecord[inputItem.folderpath];
    assert.ok(folder);
  });
}

async function checkAckNotified(
  input: IAddFolderQueueInput[],
  output: IAddFolderQueueOutput[]
) {
  const acks = output.filter(
    outputItem => outputItem.type === kAddFolderQueueOutputType.ack
  );
  assert.ok(acks.length === input.length);
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

    if (inputItem.hasAccess) {
      assert.ok(outputItem.type === kAddFolderQueueOutputType.success);
      expect(outputItem.folders.length).toBeGreaterThan(0);
      expect(last(outputItem.folders)!.namepath.join('/')).toBe(
        getFolderpathInfo(inputItem.folderpath, {
          allowRootFolder: false,
          containsRootname: true,
        }).stringPath
      );
    } else {
      assert.ok(outputItem.type === kAddFolderQueueOutputType.error);
      assert.ok(outputItem.error instanceof PermissionDeniedError);
      const expectedError = new PermissionDeniedError();
      expect(outputItem.error.message).toBe(expectedError.message);
      expect(outputItem.error.name).toBe(expectedError.name);
    }
  });
}

describe('handleAddFolderQueue', () => {
  beforeEach(() => {
    kUtilsInjectables.runtimeState().setIsEnded(false);
  });

  afterEach(() => {
    kUtilsInjectables.runtimeState().setIsEnded(true);
  });

  test('handleAddFolderQueue', async () => {
    const {userToken} = await insertUserForTest();
    const [w1, w2] = await Promise.all([
      insertWorkspaceForTest(userToken),
      insertWorkspaceForTest(userToken),
    ]);

    const [w1a1, w1a2, w2a1, w2a2] = await Promise.all([
      generateTokens(userToken, w1.rawWorkspace, 2, /** hasAccess */ true),
      generateTokens(userToken, w1.rawWorkspace, 2, /** hasAccess */ false),
      generateTokens(userToken, w2.rawWorkspace, 2, /** hasAccess */ true),
      generateTokens(userToken, w2.rawWorkspace, 2, /** hasAccess */ false),
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

    const input2 = input.concat(input).map(inputItem => ({
      ...inputItem,
      id: getNewId(),
    }));
    await insertInQueue(input2);

    await handleAddFolderQueue();

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

    const w1i1 = generateInput(w1.rawWorkspace);
    const w1i1a1 = populateWithAgent(w1i1, w1a1.agents, /** hasAccess */ true);
    const input = [...w1i1a1];

    const output: IAddFolderQueueOutput[] = [];
    const fn: QueueContextSubscribeJsonFn = response => {
      output.push(response as IAddFolderQueueOutput);
    };

    await readyChannel(input, fn);
    await insertInQueue(input);

    await handleAddFolderQueue();

    output.forEach(outputItem => {
      assert.ok(outputItem.type === kAddFolderQueueOutputType.error);
      assert.ok(outputItem.error instanceof NotFoundError);
      const expectedError = new NotFoundError('Workspace not found');
      expect(outputItem.error.name).toBe(expectedError.name);
      expect(outputItem.error.message).toBe(expectedError.message);
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

    await handleAddFolderQueue();

    output.forEach(outputItem => {
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

    await handleAddFolderQueue();

    await readyChannel(input, fn);
    await insertInQueue(input);

    await waitTimeout(1000);

    await checkFoldersCreatedInDB(w1i1a1, /** shouldBeCreated */ true);
    await checkFoldersNotDuplicated(input);
    await checkAckNotified(input, output);
    await checkCorrectResponseReturned(input, output);
  });
});
