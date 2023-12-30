import {
  AssignPermissionGroupInput,
  PermissionGroupMatcher,
  PublicAssignedPermissionGroupMeta,
  PublicPermissionGroup,
} from '../../definitions/permissionGroups';
import {
  FieldObjectFieldsMap,
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {permissionItemMddocParts} from '../permissionItems/endpoints.mddoc';
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
  AddPermissionGroupHttpEndpoint,
  AssignPermissionGroupsHttpEndpoint,
  CountWorkspacePermissionGroupsHttpEndpoint,
  DeletePermissionGroupHttpEndpoint,
  GetEntityAssignedPermissionGroupsHttpEndpoint,
  GetPermissionGroupHttpEndpoint,
  GetWorkspacePermissionGroupsHttpEndpoint,
  UnassignPermissionGroupsHttpEndpoint,
  UpdatePermissionGroupHttpEndpoint,
} from './types';
import {
  UpdatePermissionGroupEndpointParams,
  UpdatePermissionGroupEndpointResult,
  UpdatePermissionGroupInput,
} from './udpatePermissionGroup/types';
import {UnassignPermissionGroupsEndpointParams} from './unassignPermissionGroups/types';

const newPermissionGroupInput = mddocConstruct
  .constructFieldObject<NewPermissionGroupInput>()
  .setName('NewPermissionGroupInput')
  .setFields({
    name: mddocConstruct.constructFieldObjectField(true, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(false, fReusables.description),
  });

const permissionGroup = mddocConstruct
  .constructFieldObject<PublicPermissionGroup>()
  .setName('PermissionGroup')
  .setFields({
    resourceId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    createdBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    createdAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    lastUpdatedBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    lastUpdatedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    workspaceId: mddocConstruct.constructFieldObjectField(true, fReusables.workspaceId),
    name: mddocConstruct.constructFieldObjectField(true, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(false, fReusables.description),
  });

const assignedPermissionGroupMeta = mddocConstruct
  .constructFieldObject<PublicAssignedPermissionGroupMeta>()
  .setName('PublicAssignedPermissionGroupMeta')
  .setFields({
    permissionGroupId: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.permissionGroupId
    ),
    assignedBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    assignedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    assigneeEntityId: mddocConstruct.constructFieldObjectField(
      true,
      permissionItemMddocParts.entityId
    ),
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

const permissionGroupMatcherParts: FieldObjectFieldsMap<PermissionGroupMatcher> = {
  permissionGroupId: mddocConstruct.constructFieldObjectField(false, permissionGroupId),
  name: mddocConstruct.constructFieldObjectField(false, name),
  workspaceId: mddocConstruct.constructFieldObjectField(false, workspaceIdInput),
};

const addPermissionGroupParams = mddocConstruct
  .constructFieldObject<AddPermissionGroupEndpointParams>()
  .setName('AddPermissionGroupEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    permissionGroup: mddocConstruct.constructFieldObjectField(
      true,
      newPermissionGroupInput
    ),
  });
const addPermissionGroupResponseBody = mddocConstruct
  .constructFieldObject<AddPermissionGroupEndpointResult>()
  .setName('AddPermissionGroupEndpointResult')
  .setFields({
    permissionGroup: mddocConstruct.constructFieldObjectField(true, permissionGroup),
  });
const getWorkspacePermissionGroupsParams = mddocConstruct
  .constructFieldObject<GetWorkspacePermissionGroupsEndpointParams>()
  .setName('GetWorkspacePermissionGroupsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(false, fReusables.pageSize),
  });
const getWorkspacePermissionGroupsResponseBody = mddocConstruct
  .constructFieldObject<GetWorkspacePermissionGroupsEndpointResult>()
  .setName('GetWorkspacePermissionGroupsEndpointResult')
  .setFields({
    permissionGroups: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<PublicPermissionGroup>().setType(permissionGroup)
    ),
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
  });
const getEntityAssignedPermissionGroupsParams = mddocConstruct
  .constructFieldObject<GetEntityAssignedPermissionGroupsEndpointParams>()
  .setName('GetEntityAssignedPermissionGroupsParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    entityId: mddocConstruct.constructFieldObjectField(
      true,
      permissionItemMddocParts.entityId
    ),
    includeInheritedPermissionGroups: mddocConstruct.constructFieldObjectField(
      false,
      mddocConstruct
        .constructFieldBoolean()
        .setDescription(
          'Whether to include permission groups not directly assigned but inherited through permission groups assigned to entity.'
        )
    ),
  });
const getEntityAssignedPermissionGroupsResponseBody = mddocConstruct
  .constructFieldObject<GetEntityAssignedPermissionGroupsEndpointResult>()
  .setName('GetEntityAssignedPermissionGroupsEndpointResult')
  .setFields({
    permissionGroups: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<PublicPermissionGroup>().setType(permissionGroup)
    ),
    immediateAssignedPermissionGroupsMeta: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldArray<PublicAssignedPermissionGroupMeta>()
        .setType(assignedPermissionGroupMeta)
    ),
  });
const countWorkspacePermissionGroupsParams = mddocConstruct
  .constructFieldObject<CountWorkspacePermissionGroupsEndpointParams>()
  .setName('CountWorkspacePermissionGroupsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  });
const updatePermissionGroupParams = mddocConstruct
  .constructFieldObject<UpdatePermissionGroupEndpointParams>()
  .setName('UpdatePermissionGroupEndpointParams')
  .setFields({
    ...permissionGroupMatcherParts,
    data: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldObject<UpdatePermissionGroupInput>()
        .setFields({
          name: mddocConstruct.constructFieldObjectField(false, fReusables.name),
          description: mddocConstruct.constructFieldObjectField(
            false,
            fReusables.description
          ),
        })
        .setName('UpdatePermissionGroupInput')
    ),
  });
