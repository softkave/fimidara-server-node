import {first, flatten} from 'lodash';
import {
  DeleteResourceJobParams,
  Job,
  kJobStatus,
  kJobType,
} from '../../../../../definitions/job';
import {
  AppResourceType,
  FimidaraTypeToTSType,
  Resource,
  kAppResourceType,
} from '../../../../../definitions/system';
import {extractResourceIdList} from '../../../../../utils/fns';
import {
  getNewId,
  getNewIdForResource,
  getResourceTypeFromId,
} from '../../../../../utils/resource';
import {AnyFn, AnyObject, PartialRecord} from '../../../../../utils/types';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../../contexts/injection/injectables';
import {generateAndInsertAssignedItemListForTest} from '../../../../testUtils/generate/permissionGroup';
import {generateAndInsertPermissionItemListForTest} from '../../../../testUtils/generate/permissionItem';
import {queueJobs} from '../../../queueJobs';
import {runDeleteResourceJob0} from '../runDeleteResourceJob0';
import {runDeleteResourceJobArtifacts} from '../runDeleteResourceJobArtifacts';
import {runDeleteResourceJobSelf} from '../runDeleteResourceJobSelf';
import {DeleteResourceCascadeEntry} from '../types';

export type GenerateResourceFn<T extends Resource> = AnyFn<
  [{workspaceId: string}],
  Promise<T>
>;

export type GenerateTypeChildrenFn<
  TResource extends Resource,
  TKey extends AppResourceType,
> = AnyFn<
  [{resource: TResource; workspaceId: string}],
  Promise<FimidaraTypeToTSType<TKey>[]>
>;

export type GenerateTypeChildrenDefinition<TResource extends Resource> = {
  [TKey in AppResourceType]: GenerateTypeChildrenFn<TResource, TKey> | null;
};

export type GetResourcesByIdFn<TKey extends AppResourceType> = AnyFn<
  [{idList: string[]}],
  Promise<FimidaraTypeToTSType<TKey>[]>
>;

export type GetResourcesByIdDefinition = {
  [TKey in AppResourceType]: GetResourcesByIdFn<TKey> | null;
};

type TypeToResourceMap<TTypes extends AppResourceType = AppResourceType> = {
  [TKey in TTypes]?: FimidaraTypeToTSType<TKey>[];
};

type TypeToIdList = PartialRecord<AppResourceType, string[] | undefined>;

export async function testDeleteResourceJob0<T extends Resource>(props: {
  type: AppResourceType;
  genResourceFn: GenerateResourceFn<T>;
}) {
  const {genResourceFn, type} = props;
  const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
  const shard = getNewId();
  const mainResource = await genResourceFn({workspaceId});
  const [job] = await queueJobs<DeleteResourceJobParams>(
    workspaceId,
    /** parent job ID */ undefined,
    [
      {
        shard,
        type: kJobType.deleteResource0,
        params: {
          type,
          workspaceId,
          resourceId: mainResource.resourceId,
        },
      },
    ]
  );

  await runDeleteResourceJob0(job);
  await kUtilsInjectables.promises().flush();

  const [deleteSelfJob, deleteArtifactsJob] = (await Promise.all([
    kSemanticModels.job().getOneByQuery({
      shard,
      parentJobId: job.resourceId,
      type: kJobType.deleteResourceSelf,
    }),
    kSemanticModels.job().getOneByQuery({
      shard,
      parentJobId: job.resourceId,
      type: kJobType.deleteResourceArtifacts,
    }),
  ])) as [Job<DeleteResourceJobParams>, Job<DeleteResourceJobParams>];

  expect(deleteArtifactsJob).toMatchObject({
    workspaceId,
    type: kJobType.deleteResourceArtifacts,
    shard: job.shard,
    priority: job.priority,
    params: job.params,
  });
  expect(deleteSelfJob).toMatchObject({
    workspaceId,
    type: kJobType.deleteResourceArtifacts,
    shard: job.shard,
    priority: job.priority,
    params: job.params,
    runAfter: [{jobId: deleteArtifactsJob?.resourceId, status: [kJobStatus.completed]}],
  });
}

async function generateTypeChildrenWithDef<T extends Resource>(props: {
  def: GenerateTypeChildrenDefinition<T>;
  resource: T;
  workspaceId: string;
  forTypes?: AppResourceType[];
}) {
  const {resource, workspaceId, def, forTypes = Object.keys(def)} = props;
  const result: AnyObject = {};
  await Promise.all(
    forTypes.map(async type => {
      const children = await def[type as AppResourceType]?.({resource, workspaceId});
      result[type] = children;
    })
  );

  return result as TypeToResourceMap;
}

