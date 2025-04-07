import {flatten} from 'lodash-es';
import {afterAll, beforeAll, describe, test} from 'vitest';
import {AgentToken} from '../../../../../definitions/agentToken.js';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {generateAndInsertAgentTokenListForTest} from '../../../../testHelpers/generate/agentToken.js';
import {generateAndInsertTestPresignedPathList} from '../../../../testHelpers/generate/file.js';
import {generateAndInsertAssignedItemListForTest} from '../../../../testHelpers/generate/permissionGroup.js';
import {completeTests} from '../../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../../testHelpers/utils.js';
import {deleteAgentTokenCascadeEntry} from '../agentToken.js';
import {
  GenerateResourceFn,
  GenerateTypeChildrenDefinition,
  generatePermissionItemsAsChildren,
  noopGenerateTypeChildren,
  testDeleteResourceArtifactsJob,
} from './testUtils.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

const agentTokenGenerateTypeChildren: GenerateTypeChildrenDefinition<AgentToken> =
  {
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
  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: agentTokenGenerateTypeChildren,
      deleteCascadeDef: deleteAgentTokenCascadeEntry,
      type: kFimidaraResourceType.AgentToken,
    });
  });
});
