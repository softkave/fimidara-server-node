import {faker} from '@faker-js/faker';
import {promises as fspromises} from 'fs';
import {kIjxSemantic, kIkxUtils} from '../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../contexts/semantic/types.js';
import {Workspace} from '../../definitions/workspace.js';
import {INTERNAL_createAgentToken} from '../../endpoints/agentTokens/addToken/utils.js';
import {getPublicAgentToken} from '../../endpoints/agentTokens/utils.js';
import {addAssignedPermissionGroupList} from '../../endpoints/assignedItems/addAssignedItems.js';
import INTERNAL_createWorkspace from '../../endpoints/workspaces/addWorkspace/internalCreateWorkspace.js';
import {makeRootnameFromName} from '../../endpoints/workspaces/utils.js';
import {kSystemSessionAgent} from '../../utils/agent.js';
import {appAssert} from '../../utils/assertion.js';

async function insertWorkspace(opts: SemanticProviderMutationParams) {
  const companyName = faker.company.name();
  return await INTERNAL_createWorkspace(
    {
      name: companyName,
      rootname: makeRootnameFromName(companyName),
      description: 'For SDK tests',
    },
    kSystemSessionAgent,
    /** userId */ undefined,
    opts
  );
}

async function createAgentToken(
  workspace: Workspace,
  opts: SemanticProviderMutationParams
) {
  const token = await INTERNAL_createAgentToken(
    kSystemSessionAgent,
    workspace.resourceId,
    {
      name: faker.lorem.words(2),
      description: 'Agent token for SDK tests',
    },
    opts
  );

  appAssert(token.workspaceId, 'workspaceId not present in agent token');
  const tokenStr = (await getPublicAgentToken(token, /** shouldEncode */ true))
    .jwtToken;

  return {tokenStr, token};
}

export async function setupSDKTestReq() {
  const {workspace, token, tokenStr} = await kIjxSemantic
    .utils()
    .withTxn(async opts => {
      const {workspace, adminPermissionGroup} = await insertWorkspace(opts);
      const {token, tokenStr} = await createAgentToken(workspace, opts);
      await addAssignedPermissionGroupList(
        kSystemSessionAgent,
        workspace.resourceId,
        [adminPermissionGroup.resourceId],
        token.resourceId,
        false, // don't delete existing assigned permission groups
        true, // skip permission groups check
        /** skip auth check */ true,
        opts
      );

      return {workspace, token, tokenStr};
    });

  try {
    const jsSdkTestEnvFilepath = './sdk/js-sdk/.env.test';
    await fspromises.access(jsSdkTestEnvFilepath);

    // TODO: pick server URL port from env file
    const envText = `FIMIDARA_TEST_WORKSPACE_ID="${workspace.resourceId}"
FIMIDARA_TEST_WORKSPACE_ROOTNAME="${workspace.rootname}"
FIMIDARA_TEST_AUTH_TOKEN="${tokenStr}"
FIMIDARA_TEST_FILEPATH="/src/testutils/testdata/testdata.txt"
FIMIDARA_TEST_FOLDER_PATH="/src/testutils/testdata"
FIMIDARA_SERVER_URL="http://localhost:${kIkxUtils.suppliedConfig().httpPort}"`;
    await fspromises.writeFile(jsSdkTestEnvFilepath, envText, 'utf-8');
    kIkxUtils.logger().log('Wrote to js sdk .env.test file');
  } catch (error: unknown) {
    kIkxUtils.logger().log('Error writing .env.test file');
    kIkxUtils.logger().error(error);
  }

  kIkxUtils.logger().log(`Workspace ID: ${workspace.resourceId}`);
  kIkxUtils.logger().log(`Workspace rootname: ${workspace.rootname}`);
  kIkxUtils.logger().log(`Agent token ID: ${token.resourceId}`);
  kIkxUtils.logger().log(`Agent token token: ${tokenStr}`);
}
