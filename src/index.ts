import {expressjwt} from 'express-jwt';
import fs from 'fs';
import {format} from 'util';
import {kEndpointConstants} from './endpoints/constants';
import {globalDispose, globalSetup} from './endpoints/contexts/globalUtils';
import {kUtilsInjectables} from './endpoints/contexts/injection/injectables';
import {setupFimidaraHttpEndpoints} from './endpoints/endpoints';
import {startRunner} from './endpoints/jobs/runner';
import {initFimidara} from './endpoints/runtime/initFimidara';
import handleErrors from './middlewares/handleErrors';
import redirectHttpToHttpsExpressMiddleware from './middlewares/redirectHttpToHttps';
import {appAssert} from './utils/assertion';
import cors = require('cors');
import express = require('express');
import http = require('http');
import https = require('https');
import process = require('process');

interface RuntimeArtifacts {
  httpServer?: http.Server;
  httpsServer?: https.Server;
}

const app = express();
const artifacts: RuntimeArtifacts = {};

const corsOption: cors.CorsOptions = {
  // match all origins
  origin: true,
  optionsSuccessStatus: kEndpointConstants.httpStatusCode.ok,
  credentials: true,
};

app.use(cors(corsOption));
app.use(express.json() as express.RequestHandler);

async function setupHttpServer() {
  const conf = kUtilsInjectables.suppliedConfig();
  let httpServerPromise: Promise<void> | undefined;
  let httpsServerPromise: Promise<void> | undefined;

  if (conf.exposeHttpServer) {
    appAssert(conf.httpPort);

    const httpServer = http.createServer(app);
    artifacts.httpServer = httpServer;
    httpServerPromise = new Promise(resolve => {
      httpServer.listen(conf.httpPort, () => {
        kUtilsInjectables.logger().log(`http port: ${conf.httpPort}`);
        resolve();
      });
    });
  }

  if (conf.exposeHttpsServer) {
    if (!conf.exposeHttpServer) {
      app.use(redirectHttpToHttpsExpressMiddleware);
    }

    appAssert(conf.httpsPublicKeyFilepath);
    appAssert(conf.httpsPrivateKeyFilepath);
    appAssert(conf.httpsPort);

    const privateKey = fs.readFileSync(conf.httpsPrivateKeyFilepath, 'utf8');
    const certificate = fs.readFileSync(conf.httpsPublicKeyFilepath, 'utf8');
    const credentials = {key: privateKey, cert: certificate};
    const httpsServer = https.createServer(credentials, app);
    artifacts.httpsServer = httpsServer;
    httpsServerPromise = new Promise(resolve => {
      httpsServer.listen(conf.httpsPort, () => {
        kUtilsInjectables.logger().log(`https port: ${conf.httpsPort}`);
        resolve();
      });
    });
  }

  await Promise.all([httpServerPromise, httpsServerPromise]);
}

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

  const defaultWorkspace = await initFimidara();
  kUtilsInjectables.logger().log(`workspace ID: ${defaultWorkspace.resourceId}`);
  kUtilsInjectables.logger().log(`process ID: ${process.pid}`);

  setupJWT();
  setupFimidaraHttpEndpoints(app);
  app.use(handleErrors);

  await setupHttpServer();

  // start job runner
  kUtilsInjectables.promises().forget(startRunner());
}

// TODO: run global dispose on close/end server
setup();

async function closeHttpServer(server: http.Server): Promise<void> {
  const addr = server.address();
  return new Promise(resolve => {
    server.close(error => {
      if (error) {
        kUtilsInjectables.logger().error(error);
      }

      kUtilsInjectables.logger().log(`closed ${format(addr)}`);
      resolve();
    });

    server.closeAllConnections();
  });
}

async function endServer() {
  kUtilsInjectables.logger().log('started graceful shutdown');
  await Promise.allSettled([
    artifacts.httpServer && closeHttpServer(artifacts.httpServer),
    artifacts.httpsServer && closeHttpServer(artifacts.httpsServer),
  ]);

  kUtilsInjectables.logger().log('started app dispose');
  await globalDispose();
  console.log('server ended');

  // eslint-disable-next-line no-process-exit
  process.exit();
}

// TODO: move these error logs to mongo
// process.on('uncaughtException', (exp, origin) => {
//   kUtilsInjectables.logger().log('uncaughtException');
//   kUtilsInjectables.logger().error(exp);
//   kUtilsInjectables.logger().log(origin);
// });

// process.on('unhandledRejection', (reason, promise) => {
//   kUtilsInjectables.logger().log('unhandledRejection');
//   kUtilsInjectables.logger().log(promise);
//   kUtilsInjectables.logger().log(reason);
// });

process.on('SIGINT', endServer);
process.on('SIGTERM', endServer);