const updatePermissionGroupResponseBody = mddocConstruct
  .constructFieldObject<UpdatePermissionGroupEndpointResult>()
  .setName('UpdatePermissionGroupEndpointResult')
  .setFields({
    permissionGroup: mddocConstruct.constructFieldObjectField(true, permissionGroup),
  });
const assignPermissionGroupsParams = mddocConstruct
  .constructFieldObject<AssignPermissionGroupsEndpointParams>()
  .setName('AssignPermissionGroupsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    entityId: mddocConstruct.constructFieldObjectField(
      true,
      permissionItemMddocParts.entityIdOrList
    ),
    permissionGroups: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<AssignPermissionGroupInput>().setType(
        mddocConstruct
          .constructFieldObject<AssignPermissionGroupInput>()
          .setFields({
            permissionGroupId: mddocConstruct.constructFieldObjectField(
              true,
              fReusables.permissionGroupId
            ),
          })
          .setName('AssignPermissionGroupInput')
      )
    ),
  });
const unassignPermissionGroupsParams = mddocConstruct
  .constructFieldObject<UnassignPermissionGroupsEndpointParams>()
  .setName('UnassignPermissionGroupsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    entityId: mddocConstruct.constructFieldObjectField(
      true,
      permissionItemMddocParts.entityIdOrList
    ),
    permissionGroups: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldOrCombination<string | string[]>()
        .setTypes([
          fReusables.id.clone().setDescription('Permission group ID'),
          fReusables.idList.clone().setDescription('List of permission group IDs.'),
        ])
    ),
  });
const getPermissionGroupParams = mddocConstruct
  .constructFieldObject<GetPermissionGroupEndpointParams>()
  .setName('GetPermissionGroupEndpointParams')
  .setFields(permissionGroupMatcherParts);
const getPermissionGroupResponseBody = mddocConstruct
  .constructFieldObject<GetPermissionGroupEndpointResult>()
  .setName('GetPermissionGroupEndpointResult')
  .setFields({
    permissionGroup: mddocConstruct.constructFieldObjectField(true, permissionGroup),
  });
const deletePermissionGroupParams = mddocConstruct
  .constructFieldObject<DeletePermissionGroupEndpointParams>()
  .setName('DeletePermissionGroupEndpointParams')
  .setFields(permissionGroupMatcherParts);
export const addPermissionGroupEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      AddPermissionGroupHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      AddPermissionGroupHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<AddPermissionGroupHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      AddPermissionGroupHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      AddPermissionGroupHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      AddPermissionGroupHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionGroupConstants.routes.addPermissionGroup)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addPermissionGroupParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(addPermissionGroupResponseBody)
  .setName('AddPermissionGroupEndpoint');

export const getPermissionGroupEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetPermissionGroupHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetPermissionGroupHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<GetPermissionGroupHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      GetPermissionGroupHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetPermissionGroupHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetPermissionGroupHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionGroupConstants.routes.getPermissionGroup)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getPermissionGroupParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getPermissionGroupResponseBody)
  .setName('GetPermissionGroupEndpoint');

export const updatePermissionGroupEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      UpdatePermissionGroupHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      UpdatePermissionGroupHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      UpdatePermissionGroupHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      UpdatePermissionGroupHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      UpdatePermissionGroupHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      UpdatePermissionGroupHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionGroupConstants.routes.updatePermissionGroup)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updatePermissionGroupParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(updatePermissionGroupResponseBody)
  .setName('UpdatePermissionGroupEndpoint');

export const deletePermissionGroupEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      DeletePermissionGroupHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      DeletePermissionGroupHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      DeletePermissionGroupHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      DeletePermissionGroupHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      DeletePermissionGroupHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      DeletePermissionGroupHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionGroupConstants.routes.deletePermissionGroup)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deletePermissionGroupParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeletePermissionGroupEndpoint');

export const getWorkspacePermissionGroupsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionGroupConstants.routes.getWorkspacePermissionGroups)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspacePermissionGroupsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getWorkspacePermissionGroupsResponseBody)
  .setName('GetWorkspacePermissionGroupsEndpoint');

export const countWorkspacePermissionGroupsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      CountWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      CountWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      CountWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      CountWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      CountWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      CountWorkspacePermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionGroupConstants.routes.countWorkspacePermissionGroups)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(countWorkspacePermissionGroupsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountWorkspacePermissionGroupsEndpoint');

export const assignPermissionGroupsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      AssignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      AssignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      AssignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      AssignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      AssignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      AssignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionGroupConstants.routes.assignPermissionGroups)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(assignPermissionGroupsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setName('AssignPermissionGroupsEndpoint');

export const unassignPermissionGroupsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      UnassignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      UnassignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      UnassignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      UnassignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      UnassignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      UnassignPermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionGroupConstants.routes.unassignPermissionGroups)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(unassignPermissionGroupsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setName('UnassignPermissionGroupsEndpoint');

export const getEntityAssignedPermissionGroupsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetEntityAssignedPermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetEntityAssignedPermissionGroupsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetEntityAssignedPermissionGroupsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetEntityAssignedPermissionGroupsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetEntityAssignedPermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetEntityAssignedPermissionGroupsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(permissionGroupConstants.routes.getEntityAssignedPermissionGroups)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getEntityAssignedPermissionGroupsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getEntityAssignedPermissionGroupsResponseBody)
  .setName('GetEntityAssignedPermissionGroupsEndpoint');
