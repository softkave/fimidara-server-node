import {flatten} from 'lodash';
import {AgentToken} from '../../../../../definitions/agentToken';
import {kFimidaraResourceType} from '../../../../../definitions/system';
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
  [kFimidaraResourceType.PermissionItem]: generatePermissionItemsAsChildren,
  [kFimidaraResourceType.AssignedItem]: async ({resource, workspaceId}) =>
    flatten(
      await Promise.all([
        generateAndInsertAssignedItemListForTest(2, {
          workspaceId,
          assigneeId: resource.resourceId,
        }),
      ])
    ),
  [kFimidaraResourceType.PresignedPath]: async ({resource, workspaceId}) =>
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
      type: kFimidaraResourceType.AgentToken,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: agentTokenGenerateTypeChildren,
      deleteCascadeDef: deleteAgentTokenCascadeEntry,
      type: kFimidaraResourceType.AgentToken,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    await testDeleteResourceSelfJob({
      genResourceFn,
      type: kFimidaraResourceType.AgentToken,
    });
  });
});
