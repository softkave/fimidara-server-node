import {
  ISetupDevUserOptions,
  devUserSetupInitContext,
  devUserSetupPromptEmail,
  devUserSetupPromptUserInfo,
  devUserSetupPromptUserPassword,
  setupDevUser,
} from './utils';

const appOptions: ISetupDevUserOptions = {
  getUserEmail: devUserSetupPromptEmail,
  getUserInfo: devUserSetupPromptUserInfo,
  getUserPassword: devUserSetupPromptUserPassword,
};

async function main() {
  const context = await devUserSetupInitContext();
  await setupDevUser(context, appOptions);
}

main()
  .then(() => console.log('dev user setup complete'))
  .catch(console.error.bind(console));
