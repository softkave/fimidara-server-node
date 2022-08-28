import {Connection} from 'mongoose';
import {getWorkspaceModel} from '../db/workspace';
import {getDefaultThresholds} from '../endpoints/usageRecords/constants';
import {workspaceHasUsageThresholds} from '../endpoints/usageRecords/utils';
import {
  FimidaraScriptNames,
  logScriptFailed,
  logScriptMessage,
  logScriptStarted,
  logScriptSuccessful,
  scriptRunInfoFactory,
} from './utils';

export async function script_AddThresholdToExistingWorkspaces(
  connection: Connection
) {
  const runInfo = scriptRunInfoFactory({
    job: FimidaraScriptNames.AddThresholdToExistingWorkspaces,
  });

  logScriptStarted(runInfo);
  try {
    const model = getWorkspaceModel(connection);
    let docs = await model.find({}).lean().exec();
    docs = docs.filter(d => !workspaceHasUsageThresholds(d));
    const defaultThresholds = getDefaultThresholds();
    await model.updateMany(
      {resourceId: {$in: docs.map(d => d.resourceId)}},
      {usageThresholds: defaultThresholds}
    );

    logScriptMessage(
      runInfo,
      `Added usage thresholds to ${docs.length} workspaces`
    );
    logScriptSuccessful(runInfo);
  } catch (error: any) {
    logScriptFailed(runInfo, error);
  }
}
