import {Connection} from 'mongoose';
import {getAssignedItemModel} from '../db/assignedItem';
import {getPermissionItemModel} from '../db/permissionItem';
import {AppResourceType} from '../definitions/system';
import {
  logScriptFailed,
  logScriptMessage,
  logScriptStarted,
  logScriptSuccessful,
} from './utils';

/**
 * Change permission group text in Db from "permissionGroup-permissions-group"
 * to "permission-group"
 */

const oldText = 'permissionGroup-permissions-group';

export async function changeInAssignedItemsAssignedItemType(
  connection: Connection
) {
  logScriptStarted(changeInAssignedItemsAssignedItemType);
  try {
    const model = getAssignedItemModel(connection);
    const assignedItemTypeDocs = await model
      .find({assignedItemType: oldText})
      .lean()
      .exec();

    await model.bulkWrite(
      assignedItemTypeDocs.map(doc => {
        return {
          updateOne: {
            filter: {_id: doc._id},
            update: {$set: {assignedItemType: AppResourceType.PermissionGroup}},
            upsert: true,
          },
        };
      })
    );

    logScriptMessage(
      changeInAssignedItemsAssignedItemType,
      `Updated ${assignedItemTypeDocs.length} docs`
    );
    logScriptSuccessful(changeInAssignedItemsAssignedItemType);
  } catch (error: any) {
    logScriptFailed(changeInAssignedItemsAssignedItemType, error);
  }
}

export async function changeInAssignedItemsAssignedToItemType(
  connection: Connection
) {
  logScriptStarted(changeInAssignedItemsAssignedToItemType);
  try {
    const model = getAssignedItemModel(connection);
    const docs = await model.find({assignedToItemType: oldText}).lean().exec();
    await model.bulkWrite(
      docs.map(doc => {
        return {
          updateOne: {
            filter: {_id: doc._id},
            update: {
              $set: {assignedToItemType: AppResourceType.PermissionGroup},
            },
            upsert: true,
          },
        };
      })
    );

    logScriptMessage(
      changeInAssignedItemsAssignedToItemType,
      `Updated ${docs.length} docs`
    );
    logScriptSuccessful(changeInAssignedItemsAssignedToItemType);
  } catch (error: any) {
    logScriptFailed(changeInAssignedItemsAssignedToItemType, error);
  }
}

export async function changeInPermissionItemsPermissionEntityType(
  connection: Connection
) {
  logScriptStarted(changeInPermissionItemsPermissionEntityType);
  try {
    const model = getPermissionItemModel(connection);
    const docs = await model
      .find({permissionEntityType: oldText})
      .lean()
      .exec();

    await model.bulkWrite(
      docs.map(doc => {
        return {
          updateOne: {
            filter: {_id: doc._id},
            update: {
              $set: {permissionEntityType: AppResourceType.PermissionGroup},
            },
            upsert: true,
          },
        };
      })
    );

    logScriptMessage(
      changeInPermissionItemsPermissionEntityType,
      `Updated ${docs.length} docs`
    );
    logScriptSuccessful(changeInPermissionItemsPermissionEntityType);
  } catch (error: any) {
    logScriptFailed(changeInPermissionItemsPermissionEntityType, error);
  }
}

export async function changeInPermissionItemsItemResourceType(
  connection: Connection
) {
  logScriptStarted(changeInPermissionItemsItemResourceType);
  try {
    const model = getPermissionItemModel(connection);
    const docs = await model.find({itemResourceType: oldText}).lean().exec();
    await model.bulkWrite(
      docs.map(doc => {
        return {
          updateOne: {
            filter: {_id: doc._id},
            update: {
              $set: {itemResourceType: AppResourceType.PermissionGroup},
            },
            upsert: true,
          },
        };
      })
    );

    logScriptMessage(
      changeInPermissionItemsItemResourceType,
      `Updated ${docs.length} docs`
    );
    logScriptSuccessful(changeInPermissionItemsItemResourceType);
  } catch (error: any) {
    logScriptFailed(changeInPermissionItemsItemResourceType, error);
  }
}

export async function script_ChangePermissionGroupResourceTypeLabel(
  connection: Connection
) {
  logScriptStarted(script_ChangePermissionGroupResourceTypeLabel);
  try {
    await Promise.allSettled([
      changeInAssignedItemsAssignedItemType(connection),
      changeInAssignedItemsAssignedToItemType(connection),
      changeInPermissionItemsPermissionEntityType(connection),
      changeInPermissionItemsItemResourceType(connection),
    ]);
    logScriptSuccessful(script_ChangePermissionGroupResourceTypeLabel);
  } catch (error: any) {
    logScriptFailed(script_ChangePermissionGroupResourceTypeLabel, error);
  }
}
