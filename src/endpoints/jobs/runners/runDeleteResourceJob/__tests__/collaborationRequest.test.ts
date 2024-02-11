import {CollaborationRequest} from '../../../../../definitions/collaborationRequest';
import {kAppResourceType} from '../../../../../definitions/system';
import {generateAndInsertCollaborationRequestListForTest} from '../../../../testUtils/generate/collaborationRequest';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {initTests} from '../../../../testUtils/testUtils';
import {deleteCollaborationRequestCascadeEntry} from '../collaborationRequest';
import {
  GenerateResourceFn,
  GenerateTypeChildrenDefinition,
  generatePermissionItemsAsChildren,
  noopGenerateTypeChildren,
  testDeleteResourceArtifactsJob,
  testDeleteResourceJob0,
  testDeleteResourceSelfJob,
} from './utils';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

const collaborationRequestGenerateTypeChildren: GenerateTypeChildrenDefinition<CollaborationRequest> =
  {
    ...noopGenerateTypeChildren,
    [kAppResourceType.PermissionItem]: generatePermissionItemsAsChildren,
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
      type: kAppResourceType.CollaborationRequest,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: collaborationRequestGenerateTypeChildren,
      deleteCascadeDef: deleteCollaborationRequestCascadeEntry,
      type: kAppResourceType.CollaborationRequest,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    await testDeleteResourceSelfJob({
      genResourceFn,
      type: kAppResourceType.CollaborationRequest,
    });
  });
});
