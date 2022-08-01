import {Connection} from 'mongoose';
import {getWorkspaceModel} from '../db/workspace';
import {getDefaultThresholds} from '../endpoints/usageRecords/constants';
import {workspaceHasUsageThresholds} from '../endpoints/usageRecords/utils';
import {
  logScriptFailed,
  logScriptMessage,
  logScriptStarted,
  logScriptSuccessful,
} from './utils';

export async function script_AddThresholdToExistingWorkspaces(
  connection: Connection
) {
  logScriptStarted(script_AddThresholdToExistingWorkspaces);
  try {
    const model = getWorkspaceModel(connection);
    let docs = await model.find({rootname: null}).lean().exec();
    docs = docs.filter(d => !workspaceHasUsageThresholds(d));
    const defaultThresholds = getDefaultThresholds();
    await model.updateMany(
      {resourceId: {$in: docs.map(d => d.resourceId)}},
      {$set: {usageThresholds: defaultThresholds}}
    );

    logScriptMessage(
      script_AddThresholdToExistingWorkspaces,
      `Added usage thresholds to ${docs.length} workspaces`
    );
    logScriptSuccessful(script_AddThresholdToExistingWorkspaces);
  } catch (error: any) {
    logScriptFailed(script_AddThresholdToExistingWorkspaces, error);
  }
}
