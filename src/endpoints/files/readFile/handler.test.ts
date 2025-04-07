import {faker} from '@faker-js/faker';
import assert from 'assert';
import {difference} from 'lodash-es';
import {expectErrorThrownAsync, waitTimeout} from 'softkave-js-utils';
import {Readable} from 'stream';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {
  FilePersistenceProvider,
  PersistedFile,
} from '../../../contexts/file/types.js';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../contexts/ijx/register.js';
import {getStringListQuery} from '../../../contexts/semantic/utils.js';
import {ResolvedMountEntry} from '../../../definitions/fileBackend.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {
  FileUsageRecordArtifact,
  UsageRecordCategory,
  kUsageRecordCategory,
  kUsageRecordFulfillmentStatus,
  kUsageSummationType,
} from '../../../definitions/usageRecord.js';
import {UsageThresholdsByCategory} from '../../../definitions/workspace.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {pathJoin, streamToBuffer} from '../../../utils/fns.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {makeUserSessionAgent} from '../../../utils/sessionUtils.js';
import {addRootnameToPath, stringifyFolderpath} from '../../folders/utils.js';
import RequestData from '../../RequestData.js';
import NoopFilePersistenceProviderContext from '../../testHelpers/context/file/NoopFilePersistenceProviderContext.js';
import {
  generateTestFileName,
  generateTestFilepathString,
} from '../../testHelpers/generate/file.js';
import {generateAndInsertUsageRecordList} from '../../testHelpers/generate/usageRecord.js';
import {
  getTestSessionAgent,
  kTestSessionAgentTypes,
} from '../../testHelpers/helpers/agent.js';
import {
  expectFileBodyEqual,
  expectFileBodyEqualById,
} from '../../testHelpers/helpers/file.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertFileBackendMountForTest,
  insertFileForTest,
  insertFolderForTest,
  insertPermissionItemsForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import {getCostForUsage} from '../../usageRecords/constants.js';
import {UsageLimitExceededError} from '../../usageRecords/errors.js';
import {getUsageRecordReportingPeriod} from '../../usageRecords/utils.js';
import {PermissionDeniedError} from '../../users/errors.js';
import {stringifyFilenamepath} from '../utils.js';
import readFile from './handler.js';
import {ReadFileEndpointParams} from './types.js';
import sharp = require('sharp');

const kUsageRefreshWorkspaceIntervalMs = 100;
const kUsageCommitIntervalMs = 50;

beforeAll(async () => {
  await initTests({
    usageRefreshWorkspaceIntervalMs: kUsageRefreshWorkspaceIntervalMs,
    usageCommitIntervalMs: kUsageCommitIntervalMs,
  });
});

afterAll(async () => {
  await completeTests();
});

async function getUsageL2(workspaceId: string, category: UsageRecordCategory) {
  return await kIjxSemantic.usageRecord().getOneByQuery({
    ...getUsageRecordReportingPeriod(),
    status: kUsageRecordFulfillmentStatus.fulfilled,
    summationType: kUsageSummationType.month,
    workspaceId,
    category,
  });
}

async function getUsageL1(
  workspaceId: string,
  category: UsageRecordCategory,
  filepath: string[]
) {
  return await kIjxSemantic.usageRecord().getOneByQuery({
    ...getUsageRecordReportingPeriod(),
    status: kUsageRecordFulfillmentStatus.fulfilled,
    summationType: kUsageSummationType.instance,
    workspaceId,
    category,
    artifacts: {
      $elemMatch: {
        artifact: {
          $objMatch: getStringListQuery<FileUsageRecordArtifact>(
            filepath,
            /** prefix */ 'filepath',
            /** op */ '$regex',
            /** includeSizeOp */ true
          ),
        },
      },
    },
  });
}

