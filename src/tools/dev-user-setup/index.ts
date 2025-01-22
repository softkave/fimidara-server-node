import {globalDispose, globalSetup} from '../../contexts/globalUtils.js';
import {
  ISetupDevUserOptions,
  devUserSetupPromptEmail,
  devUserSetupPromptUserInfo,
  devUserSetupPromptUserPassword,
  setupDevUser,
} from './utils.js';

const appOptions: ISetupDevUserOptions = {
  getUserEmail: devUserSetupPromptEmail,
  getUserInfo: devUserSetupPromptUserInfo,
  getUserPassword: devUserSetupPromptUserPassword,
};

async function main() {
  await globalSetup(
    {useFimidaraApp: false, useFimidaraWorkerPool: false},
    {
      useHandleFolderQueue: true,
      useHandleUsageRecordQueue: true,
      useHandleAddInternalMultipartIdQueue: true,
      useHandlePrepareFileQueue: true,
    }
  );
  await setupDevUser(appOptions);
  await globalDispose();
}

main();
