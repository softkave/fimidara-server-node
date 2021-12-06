import * as cors from 'cors';
import * as express from 'express';
import * as expressJwt from 'express-jwt';
import * as http from 'http';
import handleErrors from './middlewares/handleErrors';
import httpToHttps from './middlewares/httpToHttps';
import {getMongoConnection} from './db/connection';
import BaseContext, {IBaseContext} from './endpoints/contexts/BaseContext';
import setupAccountRESTEndpoints from './endpoints/user/setupRESTEndpoints';
import {appVariables} from './resources/appVariables';
import MongoDBDataProviderContext from './endpoints/contexts/MongoDBDataProviderContext';

console.log('server initialization');

const app = express();
const httpServer = http.createServer(app);

// Match all origins
const whiteListedCorsOrigins = [/[\s\S]*/];

if (process.env.NODE_ENV !== 'production') {
  whiteListedCorsOrigins.push(/localhost/);
}

const corsOption: cors.CorsOptions = {
  origin: whiteListedCorsOrigins,
  optionsSuccessStatus: 200,
  credentials: true,
};

if (process.env.NODE_ENV === 'production') {
  app.use(httpToHttps);
}

app.use(cors(corsOption));
app.use(
  express.json({
    type: 'application/json',
  })
);

function setupJWT(ctx: IBaseContext) {
  app.use(
    // TODO: do further research on options
    expressJwt({
      secret: ctx.appVariables.jwtSecret,
      credentialsRequired: false,
      algorithms: ['HS256'], // TODO: do further research
    })
  );
}

async function setupConnection() {
  const connection = await getMongoConnection();
  return connection;
}

async function setup() {
  const connection = await setupConnection();
  const mongoDBDataProvider = new MongoDBDataProviderContext(connection);
  const ctx = new BaseContext(mongoDBDataProvider);

  setupJWT(ctx);
  setupAccountRESTEndpoints(connection, app);
  setupShopRESTEndpoints(connection, app);
  setupAppointmentRESTEndpoints(connection, app);

  httpServer.listen(appVariables.port, async () => {
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
