import {faker} from '@faker-js/faker';
import {getMongoConnection} from '../../db/connection';
import {systemAgent} from '../../definitions/system';
import {IWorkspace} from '../../definitions/workspace';
import BaseContext, {
  getCacheProviders,
  getDataProviders,
  getFileProvider,
  getLogicProviders,
} from '../../endpoints/contexts/BaseContext';
import MongoDBDataProviderContext from '../../endpoints/contexts/MongoDBDataProviderContext';
import {IBaseContext} from '../../endpoints/contexts/types';
import {internalCreateProgramAccessToken} from '../../endpoints/programAccessTokens/addToken/utils';
import {getPublicProgramToken} from '../../endpoints/programAccessTokens/utils';
import NoopEmailProviderContext from '../../endpoints/test-utils/context/NoopEmailProviderContext';
import internalCreateWorkspace from '../../endpoints/workspaces/addWorkspace/internalCreateWorkspace';
import {makeRootnameFromName} from '../../endpoints/workspaces/utils';
import {extractProdEnvsSchema, getAppVariables} from '../../resources/vars';
import {consoleLogger} from '../../utils/logger/logger';

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
  const companyName = faker.company.name();
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

  consoleLogger.info(`Workspace ID: ${workspace.resourceId}`);
  consoleLogger.info(`Workspace rootname: ${workspace.rootname}`);
  consoleLogger.info(`Program access token ID: ${token.resourceId}`);
  consoleLogger.info(`Program access token token: ${tokenStr}`);
  await context.dispose();
  return {workspace, token, tokenStr};
}
