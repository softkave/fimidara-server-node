import * as cors from 'cors';
import * as express from 'express';
import * as expressJwt from 'express-jwt';
import * as http from 'http';
import * as multer from 'multer';
import handleErrors from './middlewares/handleErrors';
import httpToHttps from './middlewares/httpToHttps';
import {getMongoConnection} from './db/connection';
import BaseContext, {
  getCacheProviders,
  getDataProviders,
  getLogicProviders,
  IBaseContext,
} from './endpoints/contexts/BaseContext';
import setupAccountRESTEndpoints from './endpoints/user/setupRESTEndpoints';
import MongoDBDataProviderContext from './endpoints/contexts/MongoDBDataProviderContext';
import setupClientAssignedTokensRESTEndpoints from './endpoints/clientAssignedTokens/setupRESTEndpoints';
import setupCollaborationRequestsRESTEndpoints from './endpoints/collaborationRequests/setupRESTEndpoints';
import setupCollaboratorsRESTEndpoints from './endpoints/collaborators/setupRESTEndpoints';
import setupFilesRESTEndpoints from './endpoints/files/setupRESTEndpoints';
import setupFoldersRESTEndpoints from './endpoints/folders/setupRESTEndpoints';
import setupWorkspacesRESTEndpoints from './endpoints/workspaces/setupRESTEndpoints';
import setupPermissionItemsRESTEndpoints from './endpoints/permissionItems/setupRESTEndpoints';
import setupPresetPermissionsGroupsRESTEndpoints from './endpoints/presetPermissionsGroups/setupRESTEndpoints';
import setupProgramAccessTokensRESTEndpoints from './endpoints/programAccessTokens/setupRESTEndpoints';
import {extractProdEnvsSchema, getAppVariables} from './resources/appVariables';
import {SESEmailProviderContext} from './endpoints/contexts/EmailProviderContext';
import {S3FilePersistenceProviderContext} from './endpoints/contexts/FilePersistenceProviderContext';
import {setupApp} from './endpoints/runtime/initAppSetup';
import setupResourcesRESTEndpoints from './endpoints/resources/setupRESTEndpoints';
import setupTagsRESTEndpoints from './endpoints/tags/setupRESTEndpoints';
import {endpointConstants} from './endpoints/constants';

console.log('server initialization');

const app = express();
const upload = multer();
const httpServer = http.createServer(app);

// Match all origins
const whiteListedCorsOrigins = [/[\s\S]*/];

if (process.env.NODE_ENV !== 'production') {
  whiteListedCorsOrigins.push(/localhost/);
}

const corsOption: cors.CorsOptions = {
  origin: whiteListedCorsOrigins,
  optionsSuccessStatus: endpointConstants.httpStatusCode.ok,
  credentials: true,
};

if (process.env.NODE_ENV === 'production') {
  app.use(httpToHttps);
}

app.use(cors(corsOption));
app.use(express.json() as express.RequestHandler);

function setupJWT(ctx: IBaseContext) {
  app.use(
    // TODO: do further research on JWT options, algorithms and best practices
    expressJwt({
      secret: ctx.appVariables.jwtSecret,
      credentialsRequired: false,
      algorithms: ['HS256'],
    })
  );
}

async function setup() {
  const appVariables = getAppVariables(extractProdEnvsSchema);
  const connection = await getMongoConnection(
    appVariables.mongoDbURI,
    appVariables.mongoDbDatabaseName
  );

  const mongoDBDataProvider = new MongoDBDataProviderContext(connection);
  const fileProvider = new S3FilePersistenceProviderContext(
    appVariables.awsRegion
  );

  const emailProvider = new SESEmailProviderContext(appVariables.awsRegion);
  const ctx = new BaseContext(
    mongoDBDataProvider,
    emailProvider,
    fileProvider,
    appVariables,
    getDataProviders(connection),
    getCacheProviders(),
    getLogicProviders()
  );

  const defaultWorkspace = await setupApp(ctx);
  console.log(`Default workspace ID - ${defaultWorkspace.resourceId}`);

  setupJWT(ctx);
  setupClientAssignedTokensRESTEndpoints(ctx, app);
  setupCollaborationRequestsRESTEndpoints(ctx, app);
  setupCollaboratorsRESTEndpoints(ctx, app);
  setupFilesRESTEndpoints(ctx, app, upload);
  setupFoldersRESTEndpoints(ctx, app);
  setupWorkspacesRESTEndpoints(ctx, app);
  setupPermissionItemsRESTEndpoints(ctx, app);
  setupPresetPermissionsGroupsRESTEndpoints(ctx, app);
  setupProgramAccessTokensRESTEndpoints(ctx, app);
  setupAccountRESTEndpoints(ctx, app);
  setupResourcesRESTEndpoints(ctx, app);
  setupTagsRESTEndpoints(ctx, app);

  httpServer.listen(ctx.appVariables.port, async () => {
    app.use(handleErrors);

    console.log(ctx.appVariables.appName);
    console.log(`server listening on port ${ctx.appVariables.port}`);
  });
}

setup();

process.on('uncaughtException', (exp: any, origin: any) => {
  console.log('uncaughtException');
  console.error(exp);
  console.log(origin);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('unhandledRejection');
  console.log(promise);
  console.log(reason);
});
