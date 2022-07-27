import {faker} from '@faker-js/faker';
import {getMongoConnection} from '../../src/db/connection';
import {systemAgent} from '../../src/definitions/system';
import {IWorkspace} from '../../src/definitions/workspace';
import BaseContext, {
  getCacheProviders,
  getDataProviders,
  getFileProvider,
  getLogicProviders,
  IBaseContext,
} from '../../src/endpoints/contexts/BaseContext';
import MongoDBDataProviderContext from '../../src/endpoints/contexts/MongoDBDataProviderContext';
import {internalCreateProgramAccessToken} from '../../src/endpoints/programAccessTokens/addToken/utils';
import {getPublicProgramToken} from '../../src/endpoints/programAccessTokens/utils';
import NoopEmailProviderContext from '../../src/endpoints/test-utils/context/NoopEmailProviderContext';
import internalCreateWorkspace from '../../src/endpoints/workspaces/addWorkspace/internalCreateWorkspace';
import {makeRootnameFromName} from '../../src/endpoints/workspaces/utils';
import {
  extractProdEnvsSchema,
  getAppVariables,
} from '../../src/resources/appVariables';

async function setupContext() {
  const appVariables = getAppVariables(extractProdEnvsSchema);
  const connection = await getMongoConnection(
    appVariables.mongoDbURI,
    appVariables.mongoDbDatabaseName
  );

  const mongoDBDataProvider = new MongoDBDataProviderContext(connection);
  const emailProvider = new NoopEmailProviderContext();
  const ctx = new BaseContext(
    mongoDBDataProvider,
    emailProvider,
    getFileProvider(appVariables),
    appVariables,
    getDataProviders(connection),
    getCacheProviders(),
    getLogicProviders(),
    () => connection.close()
  );

  return ctx;
}

async function insertWorkspace(context: IBaseContext) {
  const companyName = faker.company.companyName();
  return await internalCreateWorkspace(
    context,
    {
      name: companyName,
      rootname: makeRootnameFromName(companyName),
      description: 'For SDK tests',
    },
    systemAgent
  );
}

async function createProgramAccessToken(
  context: IBaseContext,
  workspace: IWorkspace,
  adminPermissionGroupId: string
) {
  const token = await internalCreateProgramAccessToken(
    context,
    systemAgent,
    workspace,
    {
      name: faker.lorem.words(2),
      description: 'Program access token for SDK tests',
      permissionGroups: [
        {
          permissionGroupId: adminPermissionGroupId,
          order: 1,
        },
      ],
    },
    {
      skipPermissionGroupsCheck: true,
    }
  );

  const tokenStr = getPublicProgramToken(context, token).tokenStr;
  return {token, tokenStr};
}

export async function setupSDKTestReq() {
  const context = await setupContext();
  const {workspace, adminPermissionGroup} = await insertWorkspace(context);
  const {token, tokenStr} = await createProgramAccessToken(
    context,
    workspace,
    adminPermissionGroup.resourceId
  );

  console.log(`Workspace ID: ${workspace.resourceId}`);
  console.log(`Workspace rootname: ${workspace.rootname}`);
  console.log(`Program access token ID: ${token.resourceId}`);
  console.log(`Program access token token: ${tokenStr}`);
  await context.dispose();
  return {workspace, token, tokenStr};
}
