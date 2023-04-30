import {getMongoConnection} from '../../db/connection';
import {getAppVariables, prodEnvsSchema} from '../../resources/vars';
import {FimidaraPipelineNames, pipelineRunInfoFactory} from '../utils';
import {aggregateRecords} from './aggregateUsageRecords';

async function aggregateRecordsMain() {
  const runInfo = pipelineRunInfoFactory({
    job: FimidaraPipelineNames.AggregateUsageRecordsJob,
  });

  try {
    runInfo.logger.info('Aggregate usage records job started');
    const appVariables = getAppVariables(prodEnvsSchema);
    const connection = await getMongoConnection(
      appVariables.mongoDbURI,
      appVariables.mongoDbDatabaseName
    );
    await aggregateRecords(connection, runInfo);
    await connection.close();
    runInfo.logger.info('Aggregate usage records job completed');
  } catch (error: any) {
    runInfo.logger.error(error);
  }

  await runInfo.logger.close();
}

aggregateRecordsMain();
