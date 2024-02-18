import {flatten} from 'lodash';
import {AgentToken} from '../../../../../definitions/agentToken';
import {kAppResourceType} from '../../../../../definitions/system';
import {generateAndInsertAgentTokenListForTest} from '../../../../testUtils/generate/agentToken';
import {generateAndInsertTestPresignedPathList} from '../../../../testUtils/generate/file';
import {generateAndInsertAssignedItemListForTest} from '../../../../testUtils/generate/permissionGroup';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {initTests} from '../../../../testUtils/testUtils';
import {deleteAgentTokenCascadeEntry} from '../agentToken';
import {
  GenerateResourceFn,
  GenerateTypeChildrenDefinition,
  generatePermissionItemsAsChildren,
  noopGenerateTypeChildren,
  testDeleteResourceArtifactsJob,
  testDeleteResourceJob0,
  testDeleteResourceSelfJob,
} from './testUtils';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

const agentTokenGenerateTypeChildren: GenerateTypeChildrenDefinition<AgentToken> = {
  ...noopGenerateTypeChildren,
  [kAppResourceType.PermissionItem]: generatePermissionItemsAsChildren,
  [kAppResourceType.AssignedItem]: async ({resource, workspaceId}) =>
    flatten(
      await Promise.all([
        generateAndInsertAssignedItemListForTest(2, {
          workspaceId,
          assigneeId: resource.resourceId,
        }),
      ])
    ),
  [kAppResourceType.PresignedPath]: async ({resource, workspaceId}) =>
    flatten(
      await Promise.all([
        generateAndInsertTestPresignedPathList(2, {
          workspaceId,
          issuerAgentTokenId: resource.resourceId,
        }),
      ])
    ),
};

const genResourceFn: GenerateResourceFn<AgentToken> = async ({workspaceId}) => {
  const [agentToken] = await generateAndInsertAgentTokenListForTest(1, {
    workspaceId,
  });
  return agentToken;
};

describe('runDeleteResourceJob, agent token', () => {
  test('deleteResource0', async () => {
    testDeleteResourceJob0({
      genResourceFn,
      type: kAppResourceType.AgentToken,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: agentTokenGenerateTypeChildren,
      deleteCascadeDef: deleteAgentTokenCascadeEntry,
      type: kAppResourceType.AgentToken,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    await testDeleteResourceSelfJob({
      genResourceFn,
      type: kAppResourceType.AgentToken,
    });
  });
});
