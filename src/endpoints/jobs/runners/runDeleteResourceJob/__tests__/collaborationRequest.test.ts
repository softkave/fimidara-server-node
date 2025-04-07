import {afterAll, beforeAll, describe, test} from 'vitest';
import {CollaborationRequest} from '../../../../../definitions/collaborationRequest.js';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {generateAndInsertCollaborationRequestListForTest} from '../../../../testHelpers/generate/collaborationRequest.js';
import {completeTests} from '../../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../../testHelpers/utils.js';
import {deleteCollaborationRequestCascadeEntry} from '../collaborationRequest.js';
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

const collaborationRequestGenerateTypeChildren: GenerateTypeChildrenDefinition<CollaborationRequest> =
  {
    ...noopGenerateTypeChildren,
    [kFimidaraResourceType.PermissionItem]: generatePermissionItemsAsChildren,
  };

const genResourceFn: GenerateResourceFn<CollaborationRequest> = async ({
  workspaceId,
}) => {
  const [collaborationRequest] =
    await generateAndInsertCollaborationRequestListForTest(1, () => ({
      workspaceId,
    }));
  return collaborationRequest;
};

describe('runDeleteResourceJob, collaboration request', () => {
  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: collaborationRequestGenerateTypeChildren,
      deleteCascadeDef: deleteCollaborationRequestCascadeEntry,
      type: kFimidaraResourceType.CollaborationRequest,
    });
  });
});
