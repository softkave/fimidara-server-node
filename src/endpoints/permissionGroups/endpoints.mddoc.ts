import {
  AssignPermissionGroupInput,
  PermissionGroupMatcher,
  PublicAssignedPermissionGroupMeta,
  PublicPermissionGroup,
} from '../../definitions/permissionGroups';
import {
  FieldArray,
  FieldBoolean,
  FieldObject,
  FieldObjectFields,
  HttpEndpointDefinition,
  HttpEndpointMethod,
} from '../../mddoc/mddoc';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {LongRunningJobResult} from '../jobs/types';
import {permissionItemMddocParts} from '../permissionItems/endpoints.mddoc';
import {
  CountItemsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {
  AddPermissionGroupEndpointParams,
  AddPermissionGroupEndpointResult,
  NewPermissionGroupInput,
} from './addPermissionGroup/types';
import {AssignPermissionGroupsEndpointParams} from './assignPermissionGroups/types';
import {permissionGroupConstants} from './constants';
import {CountWorkspacePermissionGroupsEndpointParams} from './countWorkspacePermissionGroups/types';
import {DeletePermissionGroupEndpointParams} from './deletePermissionGroup/types';
import {
  GetEntityAssignedPermissionGroupsEndpointParams,
  GetEntityAssignedPermissionGroupsEndpointResult,
} from './getEntityAssignedPermissionGroups/types';
import {
  GetPermissionGroupEndpointParams,
  GetPermissionGroupEndpointResult,
} from './getPermissionGroup/types';
import {
  GetWorkspacePermissionGroupsEndpointParams,
  GetWorkspacePermissionGroupsEndpointResult,
} from './getWorkspacePermissionGroups/types';
import {
  UpdatePermissionGroupEndpointParams,
  UpdatePermissionGroupEndpointResult,
  UpdatePermissionGroupInput,
} from './udpatePermissionGroup/types';
import {UnassignPermissionGroupsEndpointParams} from './unassignPermissionGroups/types';

const newPermissionGroupInput = FieldObject.construct<NewPermissionGroupInput>()
  .setName('NewPermissionGroupInput')
  .setFields({
    name: FieldObject.requiredField(fReusables.name),
    description: FieldObject.optionalField(fReusables.description),
  });

const permissionGroup = FieldObject.construct<PublicPermissionGroup>()
  .setName('PermissionGroup')
  .setFields({
    resourceId: FieldObject.requiredField(fReusables.id),
    createdBy: FieldObject.requiredField(fReusables.agent),
    createdAt: FieldObject.requiredField(fReusables.date),
    lastUpdatedBy: FieldObject.requiredField(fReusables.agent),
    lastUpdatedAt: FieldObject.requiredField(fReusables.date),
    workspaceId: FieldObject.requiredField(fReusables.workspaceId),
    name: FieldObject.requiredField(fReusables.name),
    description: FieldObject.optionalField(fReusables.description),
    providedResourceId: FieldObject.optionalField(fReusables.providedResourceId),
  });

const assignedPermissionGroupMeta = FieldObject.construct<PublicAssignedPermissionGroupMeta>()
  .setName('PublicAssignedPermissionGroupMeta')
  .setFields({
    permissionGroupId: FieldObject.requiredField(fReusables.permissionGroupId),
    assignedBy: FieldObject.requiredField(fReusables.agent),
    assignedAt: FieldObject.requiredField(fReusables.date),
    assigneeEntityId: FieldObject.requiredField(permissionItemMddocParts.entityId),
  });

const permissionGroupId = fReusables.permissionGroupId
  .clone()
  .setDescription(
    'Permission group ID. Either provide the permission group ID, or provide the workspace ID and permission group name.'
  );
const name = fReusables.name
  .clone()
  .setDescription(
    'Permission group name. Either provide the permission group ID, or provide the workspace ID and permission group name.'
  );
const workspaceIdInput = fReusables.workspaceIdInput
  .clone()
  .setDescription(
    fReusables.workspaceIdInput.assertGetDescription() +
      'Either provide the permission group ID, or provide the workspace ID and permission group name.'
  );

const permissionGroupMatcherParts: FieldObjectFields<PermissionGroupMatcher> = {
  permissionGroupId: FieldObject.optionalField(permissionGroupId),
  name: FieldObject.optionalField(name),
  workspaceId: FieldObject.optionalField(workspaceIdInput),
};

const addPermissionGroupParams = FieldObject.construct<AddPermissionGroupEndpointParams>()
  .setName('AddPermissionGroupEndpointParams')
  .setFields({
    workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    permissionGroup: FieldObject.requiredField(newPermissionGroupInput),
  })
  .setRequired(true)
  .setDescription('Add permission group endpoint params.');
const addPermissionGroupResponseBody = FieldObject.construct<AddPermissionGroupEndpointResult>()
  .setName('AddPermissionGroupEndpointResult')
  .setFields({permissionGroup: FieldObject.requiredField(permissionGroup)})
  .setRequired(true)
  .setDescription('Add permission group endpoint success result.');

const getWorkspacePermissionGroupsParams =
  FieldObject.construct<GetWorkspacePermissionGroupsEndpointParams>()
    .setName('GetWorkspacePermissionGroupsEndpointParams')
    .setFields({
      workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
      page: FieldObject.optionalField(fReusables.page),
      pageSize: FieldObject.optionalField(fReusables.pageSize),
    })
    .setRequired(true)
    .setDescription('Get workspace permission groups endpoint params.');
const getWorkspacePermissionGroupsResponseBody =
  FieldObject.construct<GetWorkspacePermissionGroupsEndpointResult>()
    .setName('GetWorkspacePermissionGroupsEndpointResult')
    .setFields({
      permissionGroups: FieldObject.requiredField(
        FieldArray.construct<PublicPermissionGroup>().setType(permissionGroup)
      ),
      page: FieldObject.requiredField(fReusables.page),
    })
    .setRequired(true)
    .setDescription('Get workspace permission groups endpoint success result.');

const getEntityAssignedPermissionGroupsParams =
  FieldObject.construct<GetEntityAssignedPermissionGroupsEndpointParams>()
    .setName('GetEntityAssignedPermissionGroupsParams')
    .setFields({
      workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
      entityId: FieldObject.requiredField(permissionItemMddocParts.entityId),
      includeInheritedPermissionGroups: FieldObject.optionalField(
        FieldBoolean.construct().setDescription(
          'Whether to include permission groups not directly assigned but inherited through permission groups assigned to entity.'
        )
      ),
    })
    .setRequired(true)
    .setDescription('Get entity assigned permission groups endpoint params.');
const getEntityAssignedPermissionGroupsResponseBody =
  FieldObject.construct<GetEntityAssignedPermissionGroupsEndpointResult>()
    .setName('GetEntityAssignedPermissionGroupsEndpointResult')
    .setFields({
      permissionGroups: FieldObject.requiredField(
        FieldArray.construct<PublicPermissionGroup>().setType(permissionGroup)
      ),
      immediateAssignedPermissionGroupsMeta: FieldObject.requiredField(
        FieldArray.construct<PublicAssignedPermissionGroupMeta>().setType(
          assignedPermissionGroupMeta
        )
      ),
    })
    .setRequired(true)
    .setDescription('Get entity assigned permission groups endpoint success result.');

const countWorkspacePermissionGroupsParams =
  FieldObject.construct<CountWorkspacePermissionGroupsEndpointParams>()
    .setName('CountWorkspacePermissionGroupsEndpointParams')
    .setFields({
      workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    })
    .setRequired(true)
    .setDescription('Count workspace permission groups endpoint params.');

const updatePermissionGroupParams = FieldObject.construct<UpdatePermissionGroupEndpointParams>()
  .setName('UpdatePermissionGroupEndpointParams')
  .setFields({
    ...permissionGroupMatcherParts,
    data: FieldObject.requiredField(
      FieldObject.construct<UpdatePermissionGroupInput>()
        .setFields({
          name: FieldObject.optionalField(fReusables.name),
          description: FieldObject.optionalField(fReusables.description),
        })
        .setName('UpdatePermissionGroupInput')
    ),
  })
  .setRequired(true)
  .setDescription('Update permission group endpoint params.');
const updatePermissionGroupResponseBody =
  FieldObject.construct<UpdatePermissionGroupEndpointResult>()
    .setName('UpdatePermissionGroupEndpointResult')
    .setFields({permissionGroup: FieldObject.requiredField(permissionGroup)})
    .setRequired(true)
    .setDescription('Update permission group endpoint success result.');

const assignPermissionGroupsParams = FieldObject.construct<AssignPermissionGroupsEndpointParams>()
  .setName('AssignPermissionGroupsEndpointParams')
  .setFields({
    workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    entityId: FieldObject.requiredField(permissionItemMddocParts.entityIdList),
    permissionGroups: FieldObject.requiredField(
      FieldArray.construct<AssignPermissionGroupInput>().setType(
        FieldObject.construct<AssignPermissionGroupInput>()
          .setFields({
            permissionGroupId: FieldObject.requiredField(fReusables.permissionGroupId),
          })
          .setName('AssignPermissionGroupInput')
      )
    ),
  })
  .setRequired(true)
  .setDescription('Assign permission groups endpoint params.');

const unassignPermissionGroupsParams =
  FieldObject.construct<UnassignPermissionGroupsEndpointParams>()
    .setName('UnassignPermissionGroupsEndpointParams')
    .setFields({
      workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
      entityId: FieldObject.requiredField(permissionItemMddocParts.entityIdList),
      permissionGroups: FieldObject.requiredField(
        fReusables.idList.clone().setDescription('List of permission group IDs.')
      ),
    })
    .setRequired(true)
    .setDescription('Unassign permission groups endpoint params.');

const getPermissionGroupParams = FieldObject.construct<GetPermissionGroupEndpointParams>()
  .setName('GetPermissionGroupEndpointParams')
  .setFields(permissionGroupMatcherParts)
  .setRequired(true)
  .setDescription('Get permission group endpoint params.');
const getPermissionGroupResponseBody = FieldObject.construct<GetPermissionGroupEndpointResult>()
  .setName('GetPermissionGroupEndpointResult')
  .setFields({permissionGroup: FieldObject.requiredField(permissionGroup)})
  .setRequired(true)
  .setDescription('Get permission group endpoint success result.');

const deletePermissionGroupParams = FieldObject.construct<DeletePermissionGroupEndpointParams>()
  .setName('DeletePermissionGroupEndpointParams')
  .setFields(permissionGroupMatcherParts)
  .setRequired(true)
  .setDescription('Delete permission group endpoint params.');

export const addPermissionGroupEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: AddPermissionGroupEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: AddPermissionGroupEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(permissionGroupConstants.routes.addPermissionGroup)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addPermissionGroupParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(addPermissionGroupResponseBody)
  .setName('AddPermissionGroupEndpoint')
  .setDescription('Add permission group endpoint.');

export const getPermissionGroupEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetPermissionGroupEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetPermissionGroupEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(permissionGroupConstants.routes.getPermissionGroup)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getPermissionGroupParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getPermissionGroupResponseBody)
  .setName('GetPermissionGroupEndpoint')
  .setDescription('Get permission group endpoint.');

