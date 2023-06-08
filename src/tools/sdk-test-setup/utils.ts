import {fimidaraConfig} from '@/resources/vars';
import {serverLogger} from '@/utils/logger/loggerUtils';
import {faker} from '@faker-js/faker';
import {getMongoConnection} from '../../db/connection';
import {Workspace} from '../../definitions/workspace';
import {internalCreateAgentToken} from '../../endpoints/agentTokens/addToken/utils';
import {getPublicAgentToken} from '../../endpoints/agentTokens/utils';
import {addAssignedPermissionGroupList} from '../../endpoints/assignedItems/addAssignedItems';
import BaseContext, {getFileProvider} from '../../endpoints/contexts/BaseContext';
import {SemanticDataAccessProviderMutationRunOptions} from '../../endpoints/contexts/semantic/types';
import {executeWithMutationRunOptions} from '../../endpoints/contexts/semantic/utils';
import {BaseContextType} from '../../endpoints/contexts/types';
import {
  getDataProviders,
  getLogicProviders,
  getMemstoreDataProviders,
  getMongoModels,
  getSemanticDataProviders,
  ingestDataIntoMemStore,
} from '../../endpoints/contexts/utils';
import NoopEmailProviderContext from '../../endpoints/testUtils/context/NoopEmailProviderContext';
import INTERNAL_createWorkspace from '../../endpoints/workspaces/addWorkspace/internalCreateWorkspace';
import {makeRootnameFromName} from '../../endpoints/workspaces/utils';
import {SYSTEM_SESSION_AGENT} from '../../utils/agent';
import {appAssert} from '../../utils/assertion';

async function setupContext() {
  const connection = await getMongoConnection(
    fimidaraConfig.mongoDbURI,
    fimidaraConfig.mongoDbDatabaseName
  );
  const models = getMongoModels(connection);
  const data = getDataProviders(models);
  const mem = getMemstoreDataProviders(models);
  const ctx = new BaseContext(
    data,
    new NoopEmailProviderContext(),
    getFileProvider(fimidaraConfig),
    fimidaraConfig,
    mem,
    getLogicProviders(),
    getSemanticDataProviders(mem),
    () => connection.close()
  );

  await ingestDataIntoMemStore(ctx);
  return ctx;
}

async function insertWorkspace(
  context: BaseContextType,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  const companyName = faker.company.name();
  return await INTERNAL_createWorkspace(
    context,
    {
      name: companyName,
      rootname: makeRootnameFromName(companyName),
      description: 'For SDK tests',
    },
    SYSTEM_SESSION_AGENT,
    undefined,
    opts
  );
}

async function createAgentToken(
  context: BaseContextType,
  workspace: Workspace,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  const token = await internalCreateAgentToken(
    context,
    SYSTEM_SESSION_AGENT,
    workspace,
    {
      name: faker.lorem.words(2),
      description: 'Agent token for SDK tests',
    },
    opts
  );
  appAssert(token.workspaceId);
  const tokenStr = getPublicAgentToken(context, token).tokenStr;
  return {tokenStr, token};
}

export async function setupSDKTestReq() {
  const context = await setupContext();
  const {workspace, token, tokenStr} = await executeWithMutationRunOptions(context, async opts => {
    const {workspace, adminPermissionGroup} = await insertWorkspace(context, opts);
    const {token, tokenStr} = await createAgentToken(context, workspace, opts);
    await addAssignedPermissionGroupList(
      context,
      SYSTEM_SESSION_AGENT,
      workspace.resourceId,
      [{permissionGroupId: adminPermissionGroup.resourceId}],
      token.resourceId,
      false, // don't delete existing assigned permission groups
      true, // skip permission groups check
      /** skip auth check */ true,
      opts
    );
    return {workspace, token, tokenStr};
  });

  serverLogger.info(`Workspace ID: ${workspace.resourceId}`);
  serverLogger.info(`Workspace rootname: ${workspace.rootname}`);
  serverLogger.info(`Agent token ID: ${token.resourceId}`);
  serverLogger.info(`Agent token token: ${tokenStr}`);
  await context.dispose();
}
