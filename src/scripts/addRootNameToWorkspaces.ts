import {Connection} from 'mongoose';
import {getWorkspaceModel} from '../db/workspace';
import {getRootnameFromName} from '../endpoints/workspaces/utils';
import {
  logScriptFailed,
  logScriptMessage,
  logScriptStarted,
  logScriptSuccessful,
} from './utils';

export async function script_AddRootnameToWorkspaces(connection: Connection) {
  logScriptStarted(script_AddRootnameToWorkspaces);
  try {
    const model = getWorkspaceModel(connection);
    const docs = await model.find({rootname: null}).lean().exec();
    await model.bulkWrite(
      docs.map(doc => {
        return {
          updateOne: {
            filter: {_id: doc._id},
            update: {$set: {rootname: getRootnameFromName(doc.name)}},
            upsert: true,
          },
        };
      })
    );

    logScriptMessage(
      script_AddRootnameToWorkspaces,
      `Added rootname to ${docs.length} workspaces`
    );
    logScriptSuccessful(script_AddRootnameToWorkspaces);
  } catch (error: any) {
    logScriptFailed(script_AddRootnameToWorkspaces, error);
  }
}