export const updatePermissionGroupEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: UpdatePermissionGroupEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: UpdatePermissionGroupEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(permissionGroupConstants.routes.updatePermissionGroup)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updatePermissionGroupParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(updatePermissionGroupResponseBody)
  .setName('UpdatePermissionGroupEndpoint')
  .setDescription('Update permission group endpoint.');

export const deletePermissionGroupEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: DeletePermissionGroupEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LongRunningJobResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(permissionGroupConstants.routes.deletePermissionGroup)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deletePermissionGroupParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeletePermissionGroupEndpoint')
  .setDescription('Delete permission group endpoint.');

export const getWorkspacePermissionGroupsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetWorkspacePermissionGroupsEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetWorkspacePermissionGroupsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(permissionGroupConstants.routes.getWorkspacePermissionGroups)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspacePermissionGroupsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getWorkspacePermissionGroupsResponseBody)
  .setName('GetWorkspacePermissionGroupsEndpoint')
  .setDescription('Get workspace permission groups endpoint.');

export const countWorkspacePermissionGroupsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: CountWorkspacePermissionGroupsEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: CountItemsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(permissionGroupConstants.routes.countWorkspacePermissionGroups)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(countWorkspacePermissionGroupsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountWorkspacePermissionGroupsEndpoint')
  .setDescription('Count workspace permission groups endpoint.');

export const assignPermissionGroupsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: AssignPermissionGroupsEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
}>()
  .setBasePathname(permissionGroupConstants.routes.assignPermissionGroups)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(assignPermissionGroupsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setName('AssignPermissionGroupsEndpoint')
  .setDescription('Assign permission groups endpoint.');

export const unassignPermissionGroupsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: UnassignPermissionGroupsEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
}>()
  .setBasePathname(permissionGroupConstants.routes.unassignPermissionGroups)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(unassignPermissionGroupsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setName('UnassignPermissionGroupsEndpoint')
  .setDescription('Unassigns permission groups.');

export const getEntityAssignedPermissionGroupsEndpointDefinition =
  HttpEndpointDefinition.construct<{
    requestBody: GetEntityAssignedPermissionGroupsEndpointParams;
    requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
    responseBody: GetEntityAssignedPermissionGroupsEndpointResult;
    responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
  }>()
    .setBasePathname(permissionGroupConstants.routes.getEntityAssignedPermissionGroups)
    .setMethod(HttpEndpointMethod.Post)
    .setRequestBody(getEntityAssignedPermissionGroupsParams)
    .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
    .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
    .setResponseBody(getEntityAssignedPermissionGroupsResponseBody)
    .setName('GetEntityAssignedPermissionGroupsEndpoint')
    .setDescription('Get entity assigned permission groups endpoint.');