function resourceMapToIdMap(resourcesMap: TypeToResourceMap) {
  return Object.entries(resourcesMap).reduce((acc, [key, resources]) => {
    if (resources) {
      acc[key as AppResourceType] = extractResourceIdList(resources);
    }

    return acc;
  }, {} as TypeToIdList);
}

const kGetResourcesByIdDef: GetResourcesByIdDefinition = {
  [kAppResourceType.All]: () => Promise.resolve([]),
  [kAppResourceType.System]: () => Promise.resolve([]),
  [kAppResourceType.Public]: () => Promise.resolve([]),
  [kAppResourceType.User]: () => Promise.resolve([]),
  [kAppResourceType.EndpointRequest]: () => Promise.resolve([]),
  [kAppResourceType.App]: () => Promise.resolve([]),
  [kAppResourceType.Job]: () => Promise.resolve([]),
  [kAppResourceType.Workspace]: () => Promise.resolve([]),
  [kAppResourceType.CollaborationRequest]: ({idList}) =>
    kSemanticModels.collaborationRequest().getManyByIdList(idList),
  [kAppResourceType.AgentToken]: ({idList}) =>
    kSemanticModels.agentToken().getManyByIdList(idList),
  [kAppResourceType.PermissionGroup]: ({idList}) =>
    kSemanticModels.permissionGroup().getManyByIdList(idList),
  [kAppResourceType.PermissionItem]: ({idList}) =>
    kSemanticModels.permissionItem().getManyByIdList(idList),
  [kAppResourceType.Folder]: ({idList}) =>
    kSemanticModels.folder().getManyByIdList(idList),
  [kAppResourceType.File]: ({idList}) => kSemanticModels.file().getManyByIdList(idList),
  [kAppResourceType.Tag]: ({idList}) => kSemanticModels.tag().getManyByIdList(idList),
  [kAppResourceType.AssignedItem]: ({idList}) =>
    kSemanticModels.assignedItem().getManyByIdList(idList),
  [kAppResourceType.UsageRecord]: ({idList}) =>
    kSemanticModels.usageRecord().getManyByIdList(idList),
  [kAppResourceType.PresignedPath]: ({idList}) =>
    kSemanticModels.presignedPath().getManyByIdList(idList),
  [kAppResourceType.FileBackendMount]: ({idList}) =>
    kSemanticModels.fileBackendMount().getManyByIdList(idList),
  [kAppResourceType.FileBackendConfig]: ({idList}) =>
    kSemanticModels.fileBackendConfig().getManyByIdList(idList),
  [kAppResourceType.ResolvedMountEntry]: ({idList}) =>
    kSemanticModels.resolvedMountEntry().getManyByIdList(idList),
};

async function fetchTypeChildrenWithDef(props: {
  idMap: TypeToIdList;
  forTypes?: AppResourceType[];
}) {
  const {idMap, forTypes = Object.keys(kGetResourcesByIdDef)} = props;
  const result: AnyObject = {};
  await Promise.all(
    forTypes.map(async type => {
      const children = await kGetResourcesByIdDef[type as AppResourceType]?.({
        idList: idMap[type as AppResourceType] || [],
      });
      result[type] = children;
    })
  );

  return result as TypeToResourceMap;
}

async function getResourceById<T extends Resource = Resource>(id: string) {
  const type = getResourceTypeFromId(id);
  const result = await fetchTypeChildrenWithDef({
    idMap: {[type]: [id]},
    forTypes: [type],
  });

  return first((result[type] || []) as unknown as T[]);
}

function flattenIdMap(idMap: TypeToIdList) {
  return flatten(Object.values(idMap));
}

