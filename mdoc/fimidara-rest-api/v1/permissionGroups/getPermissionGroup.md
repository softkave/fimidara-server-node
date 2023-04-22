---
title: Get Permission Group Endpoint
description: Get permission group endpoint.
---

# {% $markdoc.frontmatter.title %}
## `/v1/permissionGroups/getPermissionGroup` — `post`
**Request Parameter Pathnames** — No extra pathnames present

**Request Queries** — No queries present

**Request Headers**
| Field | Type | Required | Description |
| - | - | - | - |
|`Authorization`|`string`|Required|Access token.|
|`Content-Type`|`string`|Required|HTTP JSON request content type.|

**Request Body Type** — `application/json`

`GetPermissionGroupEndpointParams`
| Field | Type | Required | Description |
| - | - | - | - |
|`permissionGroupId`|`string`|Not required|Permission group ID. Either provide the permission group ID, or provide the workspace ID and permission group name.|
|`name`|`string`|Not required|Permission group name. Either provide the permission group ID, or provide the workspace ID and permission group name.|
|`workspaceId`|`string`|Not required|Workspace ID. Will default to using workspace ID from client and program tokens if not provided.Either provide the permission group ID, or provide the workspace ID and permission group name.|

**4XX or 5XX  —  Response Headers**
| Field | Type | Description |
| - | - | - |
|`Content-Type`|`string`|HTTP JSON response content type.|
|`Content-Length`|`string`|HTTP response content length in bytes.|

**4XX or 5XX  —  Response Body Type** — `application/json`

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

**200  —  Response Headers**
| Field | Type | Description |
| - | - | - |
|`Content-Type`|`string`|HTTP JSON response content type.|
|`Content-Length`|`string`|HTTP response content length in bytes.|

**200  —  Response Body Type** — `application/json`

`GetPermissionGroupEndpointSuccessResult`
| Field | Type | Description |
| - | - | - |
|`permissionGroup`|`object`|See below for `PermissionGroup`'s object fields. |

`PermissionGroup`
| Field | Type | Description |
| - | - | - |
|`resourceId`|`string`||
|`createdBy`|`object`|See below for `Agent`'s object fields. |
|`createdAt`|`string`|Date string.|
|`lastUpdatedBy`|`object`|See below for `Agent`'s object fields. |
|`lastUpdatedAt`|`string`|Date string.|
|`name`|`string`|Name|
|`description`|`undefined` or `string`|Description|
|`workspaceId`|`string`|Workspace ID.|
|`permissionGroups`|`array` of `object`|See below for `AssignPermissionGroupInput`'s object fields.  undefined|

`Agent`
| Field | Type | Description |
| - | - | - |
|`agentId`|`string`|Agent ID.|
|`agentType`|`string`|Agent type|

`AssignPermissionGroupInput`
| Field | Type | Description |
| - | - | - |
|`permissionGroupId`|`string`|Resource ID.|
|`order`|`number`||