describe('readFile', () => {
  test.each(kTestSessionAgentTypes)(
    'file returned using %s',
    async agentType => {
      const {
        sessionAgent,
        workspace,
        adminUserToken: userToken,
      } = await getTestSessionAgent(agentType, {
        permissions: {
          actions: [kFimidaraPermissionActions.readFile],
        },
      });
      const {file} = await insertFileForTest(userToken, workspace);

      const reqData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
        mockExpressRequestWithAgentToken(sessionAgent.agentToken),
        /** data */ {filepath: stringifyFilenamepath(file, workspace.rootname)}
      );
      const result = await readFile(reqData);
      assertEndpointResultOk(result);

      await expectFileBodyEqualById(file.resourceId, result.stream);
    }
  );

  test('file resized', async () => {
    const {
      sessionAgent,
      workspace,
      adminUserToken: userToken,
    } = await getTestSessionAgent(kFimidaraResourceType.User, {
      permissions: {actions: [kFimidaraPermissionActions.readFile]},
    });
    const startWidth = 500;
    const startHeight = 500;
    const {file} = await insertFileForTest(
      userToken,
      workspace,
      /** file input */ {},
      /** file type */ 'png',
      /** image props */ {width: startWidth, height: startHeight}
    );

    const expectedWidth = 300;
    const expectedHeight = 300;
    const reqData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestWithAgentToken(sessionAgent.agentToken),
      /** data */ {
        filepath: stringifyFilenamepath(file, workspace.rootname),
        imageResize: {width: expectedWidth, height: expectedHeight},
      }
    );
    const result = await readFile(reqData);
    assertEndpointResultOk(result);

    const resultBuffer = await streamToBuffer(result.stream);
    assert(resultBuffer);
    const fileMetadata = await sharp(resultBuffer).metadata();
    expect(fileMetadata.width).toEqual(expectedWidth);
    expect(fileMetadata.height).toEqual(expectedHeight);
  });

  test.each(kTestSessionAgentTypes)(
    '%s can read file from public folder',
    async agentType => {
      const {workspace, adminUserToken: userToken} =
        await getTestSessionAgent(agentType);
      const {folder} = await insertFolderForTest(userToken, workspace);
      await insertPermissionItemsForTest(userToken, workspace.resourceId, {
        targetId: folder.resourceId,
        action: kFimidaraPermissionActions.readFile,
        access: true,
        entityId: workspace.publicPermissionGroupId,
      });

      const {file} = await insertFileForTest(userToken, workspace, {
        filepath: addRootnameToPath(
          pathJoin(
            folder.namepath.concat([
              generateTestFileName({includeStraySlashes: true}),
            ])
          ),
          workspace.rootname
        ),
      });

      const reqData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
        mockExpressRequestForPublicAgent(),
        {filepath: stringifyFilenamepath(file, workspace.rootname)}
      );
      const result = await readFile(reqData);
      assertEndpointResultOk(result);
    }
  );

  test.each(kTestSessionAgentTypes)(
    '%s can read public file',
    async agentType => {
      const {workspace, adminUserToken} = await getTestSessionAgent(agentType);
      const {file} = await insertFileForTest(adminUserToken, workspace);
      await insertPermissionItemsForTest(adminUserToken, workspace.resourceId, {
        targetId: file.resourceId,
        action: kFimidaraPermissionActions.readFile,
        access: true,
        entityId: workspace.publicPermissionGroupId,
      });

      const reqData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
        mockExpressRequestForPublicAgent(),
        {filepath: stringifyFilenamepath(file, workspace.rootname)}
      );
      const result = await readFile(reqData);
      assertEndpointResultOk(result);
    }
  );

  test.each(kTestSessionAgentTypes)(
    '%s cannot read private file',
    async agentType => {
      const {
        sessionAgent,
        workspace,
        adminUserToken: userToken,
      } = await getTestSessionAgent(agentType);

      const {file} = await insertFileForTest(userToken, workspace);
      await insertPermissionItemsForTest(userToken, workspace.resourceId, {
        targetId: file.resourceId,
        action: kFimidaraPermissionActions.readFile,
        access: false,
        entityId:
          agentType === kFimidaraResourceType.Public
            ? workspace.publicPermissionGroupId
            : sessionAgent.agentId,
      });

      try {
        const reqData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
          mockExpressRequestForPublicAgent(),
          {filepath: stringifyFilenamepath(file, workspace.rootname)}
        );
        await readFile(reqData);
      } catch (error) {
        expect((error as Error)?.name).toBe(PermissionDeniedError.name);
      }
    }
  );

  test('reads file from other entries if primary entry is not present', async () => {
    const {userToken, rawUser} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace, {
      filepath: generateTestFilepathString({rootname: workspace.rootname}),
    });
    const {mount} = await insertFileBackendMountForTest(userToken, workspace, {
      folderpath: stringifyFolderpath(
        {namepath: file.namepath.slice(0, -1)},
        workspace.rootname
      ),
    });

    await kIjxSemantic.utils().withTxn(async opts => {
      const entry = newWorkspaceResource<ResolvedMountEntry>(
        makeUserSessionAgent(rawUser, userToken),
        kFimidaraResourceType.ResolvedMountEntry,
        workspace.resourceId,
        /** seed */ {
          mountId: mount.resourceId,
          forType: kFimidaraResourceType.Folder,
          forId: file.resourceId,
          backendNamepath: file.namepath,
          backendExt: file.ext,
          fimidaraNamepath: file.namepath,
          fimidaraExt: file.ext,
          persisted: {
            mountId: mount.resourceId,
            encoding: file.encoding,
            mimetype: file.mimetype,
            size: file.size,
            lastUpdatedAt: file.lastUpdatedAt,
            filepath: stringifyFilenamepath(file),
            raw: undefined,
          },
        }
      );

      await kIjxSemantic.resolvedMountEntry().insertItem(entry, opts);
    });

    const testBuffer = Buffer.from('Reading from secondary mount source');
    const testStream = Readable.from([testBuffer]);
    kRegisterIjxUtils.fileProviderResolver(forMount => {
      if (mount.resourceId === forMount.resourceId) {
        class SecondaryFileProvider
          extends NoopFilePersistenceProviderContext
          implements FilePersistenceProvider
        {
          readFile = async (): Promise<PersistedFile> => ({
            body: testStream,
            size: testBuffer.byteLength,
          });
        }

        return new SecondaryFileProvider();
      } else {
        return new NoopFilePersistenceProviderContext();
      }
    });

    const reqData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {filepath: stringifyFilenamepath(file, workspace.rootname)}
    );
    const result = await readFile(reqData);
    assertEndpointResultOk(result);

    await expectFileBodyEqual(testBuffer, result.stream);
  });

  test('returns an empty stream if file exists and backends do not have file', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace, {
      filepath: generateTestFilepathString({rootname: workspace.rootname}),
    });

    kRegisterIjxUtils.fileProviderResolver(() => {
      return new NoopFilePersistenceProviderContext();
    });

    const reqData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {filepath: stringifyFilenamepath(file, workspace.rootname)}
    );
    const result = await readFile(reqData);
    assertEndpointResultOk(result);

    const testBuffer = Buffer.from([]);
    await expectFileBodyEqual(testBuffer, result.stream);
  });

  test('increments usage', async () => {
    const {
      adminUserToken: userToken,
      sessionAgent,
      workspace,
    } = await getTestSessionAgent(kFimidaraResourceType.User, {
      permissions: {
        actions: [kFimidaraPermissionActions.readFile],
      },
    });
    const {file} = await insertFileForTest(userToken, workspace);

    const reqData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestWithAgentToken(sessionAgent.agentToken),
      /** data */ {filepath: stringifyFilenamepath(file, workspace.rootname)}
    );
    const result = await readFile(reqData);
    assertEndpointResultOk(result);

    await waitTimeout(kUsageCommitIntervalMs * 1.5);
    const [dbBandwidthOutUsageL1, dbBandwidthOutUsageL2, dbTotalUsageL2] =
      await Promise.all([
        getUsageL1(
          workspace.resourceId,
          kUsageRecordCategory.bandwidthOut,
          file.namepath
        ),
        getUsageL2(workspace.resourceId, kUsageRecordCategory.bandwidthOut),
        getUsageL2(workspace.resourceId, kUsageRecordCategory.total),
      ]);

    assert(dbBandwidthOutUsageL1);
    assert(dbBandwidthOutUsageL2);
    assert(dbTotalUsageL2);

    expect(dbBandwidthOutUsageL2.usage).toBe(file.size);
    expect(dbBandwidthOutUsageL2.usageCost).toBe(
      getCostForUsage(kUsageRecordCategory.bandwidthOut, file.size)
    );

    expect(dbTotalUsageL2.usageCost).toBeGreaterThanOrEqual(
      dbBandwidthOutUsageL2.usageCost
    );
  });

  test.each([kUsageRecordCategory.bandwidthOut, kUsageRecordCategory.total])(
    'fails if usage exceeded for category=%s',
    async category => {
      const {
        adminUserToken: userToken,
        sessionAgent,
        workspace,
      } = await getTestSessionAgent(kFimidaraResourceType.User, {
        permissions: {
          actions: [kFimidaraPermissionActions.readFile],
        },
      });

      // create a usage record so we can use their IDs to retrieve them later from
      // the db
      const [[usageL2], [usageDroppedL2]] = await Promise.all([
        generateAndInsertUsageRecordList(/** count */ 1, {
          status: kUsageRecordFulfillmentStatus.fulfilled,
          summationType: kUsageSummationType.month,
          usageCost: 0,
          ...getUsageRecordReportingPeriod(),
          usage: 0,
          workspaceId: workspace.resourceId,
          category,
        }),
        generateAndInsertUsageRecordList(/** count */ 1, {
          status: kUsageRecordFulfillmentStatus.dropped,
          summationType: kUsageSummationType.month,
          usageCost: 0,
          ...getUsageRecordReportingPeriod(),
          usage: 0,
          workspaceId: workspace.resourceId,
          category,
        }),
      ]);
      assert(usageL2);

      const {file} = await insertFileForTest(userToken, workspace);

      await kIjxSemantic.utils().withTxn(opts =>
        kIjxSemantic.workspace().updateOneById(
          workspace.resourceId,
          {
            usageThresholds: {
              [category]: {
                lastUpdatedBy: kSystemSessionAgent,
                budget: usageL2.usageCost - 1,
                lastUpdatedAt: Date.now(),
                usage: usageL2.usage - 1,
                category,
              },
            },
          },
          opts
        )
      );

      await waitTimeout(kUsageRefreshWorkspaceIntervalMs * 2);
      await expectErrorThrownAsync(
        async () => {
          const reqData =
            RequestData.fromExpressRequest<ReadFileEndpointParams>(
              mockExpressRequestWithAgentToken(sessionAgent.agentToken),
              /** data */ {
                filepath: stringifyFilenamepath(file, workspace.rootname),
              }
            );
          await readFile(reqData);
        },
        {
          expectFn: error => {
            expect(error).toBeInstanceOf(UsageLimitExceededError);
            assert(error instanceof UsageLimitExceededError);
            expect(error.blockingCategory).toBe(category);
          },
        }
      );

      await waitTimeout(kUsageCommitIntervalMs * 1.5);

      const [dbUsageL2, dbUsageDroppedL2] = await Promise.all([
        kIjxSemantic.usageRecord().getOneById(usageL2.resourceId),
        usageDroppedL2
          ? kIjxSemantic.usageRecord().getOneById(usageDroppedL2.resourceId)
          : undefined,
      ]);
      assert(dbUsageL2);

      expect(dbUsageL2.usage).toBeGreaterThanOrEqual(usageL2.usage);
      expect(dbUsageL2.usageCost).toBeGreaterThanOrEqual(usageL2.usageCost);

      if (category !== kUsageRecordCategory.total) {
        assert(dbUsageDroppedL2);
        expect(dbUsageDroppedL2.usage).toBe(usageDroppedL2.usage + file.size);
        expect(dbUsageDroppedL2.usageCost).toBe(
          usageDroppedL2.usageCost + getCostForUsage(category, file.size)
        );
      }
    }
  );

  test('does not fail if usage exceeded for non total or bout usage', async () => {
    const {
      sessionAgent,
      workspace,
      adminUserToken: userToken,
    } = await getTestSessionAgent(kFimidaraResourceType.User, {
      permissions: {
        actions: [kFimidaraPermissionActions.readFile],
      },
    });
    const {file} = await insertFileForTest(userToken, workspace);
    const usage = faker.number.int({min: 1});
    const usageCost = faker.number.int({min: 1});
    const categories = difference(Object.values(kUsageRecordCategory), [
      kUsageRecordCategory.bandwidthOut,
      kUsageRecordCategory.total,
    ]);
    await kIjxSemantic.utils().withTxn(opts =>
      kIjxSemantic.workspace().updateOneById(
        workspace.resourceId,
        {
          usageThresholds: {
            ...categories.reduce(
              (acc, category) => ({
                [category]: {
                  lastUpdatedBy: kSystemSessionAgent,
                  lastUpdatedAt: Date.now(),
                  budget: usageCost,
                  category,
                  usage,
                },
              }),
              {} as UsageThresholdsByCategory
            ),
          },
        },
        opts
      )
    );

    const reqData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestWithAgentToken(sessionAgent.agentToken),
      /** data */ {
        filepath: stringifyFilenamepath(file, workspace.rootname),
      }
    );
    const result = await readFile(reqData);
    assertEndpointResultOk(result);
  });
});