export async function testDeleteResourceArtifactsJob<T extends Resource>(props: {
  type: AppResourceType;
  genResourceFn: AnyFn<[{workspaceId: string; shard: string}], Promise<T>>;
  genChildrenDef: GenerateTypeChildrenDefinition<T>;
  deleteCascadeDef: DeleteResourceCascadeEntry;
  genWorkspaceFn?: AnyFn<[], Promise<string>>;
}) {
  const {
    type,
    genResourceFn,
    genChildrenDef,
    deleteCascadeDef,
    genWorkspaceFn = () =>
      Promise.resolve(getNewIdForResource(kAppResourceType.Workspace)),
  } = props;
  const workspaceId = await genWorkspaceFn();
  const shard = getNewId();
  const mainResource = await genResourceFn({workspaceId, shard});
  const artifactTypes = Object.keys(deleteCascadeDef.getArtifacts).filter(
    type => !!deleteCascadeDef.getArtifacts[type as AppResourceType]
  );
  const childrenMap = await generateTypeChildrenWithDef({
    workspaceId,
    resource: mainResource,
    def: genChildrenDef,
    forTypes: artifactTypes as AppResourceType[],
  });

  const [job] = await queueJobs<DeleteResourceJobParams>(
    workspaceId,
    /** parent job ID */ undefined,
    [
      {
        shard,
        type: kJobType.deleteResourceArtifacts,
        params: {
          type,
          workspaceId,
          resourceId: mainResource.resourceId,
        },
      },
    ]
  );

  await runDeleteResourceJobArtifacts(job);
  await kUtilsInjectables.promises().flush();

  const idMap = resourceMapToIdMap(childrenMap);
  const idList = flattenIdMap(idMap);

  const [fetchedChildrenMap, dbResource, childrenJobs] = await Promise.all([
    fetchTypeChildrenWithDef({idMap, forTypes: artifactTypes as AppResourceType[]}),
    getResourceById(mainResource.resourceId),
    kSemanticModels.job().getManyByQuery({
      shard: job.shard,
      parentJobId: job.resourceId,
      priority: job.priority,
      params: {
        $objMatch: {
          workspaceId: job.params.workspaceId,
          resourceId: {$in: idList},
        },
      },
    }),
  ]);

  expect(dbResource).toBeTruthy();
  expect(childrenJobs.length).toBe(idList.length);
  Object.entries(fetchedChildrenMap).forEach(([, resources]) => {
    expect(resources?.length || 0).toBe(0);
  });
}

export async function testDeleteResourceSelfJob<
  T extends Resource,
  TOther = unknown,
>(props: {
  type: AppResourceType;
  genResourceFn: AnyFn<[{workspaceId: string; shard: string}], Promise<T>>;
  genWorkspaceFn?: AnyFn<[], Promise<string>>;
  genOtherFn?: AnyFn<[{resource: T}], Promise<TOther>>;
  confirmOtherDeletedFn?: AnyFn<[{resource: T; other?: TOther}], Promise<void>>;
  getResourceFn?: (id: string) => Promise<T | null | undefined>;
}) {
  const {
    type,
    genResourceFn,
    genOtherFn,
    confirmOtherDeletedFn,
    genWorkspaceFn = () =>
      Promise.resolve(getNewIdForResource(kAppResourceType.Workspace)),
    getResourceFn = getResourceById,
  } = props;
  const workspaceId = await genWorkspaceFn();
  const shard = getNewId();
  const mainResource = await genResourceFn({workspaceId, shard});
  const other = await genOtherFn?.({resource: mainResource});

  const [job] = await queueJobs<DeleteResourceJobParams>(
    workspaceId,
    /** parent job ID */ undefined,
    [
      {
        shard,
        type: kJobType.deleteResourceSelf,
        params: {
          type,
          workspaceId,
          resourceId: mainResource.resourceId,
        },
      },
    ]
  );

  await runDeleteResourceJobSelf(job);
  await kUtilsInjectables.promises().flush();

  const [dbResource] = await Promise.all([
    getResourceFn(mainResource.resourceId),
    confirmOtherDeletedFn?.({other, resource: mainResource}),
  ]);

  expect(dbResource).toBeFalsy();
}

export const noopGenerateTypeChildren: GenerateTypeChildrenDefinition<Resource> =
  Object.values(kAppResourceType).reduce((acc, type) => {
    acc[type] = null;
    return acc;
  }, {} as GenerateTypeChildrenDefinition<Resource>);

export const generatePermissionItemsAsChildren: GenerateTypeChildrenFn<
  Resource,
  typeof kAppResourceType.PermissionItem
> = async ({resource, workspaceId}) =>
  flatten(
    await Promise.all([
      generateAndInsertPermissionItemListForTest(2, {
        workspaceId,
        entityId: resource.resourceId,
      }),
      generateAndInsertPermissionItemListForTest(2, {
        workspaceId,
        targetId: resource.resourceId,
      }),
    ])
  );

export const generateAssignedItemsAsChildren: GenerateTypeChildrenFn<
  Resource,
  typeof kAppResourceType.AssignedItem
> = async ({resource, workspaceId}) =>
  flatten(
    await Promise.all([
      generateAndInsertAssignedItemListForTest(2, {
        workspaceId,
        assignedItemId: resource.resourceId,
      }),
      generateAndInsertAssignedItemListForTest(2, {
        workspaceId,
        assigneeId: resource.resourceId,
      }),
    ])
  );
