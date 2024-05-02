import {CollaborationRequest} from '../../../../../definitions/collaborationRequest.js';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {generateAndInsertCollaborationRequestListForTest} from '../../../../testUtils/generate/collaborationRequest.js';
import {completeTests} from '../../../../testUtils/helpers/testFns.js';
import {initTests} from '../../../../testUtils/testUtils.js';
import {deleteCollaborationRequestCascadeEntry} from '../collaborationRequest.js';
import {
  GenerateResourceFn,
  GenerateTypeChildrenDefinition,
  generatePermissionItemsAsChildren,
  noopGenerateTypeChildren,
  testDeleteResourceArtifactsJob,
  testDeleteResourceJob0,
  testDeleteResourceSelfJob,
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

const genResourceFn: GenerateResourceFn<CollaborationRequest> = async ({workspaceId}) => {
  const [collaborationRequest] = await generateAndInsertCollaborationRequestListForTest(
    1,
    () => ({workspaceId})
  );
  return collaborationRequest;
};

describe('runDeleteResourceJob, collaboration request', () => {
  test('deleteResource0', async () => {
    testDeleteResourceJob0({
      genResourceFn,
      type: kFimidaraResourceType.CollaborationRequest,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: collaborationRequestGenerateTypeChildren,
      deleteCascadeDef: deleteCollaborationRequestCascadeEntry,
      type: kFimidaraResourceType.CollaborationRequest,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    await testDeleteResourceSelfJob({
      genResourceFn,
      type: kFimidaraResourceType.CollaborationRequest,
    });
  });
});
