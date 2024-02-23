import {expressjwt} from 'express-jwt';
import {kEndpointConstants} from './endpoints/constants';
import {globalSetup} from './endpoints/contexts/globalUtils';
import {kUtilsInjectables} from './endpoints/contexts/injection/injectables';
import {setupFimidaraHttpEndpoints} from './endpoints/endpoints';
import {startRunner} from './endpoints/jobs/runner';
import {setupApp} from './endpoints/runtime/initAppSetup';
import handleErrors from './middlewares/handleErrors';
import httpToHttps from './middlewares/httpToHttps';
import {appAssert} from './utils/assertion';
import cors = require('cors');
import express = require('express');
import http = require('http');
import process = require('process');

const app = express();
const httpServer = http.createServer(app);

// Match all origins
const whiteListedCorsOrigins = [/[\s\S]*/];
if (process.env.NODE_ENV !== 'production') {
  whiteListedCorsOrigins.push(/localhost/);
}

const corsOption: cors.CorsOptions = {
  origin: whiteListedCorsOrigins,
  optionsSuccessStatus: kEndpointConstants.httpStatusCode.ok,
  credentials: true,
};

if (process.env.NODE_ENV === 'production') {
  app.use(httpToHttps);
}

app.use(cors(corsOption));
app.use(express.json() as express.RequestHandler);

function setupJWT() {
  const suppliedConfig = kUtilsInjectables.suppliedConfig();
  appAssert(suppliedConfig.jwtSecret);

  app.use(
    // TODO: do further research on JWT options, algorithms and best practices
    expressjwt({
      secret: suppliedConfig.jwtSecret,
      credentialsRequired: false,
      algorithms: ['HS256'],
    })
  );
}

async function setup() {
  await globalSetup();
  kUtilsInjectables.logger().log('server initialization');

  // Run scripts here
  // End of scripts

  const defaultWorkspace = await setupApp();
  kUtilsInjectables.logger().log(`default workspace ID - ${defaultWorkspace.resourceId}`);

  setupJWT();
  setupFimidaraHttpEndpoints(app);
  app.use(handleErrors);

  const suppliedConfig = kUtilsInjectables.suppliedConfig();
  appAssert(suppliedConfig.port);
  appAssert(suppliedConfig.appName);

  httpServer.listen(suppliedConfig.port, async () => {
    kUtilsInjectables.logger().log(`app name - ${suppliedConfig.appName}`);
    kUtilsInjectables.logger().log(`app env - ${process.env.NODE_ENV}`);
    kUtilsInjectables.logger().log(`port - ${suppliedConfig.port}`);

    // start job runner
    kUtilsInjectables.promises().forget(startRunner());
  });
}

// TODO: run global dispose on close/end server
setup();

// TODO: move these error logs to mongo
process.on('uncaughtException', (exp, origin) => {
  kUtilsInjectables.logger().log('uncaughtException');
  kUtilsInjectables.logger().error(exp);
  kUtilsInjectables.logger().log(origin);
});

process.on('unhandledRejection', (reason, promise) => {
  kUtilsInjectables.logger().log('unhandledRejection');
  kUtilsInjectables.logger().log(promise);
  kUtilsInjectables.logger().log(reason);
});
