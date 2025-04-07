import {first, flatten, uniq} from 'lodash-es';
import {AnyFn, AnyObject, PartialRecord} from 'softkave-js-utils';
import {expect} from 'vitest';
import {
  kIjxSemantic,
  kIjxUtils,
} from '../../../../../contexts/ijx/injectables.js';
import {
  DeleteResourceJobParams,
  kJobType,
} from '../../../../../definitions/job.js';
import {
  FimidaraResourceType,
  FimidaraTypeToTSType,
  Resource,
  kFimidaraResourceType,
} from '../../../../../definitions/system.js';
import {kSystemSessionAgent} from '../../../../../utils/agent.js';
import {extractResourceIdList} from '../../../../../utils/fns.js';
import {
  getNewId,
  getNewIdForResource,
  getResourceTypeFromId,
} from '../../../../../utils/resource.js';
import {generateAndInsertAssignedItemListForTest} from '../../../../testHelpers/generate/permissionGroup.js';
import {generateAndInsertPermissionItemListForTest} from '../../../../testHelpers/generate/permissionItem.js';
import {queueJobs} from '../../../queueJobs.js';
import {runDeleteResourceJob} from '../runDeleteResourceJob.js';
import {DeleteResourceCascadeEntry} from '../types.js';

export type GenerateResourceFn<T extends Resource> = AnyFn<
  [{workspaceId: string}],
  Promise<T>
>;

export type GenerateTypeChildrenFn<
  TResource extends Resource,
  TKey extends FimidaraResourceType,
> = AnyFn<
  [{resource: TResource; workspaceId: string}],
  Promise<FimidaraTypeToTSType<TKey>[]>
>;

export type GenerateTypeChildrenDefinition<TResource extends Resource> = {
  [TKey in FimidaraResourceType]: GenerateTypeChildrenFn<
    TResource,
    TKey
  > | null;
};

export type GetResourcesByIdFn<TKey extends FimidaraResourceType> = AnyFn<
  [{idList: string[]}],
  Promise<FimidaraTypeToTSType<TKey>[]>
>;

export type GetResourcesByIdDefinition = {
  [TKey in FimidaraResourceType]: GetResourcesByIdFn<TKey> | null;
};

type TypeToResourceMap<
  TTypes extends FimidaraResourceType = FimidaraResourceType,
> = {
  [TKey in TTypes]?: FimidaraTypeToTSType<TKey>[];
};

type TypeToIdList = PartialRecord<FimidaraResourceType, string[] | undefined>;

async function generateTypeChildrenWithDef<T extends Resource>(props: {
  def: GenerateTypeChildrenDefinition<T>;
  resource: T;
  workspaceId: string;
  forTypes?: FimidaraResourceType[];
}) {
  const {resource, workspaceId, def, forTypes = Object.keys(def)} = props;
  const result: AnyObject = {};
  await Promise.all(
    forTypes.map(async type => {
      const children = await def[type as FimidaraResourceType]?.({
        resource,
        workspaceId,
      });
      result[type] = children;
    })
  );

  return result as TypeToResourceMap;
}

function resourceMapToIdMap(resourcesMap: TypeToResourceMap) {
  return Object.entries(resourcesMap).reduce((acc, [key, resources]) => {
    if (resources) {
      acc[key as FimidaraResourceType] = extractResourceIdList(
        resources as Resource[]
      );
    }

    return acc;
  }, {} as TypeToIdList);
}

const kGetResourcesByIdDef: GetResourcesByIdDefinition = {
  [kFimidaraResourceType.All]: () => Promise.resolve([]),
  [kFimidaraResourceType.System]: () => Promise.resolve([]),
  [kFimidaraResourceType.Public]: () => Promise.resolve([]),
  [kFimidaraResourceType.User]: () => Promise.resolve([]),
  [kFimidaraResourceType.EndpointRequest]: () => Promise.resolve([]),
  [kFimidaraResourceType.App]: () => Promise.resolve([]),
  [kFimidaraResourceType.Job]: () => Promise.resolve([]),
  [kFimidaraResourceType.appShard]: () => Promise.resolve([]),
  [kFimidaraResourceType.jobHistory]: () => Promise.resolve([]),
  [kFimidaraResourceType.script]: () => Promise.resolve([]),
  [kFimidaraResourceType.Workspace]: ({idList}) =>
    kIjxSemantic.workspace().getManyByIdList(idList),
  [kFimidaraResourceType.CollaborationRequest]: ({idList}) =>
    kIjxSemantic.collaborationRequest().getManyByIdList(idList),
  [kFimidaraResourceType.AgentToken]: ({idList}) =>
    kIjxSemantic.agentToken().getManyByIdList(idList),
  [kFimidaraResourceType.PermissionGroup]: ({idList}) =>
    kIjxSemantic.permissionGroup().getManyByIdList(idList),
  [kFimidaraResourceType.PermissionItem]: ({idList}) =>
    kIjxSemantic.permissionItem().getManyByIdList(idList),
  [kFimidaraResourceType.Folder]: ({idList}) =>
    kIjxSemantic.folder().getManyByIdList(idList),
  [kFimidaraResourceType.File]: ({idList}) =>
    kIjxSemantic.file().getManyByIdList(idList),
  [kFimidaraResourceType.Tag]: ({idList}) =>
    kIjxSemantic.tag().getManyByIdList(idList),
  [kFimidaraResourceType.AssignedItem]: ({idList}) =>
    kIjxSemantic.assignedItem().getManyByIdList(idList),
  [kFimidaraResourceType.UsageRecord]: ({idList}) =>
    kIjxSemantic.usageRecord().getManyByIdList(idList),
  [kFimidaraResourceType.PresignedPath]: ({idList}) =>
    kIjxSemantic.presignedPath().getManyByIdList(idList),
  [kFimidaraResourceType.FileBackendMount]: ({idList}) =>
    kIjxSemantic.fileBackendMount().getManyByIdList(idList),
  [kFimidaraResourceType.FileBackendConfig]: ({idList}) =>
    kIjxSemantic.fileBackendConfig().getManyByIdList(idList),
  [kFimidaraResourceType.ResolvedMountEntry]: ({idList}) =>
    kIjxSemantic.resolvedMountEntry().getManyByIdList(idList),
  [kFimidaraResourceType.emailMessage]: ({idList}) =>
    kIjxSemantic.emailMessage().getManyByIdList(idList),
  [kFimidaraResourceType.emailBlocklist]: ({idList}) =>
    kIjxSemantic.emailBlocklist().getManyByIdList(idList),
  [kFimidaraResourceType.filePart]: ({idList}) =>
    kIjxSemantic.filePart().getManyByIdList(idList),
};

