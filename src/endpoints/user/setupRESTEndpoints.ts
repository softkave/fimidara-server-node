import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import changePassword from './changePassword/changePassword';
import changePasswordWithCurrentPassword from './changePasswordWithCurrentPassword/handler';
import changePasswordWithToken from './changePasswordWithToken/changePasswordWithToken';
import confirmEmailAddress from './confirmEmailAddress/handler';
import forgotPassword from './forgotPassword/forgotPassword';
import getUserData from './getUserData/getUserData';
import login from './login/login';
import sendEmailVerificationCode from './sendEmailVerificationCode/handler';
import signup from './signup/signup';
import updateUser from './updateUser/handler';
import userExists from './userExists/handler';

export default function setupAccountRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const account = {
    signup: wrapEndpointREST(signup, ctx),
    login: wrapEndpointREST(login, ctx),
    forgotPassword: wrapEndpointREST(forgotPassword, ctx),
    changePasswordWithCurrentPassword: wrapEndpointREST(
      changePasswordWithCurrentPassword,
      ctx
    ),
    changePasswordWithToken: wrapEndpointREST(changePasswordWithToken, ctx),
    changePassword: wrapEndpointREST(changePassword, ctx),
    updateUser: wrapEndpointREST(updateUser, ctx),
    getUserData: wrapEndpointREST(getUserData, ctx),
    userExists: wrapEndpointREST(userExists, ctx),
    confirmEmailAddress: wrapEndpointREST(confirmEmailAddress, ctx),
    sendEmailVerificationCode: wrapEndpointREST(sendEmailVerificationCode, ctx),
  };

  app.post('/account/signup', account.signup);
  app.post('/account/login', account.login);
  app.post('/account/forgotPassword', account.forgotPassword);
  app.post(
    '/account/changePasswordWithCurrentPassword',
    account.changePasswordWithCurrentPassword
  );
  app.post('/account/changePasswordWithToken', account.changePasswordWithToken);
  app.post('/account/changePassword', account.changePassword);
  app.post('/account/updateUser', account.updateUser);
  app.post('/account/getUserData', account.getUserData);
  app.post('/account/userExists', account.userExists);
  app.post('/account/confirmEmailAddress', account.confirmEmailAddress);
  app.post(
    '/account/sendEmailVerificationCode',
    account.sendEmailVerificationCode
  );
}
