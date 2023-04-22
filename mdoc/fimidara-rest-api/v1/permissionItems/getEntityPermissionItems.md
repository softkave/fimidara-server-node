---
title: Get Entity Permission Items Endpoint
description: Get entity permission items endpoint.
---

# {% $markdoc.frontmatter.title %}

## `/v1/permissionItems/getEntityPermissionItems` — `post`

**Request Parameter Pathnames** — No extra pathnames present

**Request Queries** — No queries present

**Request Headers**
| Field | Type | Required | Description |
| - | - | - | - |
|`Authorization`|`string`|Required|Access token.|
|`Content-Type`|`string`|Required|HTTP JSON request content type.|

**Request Body Type** — `application/json`

`getEntityPermissionItemsEndpointParams`
| Field | Type | Required | Description |
| - | - | - | - |
|`entityId`|`string`|Not required|Permission entity resource ID. Permission entity is the resource granted access. This can be a user, a permission group, a permission item, or a client assigned token.|
|`permissionEntityType`|`string`|Not required|Permission entity resource type. Permission entity is the resource granted access. This can be a user, a permission group, a permission item, or a client assigned token.|
|`workspaceId`|`string`|Not required|Workspace ID. Will default to using workspace ID from client and program tokens if not provided.|

**4XX or 5XX — Response Headers**
| Field | Type | Description |
| - | - | - |
|`Content-Type`|`string`|HTTP JSON response content type.|
|`Content-Length`|`string`|HTTP response content length in bytes.|

**4XX or 5XX — Response Body Type** — `application/json`

`EndpointErrorResult`
| Field | Type | Description |
| - | - | - |
|`errors`|`array` of `object`|See below for `OperationError`'s object fields. Endpoint call response errors. undefined|

`OperationError`
| Field | Type | Description |
| - | - | - |
|`name`|`string`|Error name.|
|`message`|`string`|Error message.|
|`field`|`string` or `undefined`|Invalid field failing validation when error is ValidationError.|

**200 — Response Headers**
| Field | Type | Description |
| - | - | - |
|`Content-Type`|`string`|HTTP JSON response content type.|
|`Content-Length`|`string`|HTTP response content length in bytes.|

**200 — Response Body Type** — `application/json`

`getEntityPermissionItemsEndpointSuccessResult`
| Field | Type | Description |
| - | - | - |
|`items`|`array` of `object`|See below for `PermissionItem`'s object fields. undefined|

`PermissionItem`
| Field | Type | Description |
| - | - | - |
|`containerId`|`string`|Resource ID of the container resource to search under. Defaults to workspace ID. Containers serve to subclass permission so that you can for example, grant access to all files in a folder without risking granting permission to all the files in a workspace.|
|`containerType`|`string`|Resource type of the container resource to search under. Defaults to workspace. Containers serve to subclass permission so that you can for example, grant access to all files in a folder without risking granting permission to all the files in a workspace.|
|`entityId`|`string`|Permission entity resource ID. Permission entity is the resource granted access. This can be a user, a permission group, a permission item, or a client assigned token.|
|`permissionEntityType`|`string`|Permission entity resource type. Permission entity is the resource granted access. This can be a user, a permission group, a permission item, or a client assigned token.|
|`targetType`|`string`|Resource type to retrieve permission items for. You can pass only the resource type to retrieve all the permission items that grant access to a resource type, or also pass a resource ID to restrict it to just that resource.|
|`resourceId`|`string`||
|`createdBy`|`object`|See below for `Agent`'s object fields. |
|`createdAt`|`string`|Date string.|
|`workspaceId`|`string`|Workspace ID.|
|`targetId`|`undefined` or `string`|Resource ID of the resource to retrieve permission items for.|
|`action`|`string`|Action|
|`grantAccess`|`boolean`||
|`appliesTo`|`string`|Whether this permission applies to both the containing folder and it's children, just the container, or just the children.|

`Agent`
| Field | Type | Description |
| - | - | - |
|`agentId`|`string`|Agent ID.|
|`agentType`|`string`|Agent type|
