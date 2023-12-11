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
  await devUserSetupInitContext();
  await setupDevUser(appOptions);
}

main();
