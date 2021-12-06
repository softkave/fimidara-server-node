import {wrapEndpointREST} from '../utils';
import forgotPassword from './forgotPassword/forgotPassword';
import getUserData from './getUserData/getUserData';
import login from './login/login';
import signup from './signup/signup';
import updateUser from './updateUser/handler';
import userExists from './userExists/handler';
import {Express} from 'express';
import confirmEmailAddress from './confirmEmailAddress/handler';
import sendEmailVerificationCode from './sendEmailVerificationCode/handler';
import changePasswordWithCurrentPassword from './changePasswordWithCurrentPassword/handler';
import changePasswordWithToken from './changePasswordWithToken/changePasswordWithToken';
import {IBaseContext} from '../contexts/BaseContext';

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
    updateUser: wrapEndpointREST(updateUser, ctx),
    getUserData: wrapEndpointREST(getUserData, ctx),
    userExists: wrapEndpointREST(userExists, ctx),
    confirmEmailAddress: wrapEndpointREST(confirmEmailAddress, ctx),
    sendEmailVerificationCode: wrapEndpointREST(sendEmailVerificationCode, ctx),
  };

  app.post('/user/signup', account.signup);
  app.post('/user/login', account.login);
  app.post('/user/forgotPassword', account.forgotPassword);
  app.post(
    '/user/changePasswordWithCurrentPassword',
    account.changePasswordWithCurrentPassword
  );
  app.post('/user/changePasswordWithToken', account.changePasswordWithToken);
  app.post('/user/updateUser', account.updateUser);
  app.post('/user/getUserData', account.getUserData);
  app.post('/user/userExists', account.userExists);
  app.post('/user/confirmEmailAddress', account.confirmEmailAddress);
  app.post(
    '/user/sendEmailVerificationCode',
    account.sendEmailVerificationCode
  );
}
