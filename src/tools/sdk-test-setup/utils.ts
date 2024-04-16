import {faker} from '@faker-js/faker';
import {promises as fspromises} from 'fs';
import {Workspace} from '../../definitions/workspace';
import {INTERNAL_createAgentToken} from '../../endpoints/agentTokens/addToken/utils';
import {getPublicAgentToken} from '../../endpoints/agentTokens/utils';
import {addAssignedPermissionGroupList} from '../../endpoints/assignedItems/addAssignedItems';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../endpoints/contexts/injection/injectables';
import {SemanticProviderMutationTxnOptions} from '../../endpoints/contexts/semantic/types';
import INTERNAL_createWorkspace from '../../endpoints/workspaces/addWorkspace/internalCreateWorkspace';
import {makeRootnameFromName} from '../../endpoints/workspaces/utils';
import {kSystemSessionAgent} from '../../utils/agent';
import {appAssert} from '../../utils/assertion';

async function insertWorkspace(opts: SemanticProviderMutationTxnOptions) {
  const companyName = faker.company.name();
  return await INTERNAL_createWorkspace(
    {
      name: companyName,
      rootname: makeRootnameFromName(companyName),
      description: 'For SDK tests',
    },
    kSystemSessionAgent,
    undefined,
    opts
  );
}

async function createAgentToken(
  workspace: Workspace,
  opts: SemanticProviderMutationTxnOptions
) {
  const token = await INTERNAL_createAgentToken(
    kSystemSessionAgent,
    workspace,
    {
      name: faker.lorem.words(2),
      description: 'Agent token for SDK tests',
    },
    opts
  );
  appAssert(token.workspaceId, 'workspaceId not present in agent token');
  const tokenStr = getPublicAgentToken(token).tokenStr;
  return {tokenStr, token};
}

export async function setupSDKTestReq() {
  const {workspace, token, tokenStr} = await kSemanticModels
    .utils()
    .withTxn(async opts => {
      const {workspace, adminPermissionGroup} = await insertWorkspace(opts);
      const {token, tokenStr} = await createAgentToken(workspace, opts);
      await addAssignedPermissionGroupList(
        kSystemSessionAgent,
        workspace.resourceId,
        [{permissionGroupId: adminPermissionGroup.resourceId}],
        token.resourceId,
        false, // don't delete existing assigned permission groups
        true, // skip permission groups check
        /** skip auth check */ true,
        opts
      );
      return {workspace, token, tokenStr};
    }, /** reuseTxn */ false);

  try {
    const jsSdkTestEnvFilepath = './sdk/js-sdk/.env.test';
    await fspromises.access(jsSdkTestEnvFilepath);

    // TODO: pick server URL port from env file
    const envText = `FIMIDARA_TEST_WORKSPACE_ID="${workspace.resourceId}"
FIMIDARA_TEST_WORKSPACE_ROOTNAME="${workspace.rootname}"
FIMIDARA_TEST_AUTH_TOKEN="${tokenStr}"
FIMIDARA_TEST_FILEPATH="/src/testutils/testdata/testfile.txt"
FIMIDARA_SERVER_URL="http://localhost:5000"`;
    await fspromises.writeFile(jsSdkTestEnvFilepath, envText, 'utf-8');
    kUtilsInjectables.logger().log('Wrote to js sdk .env.test file');
  } catch (error: unknown) {
    kUtilsInjectables.logger().log('Error writing .env.test file');
    kUtilsInjectables.logger().error(error);
  }

  kUtilsInjectables.logger().log(`Workspace ID: ${workspace.resourceId}`);
  kUtilsInjectables.logger().log(`Workspace rootname: ${workspace.rootname}`);
  kUtilsInjectables.logger().log(`Agent token ID: ${token.resourceId}`);
  kUtilsInjectables.logger().log(`Agent token token: ${tokenStr}`);
}
