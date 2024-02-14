import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {PermissionGroupMatcher} from '../../../definitions/permissionGroups';
import {kAppResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deletePermissionGroup from './handler';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('permissionGroup permission group deleted', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {permissionGroup} = await insertPermissionGroupForTest(
    userToken,
    workspace.resourceId
  );
  const instData = RequestData.fromExpressRequest<PermissionGroupMatcher>(
    mockExpressRequestWithAgentToken(userToken),
    {permissionGroupId: permissionGroup.resourceId}
  );
  const result = await deletePermissionGroup(instData);
  assertEndpointResultOk(result);

  appAssert(result.jobId);
  const job = (await kSemanticModels.job().getOneByQuery({
    type: kJobType.deleteResource0,
    resourceId: result.jobId,
    params: {
      $objMatch: {type: kAppResourceType.PermissionGroup},
    },
  })) as Job<DeleteResourceJobParams>;
  expect(job).toBeTruthy();
  expect(job?.params).toMatchObject({
    resourceId: permissionGroup.resourceId,
    workspaceId: workspace.resourceId,
  });

  const dbItem = await kSemanticModels
    .permissionGroup()
    .getOneByQuery({resourceId: permissionGroup.resourceId, isDeleted: true});
  expect(dbItem).toBeTruthy();
});
