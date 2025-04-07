import {afterAll, beforeAll, describe, test} from 'vitest';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {Tag} from '../../../../../definitions/tag.js';
import {generateAndInsertTagListForTest} from '../../../../testHelpers/generate/tag.js';
import {completeTests} from '../../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../../testHelpers/utils.js';
import {deleteTagCascadeEntry} from '../tag.js';
import {
  GenerateResourceFn,
  GenerateTypeChildrenDefinition,
  generateAssignedItemsAsChildren,
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

const tagGenerateTypeChildren: GenerateTypeChildrenDefinition<Tag> = {
  ...noopGenerateTypeChildren,
  [kFimidaraResourceType.PermissionItem]: generatePermissionItemsAsChildren,
  [kFimidaraResourceType.AssignedItem]: generateAssignedItemsAsChildren,
};
const genResourceFn: GenerateResourceFn<Tag> = async ({workspaceId}) => {
  const [tag] = await generateAndInsertTagListForTest(1, {
    workspaceId,
  });
  return tag;
};

describe('runDeleteResourceJob, tag', () => {
  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: tagGenerateTypeChildren,
      deleteCascadeDef: deleteTagCascadeEntry,
      type: kFimidaraResourceType.Tag,
    });
  });
});
