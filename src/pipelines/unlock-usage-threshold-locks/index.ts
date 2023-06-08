import {fimidaraConfig} from '@/resources/vars';
import {getMongoConnection} from '../../db/connection';
import {FimidaraPipelineNames, pipelineRunInfoFactory} from '../utils';
import {unlockUsageThresholdLocks} from './unlockUsageThresholdLocks';

async function unlockUsageThresholdLocksMain() {
  const runInfo = pipelineRunInfoFactory({
    job: FimidaraPipelineNames.UnlockWorkspaceLocksJob,
  });

  try {
    runInfo.logger.info('Unlocking workspace locks job started');
    const connection = await getMongoConnection(
      fimidaraConfig.mongoDbURI,
      fimidaraConfig.mongoDbDatabaseName
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
