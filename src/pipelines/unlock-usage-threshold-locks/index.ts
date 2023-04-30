import {getMongoConnection} from '../../db/connection';
import {getAppVariables, prodEnvsSchema} from '../../resources/vars';
import {FimidaraPipelineNames, pipelineRunInfoFactory} from '../utils';
import {unlockUsageThresholdLocks} from './unlockUsageThresholdLocks';

async function unlockUsageThresholdLocksMain() {
  const runInfo = pipelineRunInfoFactory({
    job: FimidaraPipelineNames.UnlockWorkspaceLocksJob,
  });

  try {
    runInfo.logger.info('Unlocking workspace locks job started');
    const appVariables = getAppVariables(prodEnvsSchema);
    const connection = await getMongoConnection(
      appVariables.mongoDbURI,
      appVariables.mongoDbDatabaseName
    );
    await unlockUsageThresholdLocks(connection);
    await connection.close();
    runInfo.logger.info('Unlocking usage threshold locks job completed');
  } catch (error: any) {
    runInfo.logger.error(error);
  }

  await runInfo.logger.close();
}

unlockUsageThresholdLocksMain();
