import cors = require('cors');
import express = require('express');
import http = require('http');
import {expressjwt} from 'express-jwt';
import {getMongoConnection} from './db/connection';
import {endpointConstants} from './endpoints/constants';
import BaseContext, {
  getEmailProvider,
  getFileProvider,
} from './endpoints/contexts/BaseContext';
import {kUtilsInjectables} from './endpoints/contexts/injectables';
import {
  getLogicProviders,
  getMongoBackedSemanticDataProviders,
  getMongoDataProviders,
  getMongoModels,
} from './endpoints/contexts/utils';
import {setupFimidaraHttpEndpoints} from './endpoints/endpoints';
import {startJobRunner} from './endpoints/jobs/runner';
import {setupApp} from './endpoints/runtime/initAppSetup';
import handleErrors from './middlewares/handleErrors';
import httpToHttps from './middlewares/httpToHttps';
import {fimidaraConfig} from './resources/vars';
import {serverLogger} from './utils/logger/loggerUtils';

serverLogger.info('server initialization');

const app = express();
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

function setupJWT() {
  app.use(
    // TODO: do further research on JWT options, algorithms and best practices
    expressjwt({
      secret: kUtilsInjectables.config().jwtSecret,
      credentialsRequired: false,
      algorithms: ['HS256'],
    })
  );
}

async function setup() {
  const connection = await getMongoConnection(
    fimidaraConfig.mongoDbURI,
    fimidaraConfig.mongoDbDatabaseName
  );

  // Run scripts here
  // End of scripts

  const models = getMongoModels(connection);
  const data = getMongoDataProviders(models);
  const ctx = new BaseContext(
    data,
    getEmailProvider(fimidaraConfig),
    getFileProvider(fimidaraConfig),
    fimidaraConfig,
    getLogicProviders(),
    getMongoBackedSemanticDataProviders(data),
    connection,
    models,
    () => connection.close()
  );
  await ctx.init();
  const defaultWorkspace = await setupApp();
  serverLogger.info(`Default workspace ID - ${defaultWorkspace.resourceId}`);

  setupJWT();
  setupFimidaraHttpEndpoints(app);
  app.use(handleErrors);

  httpServer.listen(kUtilsInjectables.config().port, async () => {
    serverLogger.info(kUtilsInjectables.config().appName);
    serverLogger.info(kUtilsInjectables.config().nodeEnv);
    serverLogger.info(`server listening on port ${kUtilsInjectables.config().port}`);

    // start job runner
    startJobRunner().catch(error => serverLogger.error(error));
  });
}

setup();

// TODO: move these error logs to mongo
process.on('uncaughtException', (exp, origin) => {
  serverLogger.info('uncaughtException');
  serverLogger.error(exp);
  serverLogger.info(origin);
});

process.on('unhandledRejection', (reason, promise) => {
  serverLogger.info('unhandledRejection');
  serverLogger.info(promise);
  serverLogger.info(reason);
});
