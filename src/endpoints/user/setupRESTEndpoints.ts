import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import changePassword from './changePassword/changePassword';
import changePasswordWithCurrentPassword from './changePasswordWithCurrentPassword/handler';
import changePasswordWithToken from './changePasswordWithToken/handler';
import confirmEmailAddress from './confirmEmailAddress/handler';
import {userConstants} from './constants';
import forgotPassword from './forgotPassword/forgotPassword';
import getUserData from './getUserData/getUserData';
import login from './login/login';
import sendEmailVerificationCode from './sendEmailVerificationCode/handler';
import signup from './signup/signup';
import updateUser from './updateUser/handler';
import userExists from './userExists/handler';

export default function setupAccountRESTEndpoints(ctx: IBaseContext, app: Express) {
  const account = {
    signup: wrapEndpointREST(signup, ctx),
    login: wrapEndpointREST(login, ctx),
    forgotPassword: wrapEndpointREST(forgotPassword, ctx),
    changePasswordWithCurrentPassword: wrapEndpointREST(changePasswordWithCurrentPassword, ctx),
    changePasswordWithToken: wrapEndpointREST(changePasswordWithToken, ctx),
    changePassword: wrapEndpointREST(changePassword, ctx),
    updateUser: wrapEndpointREST(updateUser, ctx),
    getUserData: wrapEndpointREST(getUserData, ctx),
    userExists: wrapEndpointREST(userExists, ctx),
    confirmEmailAddress: wrapEndpointREST(confirmEmailAddress, ctx),
    sendEmailVerificationCode: wrapEndpointREST(sendEmailVerificationCode, ctx),
  };

  app.post(userConstants.routes.signup, account.signup);
  app.post(userConstants.routes.login, account.login);
  app.post(userConstants.routes.forgotPassword, account.forgotPassword);
  app.post(
    userConstants.routes.changePasswordWithCurrentPassword,
    account.changePasswordWithCurrentPassword
  );
  app.post(userConstants.routes.changePasswordWithToken, account.changePasswordWithToken);
  app.post(userConstants.routes.changePassword, account.changePassword);
  app.post(userConstants.routes.updateUser, account.updateUser);
  app.post(userConstants.routes.getUserData, account.getUserData);
  app.post(userConstants.routes.userExists, account.userExists);
  app.post(userConstants.routes.confirmEmailAddress, account.confirmEmailAddress);
  app.post(userConstants.routes.sendEmailVerificationCode, account.sendEmailVerificationCode);
}
