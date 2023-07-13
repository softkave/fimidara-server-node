import {first} from 'lodash';
import {Connection, Model} from 'mongoose';
import {getAgentTokenModel} from '../db/agentToken';
import {getAssignedItemModel} from '../db/assignedItem';
import {getCollaborationRequestModel} from '../db/collaborationRequest';
import {getFileModel} from '../db/file';
import {getFilePresignedPathMongoModel} from '../db/filePresignedPath';
import {getFolderDatabaseModel} from '../db/folder';
import {getJobModel} from '../db/job';
import {getPermissionGroupModel} from '../db/permissionGroup';
import {getPermissionItemModel} from '../db/permissionItem';
import {getResourceModel} from '../db/resource';
import {getTagModel} from '../db/tag';
import {getUsageRecordModel} from '../db/usageRecord';
import {getUserModel} from '../db/user';
import {getWorkspaceModel} from '../db/workspace';
import {AppResourceType, Resource} from '../definitions/system';
import {noopAsync} from '../utils/fns';
import {AnyFn} from '../utils/types';

async function cleanModel(model: Model<any>) {
  await model.deleteMany({}).exec();
  return model;
}

const typeToInsertFnMap: Record<AppResourceType, AnyFn<[Connection, Resource[]], Promise<void>>> = {
  [AppResourceType.All]: noopAsync,
  [AppResourceType.System]: noopAsync,
  [AppResourceType.Public]: noopAsync,
  [AppResourceType.EndpointRequest]: noopAsync,
  [AppResourceType.Workspace]: async (connection, resources) => {
    const model = await cleanModel(getWorkspaceModel(connection));
    await model.insertMany(resources);
  },
  [AppResourceType.CollaborationRequest]: async (connection, resources) => {
    const model = await cleanModel(getCollaborationRequestModel(connection));
    await model.insertMany(resources);
  },
  [AppResourceType.AgentToken]: async (connection, resources) => {
    const model = await cleanModel(getAgentTokenModel(connection));
    await model.insertMany(resources);
  },
  [AppResourceType.PermissionGroup]: async (connection, resources) => {
    const model = await cleanModel(getPermissionGroupModel(connection));
    await model.insertMany(resources);
  },
  [AppResourceType.PermissionItem]: async (connection, resources) => {
    const model = await cleanModel(getPermissionItemModel(connection));
    await model.insertMany(resources);
  },
  [AppResourceType.Folder]: async (connection, resources) => {
    const model = await cleanModel(getFolderDatabaseModel(connection));
    await model.insertMany(resources);
  },
  [AppResourceType.File]: async (connection, resources) => {
    const model = await cleanModel(getFileModel(connection));
    await model.insertMany(resources);
  },
  [AppResourceType.User]: async (connection, resources) => {
    const model = await cleanModel(getUserModel(connection));
    await model.insertMany(resources);
  },
  [AppResourceType.Tag]: async (connection, resources) => {
    const model = await cleanModel(getTagModel(connection));
    await model.insertMany(resources);
  },
  [AppResourceType.UsageRecord]: async (connection, resources) => {
    const model = await cleanModel(getUsageRecordModel(connection));
    await model.insertMany(resources);
  },
  [AppResourceType.AssignedItem]: async (connection, resources) => {
    const model = await cleanModel(getAssignedItemModel(connection));
    await model.insertMany(resources);
  },
  [AppResourceType.Job]: async (connection, resources) => {
    const model = await cleanModel(getJobModel(connection));
    await model.insertMany(resources);
  },
  [AppResourceType.FilePresignedPath]: async (connection, resources) => {
    const model = await cleanModel(getFilePresignedPathMongoModel(connection));
    await model.insertMany(resources);
  },
};

async function transferData(connection: Connection) {
  const wrappedResources = await Promise.all(
    Object.values(AppResourceType).map(resourceType =>
      getResourceModel(connection).find({resourceType}).lean().exec()
    )
  );
  await Promise.all(
    wrappedResources.map(async resources => {
      const resourceType = first(resources)?.resourceType;
      if (resourceType) {
        const insertFn = typeToInsertFnMap[resourceType];
        await insertFn(
          connection,
          resources.map(resource => resource.resource)
        );
      }
    })
  );
}

export async function script_resourceToDataModelTransfer(connection: Connection) {
  console.log(script_resourceToDataModelTransfer.name, ' started');
  await transferData(connection);
  console.log(script_resourceToDataModelTransfer.name, ' complete');
}
