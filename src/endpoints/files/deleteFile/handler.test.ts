import assert from 'assert';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {
  DeleteResourceJobParams,
  Job,
  kJobType,
} from '../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {
  kUsageRecordCategory,
  kUsageRecordFulfillmentStatus,
  kUsageSummationType,
} from '../../../definitions/usageRecord.js';
import {appAssert} from '../../../utils/assertion.js';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import {getCostForUsage} from '../../usage/constants.js';
import {getUsageRecordReportingPeriod} from '../../usage/utils.js';
import {stringifyFilenamepath} from '../utils.js';
import deleteFile from './handler.js';
import {DeleteFileEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('deleteFile', () => {
  test('file deleted', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);
    const reqData = RequestData.fromExpressRequest<DeleteFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {filepath: stringifyFilenamepath(file, workspace.rootname)}
    );
    const result = await deleteFile(reqData);
    assertEndpointResultOk(result);

    appAssert(result.jobId);
    const job = (await kSemanticModels.job().getOneByQuery({
      type: kJobType.deleteResource,
      resourceId: result.jobId,
      params: {
        $objMatch: {type: kFimidaraResourceType.File},
      },
    })) as Job<DeleteResourceJobParams>;
    expect(job).toBeTruthy();
    expect(job?.params).toMatchObject({
      resourceId: file.resourceId,
      workspaceId: workspace.resourceId,
    });

    const dbItem = await kSemanticModels
      .file()
      .getOneByQuery({resourceId: file.resourceId, isDeleted: true});
    expect(dbItem).toBeTruthy();
  });

  test.only('storage usage record decremented', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    // const [usageL2] = await generateAndInsertUsageRecordList(/** count */ 1, {
    //   fulfillmentStatus: kUsageRecordFulfillmentStatus.fulfilled,
    //   summationType: kUsageSummationType.month,
    //   category: kUsageRecordCategory.storage,
    //   usageCost: faker.number.int({min: 1}),
    //   ...getUsageRecordReportingPeriod(),
    //   workspaceId: workspace.resourceId,
    //   usage: faker.number.int({min: 1}),
    //   persistent: true,
    // });
    const {file} = await insertFileForTest(userToken, workspace);
    const usageL2 = await kSemanticModels.usageRecord().getOneByQuery({
      status: kUsageRecordFulfillmentStatus.fulfilled,
      summationType: kUsageSummationType.month,
      category: kUsageRecordCategory.storage,
      ...getUsageRecordReportingPeriod(),
      workspaceId: workspace.resourceId,
    });
    assert(usageL2);

    const reqData = RequestData.fromExpressRequest<DeleteFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {filepath: stringifyFilenamepath(file, workspace.rootname)}
    );
    const result = await deleteFile(reqData);
    assertEndpointResultOk(result);
    await kUtilsInjectables.promises().flush();

    const dbUsageL2 = await kSemanticModels
      .usageRecord()
      .getOneById(usageL2.resourceId);
    assert(dbUsageL2);
    const expectedUsage = usageL2.usage - file.size;

    expect(dbUsageL2.usage).toBe(expectedUsage);
    expect(dbUsageL2.usageCost).toBe(
      getCostForUsage(kUsageRecordCategory.storage, expectedUsage)
    );
  });
});
