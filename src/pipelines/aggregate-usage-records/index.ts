import {fimidaraConfig} from '@/resources/vars';
import {getMongoConnection} from '../../db/connection';
import {FimidaraPipelineNames, pipelineRunInfoFactory} from '../utils';
import {aggregateRecords} from './aggregateUsageRecords';

async function aggregateRecordsMain() {
  const runInfo = pipelineRunInfoFactory({
    job: FimidaraPipelineNames.AggregateUsageRecordsJob,
  });

  try {
    runInfo.logger.info('Aggregate usage records job started');
    const connection = await getMongoConnection(
      fimidaraConfig.mongoDbURI,
      fimidaraConfig.mongoDbDatabaseName
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
