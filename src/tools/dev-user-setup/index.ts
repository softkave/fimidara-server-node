import {globalDispose, globalSetup} from '../../endpoints/contexts/globalUtils';
import {
  ISetupDevUserOptions,
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
  await globalSetup();
  await setupDevUser(appOptions);
  await globalDispose();
}

main();