async function fetchTypeChildrenWithDef(props: {
  idMap: TypeToIdList;
  forTypes?: FimidaraResourceType[];
}) {
  const {idMap, forTypes = Object.keys(kGetResourcesByIdDef)} = props;
  const result: AnyObject = {};
  await Promise.all(
    forTypes.map(async type => {
      const children = await kGetResourcesByIdDef[
        type as FimidaraResourceType
      ]?.({
        idList: idMap[type as FimidaraResourceType] || [],
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

export async function testDeleteResourceArtifactsJob<
  T extends Resource,
  TOther = unknown,
>(props: {
  type: FimidaraResourceType;
  genResourceFn: AnyFn<[{workspaceId: string; shard: string}], Promise<T>>;
  genChildrenDef: GenerateTypeChildrenDefinition<T>;
  deleteCascadeDef: DeleteResourceCascadeEntry;
  genWorkspaceFn?: AnyFn<[], Promise<string>>;
  genOtherFn?: AnyFn<[{resource: T}], Promise<TOther>>;
  confirmOtherDeletedFn?: AnyFn<[{resource: T; other?: TOther}], Promise<void>>;
}) {
  const {
    type,
    genResourceFn,
    genChildrenDef,
    deleteCascadeDef,
    genOtherFn,
    confirmOtherDeletedFn,
    genWorkspaceFn = () =>
      Promise.resolve(getNewIdForResource(kFimidaraResourceType.Workspace)),
  } = props;
  const workspaceId = await genWorkspaceFn();
  const shard = getNewId();
  const mainResource = await genResourceFn({workspaceId, shard});
  const other = await genOtherFn?.({resource: mainResource});
  const getArtifactTypes = Object.keys(
    deleteCascadeDef.getArtifactsToDelete
  ).filter(
    type =>
      !!deleteCascadeDef.getArtifactsToDelete[type as FimidaraResourceType]
  );
  const deleteArtifactTypes = Object.keys(
    deleteCascadeDef.deleteArtifacts
  ).filter(
    type =>
      !!deleteCascadeDef.deleteArtifacts[type as FimidaraResourceType] &&
      !deleteCascadeDef.getArtifactsToDelete[type as FimidaraResourceType]
  );
  const artifactTypes = uniq(getArtifactTypes.concat(deleteArtifactTypes));
  const childrenMap = await generateTypeChildrenWithDef({
    workspaceId,
    resource: mainResource,
    def: genChildrenDef,
    forTypes: artifactTypes as FimidaraResourceType[],
  });

  const [job] = await queueJobs<DeleteResourceJobParams>(
    workspaceId,
    /** parent job ID */ undefined,
    [
      {
        shard,
        createdBy: kSystemSessionAgent,
        type: kJobType.deleteResource,
        params: {type, workspaceId, resourceId: mainResource.resourceId},
        idempotencyToken: Date.now().toString(),
      },
    ]
  );

  await runDeleteResourceJob(job);
  await kIjxUtils.promises().flush();

  const getArtifactsMap = getArtifactTypes.reduce(
    (acc, type) => {
      acc[type] = childrenMap[type as FimidaraResourceType] as Resource[];
      return acc;
    },
    {} as Record<string, AnyObject[] | undefined>
  );
  const idMap = resourceMapToIdMap(childrenMap);
  const getArtifactsIdMap = resourceMapToIdMap(getArtifactsMap);
  const getArtifactsIdList = flattenIdMap(getArtifactsIdMap);

  const [fetchedChildrenMap, childrenJobs, dbResource] = await Promise.all([
    fetchTypeChildrenWithDef({
      idMap,
      forTypes: deleteArtifactTypes as FimidaraResourceType[],
    }),
    kIjxSemantic.job().getManyByQuery({
      shard: job.shard,
      parentJobId: job.resourceId,
      priority: job.priority,
      params: {
        $objMatch: {
          workspaceId: job.params.workspaceId,
          resourceId: {$in: getArtifactsIdList},
        },
      },
    }),
    getResourceById(mainResource.resourceId),
    confirmOtherDeletedFn?.({other, resource: mainResource}),
  ]);

  expect(dbResource).toBeFalsy();
  expect(childrenJobs.length).toBe(getArtifactsIdList.length);
  Object.entries(fetchedChildrenMap).forEach(([, resources]) => {
    expect(resources?.length || 0).toBe(0);
  });
}

export const noopGenerateTypeChildren: GenerateTypeChildrenDefinition<Resource> =
  Object.values(kFimidaraResourceType).reduce((acc, type) => {
    acc[type] = null;
    return acc;
  }, {} as GenerateTypeChildrenDefinition<Resource>);

export const generatePermissionItemsAsChildren: GenerateTypeChildrenFn<
  Resource,
  typeof kFimidaraResourceType.PermissionItem
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
  typeof kFimidaraResourceType.AssignedItem
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
