---
title: Update Client Assigned Token Endpoint
description: Update client assigned token endpoint.
---

# {% $markdoc.frontmatter.title %}
## `/v1/clientAssignedTokens/updateToken` — `post`
**Request Parameter Pathnames** — No extra pathnames present

**Request Queries** — No queries present

**Request Headers**
| Field | Type | Required | Description |
| - | - | - | - |
|`Authorization`|`string`|Required|Access token.|
|`Content-Type`|`string`|Required|HTTP JSON request content type.|

**Request Body Type** — `application/json`

`UpdateClientAssignedTokenEndpointParams`
| Field | Type | Required | Description |
| - | - | - | - |
|`tokenId`|`string`|Not required|Resource ID.|
|`onReferenced`|`boolean`|Not required|Whether to perform action on the token used to authorize the API call when performing actions on tokens and a token ID or provided resource ID is not provided.|
|`providedResourceId`|`string`|Not required|Resource ID provided by you.|
|`workspaceId`|`string`|Not required|Workspace ID. Will default to using workspace ID from client and program tokens if not provided.|
|`token`|`object`|Not required|See below for 's object fields. |

| Field | Type | Required | Description |
| - | - | - | - |
|`providedResourceId`|`string`|Not required|Resource ID provided by you.|
|`name`|`string`|Not required|Name|
|`description`|`string`|Not required|Description|
|`permissionGroups`|`array` of `object`|Not required|See below for `AssignPermissionGroupInput`'s object fields.  undefined|

`AssignPermissionGroupInput`
| Field | Type | Required | Description |
| - | - | - | - |
|`permissionGroupId`|`string`|Not required|Resource ID.|
|`order`|`number`|Not required||

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

`UpdateClientAssignedTokenEndpointSuccessResult`
| Field | Type | Description |
| - | - | - |
|`token`|`object`|See below for `ClientAssignedToken`'s object fields. |

`ClientAssignedToken`
| Field | Type | Description |
| - | - | - |
|`resourceId`|`string`||
|`createdBy`|`object`|See below for `Agent`'s object fields. |
|`createdAt`|`string`|Date string.|
|`lastUpdatedBy`|`object`|See below for `Agent`'s object fields. |
|`lastUpdatedAt`|`string`|Date string.|
|`name`|`string`|Name|
|`description`|`undefined` or `string`|Description|
|`expires`|`undefined` or `iso date string`|Expiration date.|
|`providedResourceId`|`undefined` or `null or string`|Resource ID provided by you.|
|`workspaceId`|`string`|Workspace ID.|
|`permissionGroups`|`array` of `object`|See below for `AssignPermissionGroupInput`'s object fields.  undefined|
|`tokenStr`|`string`|JWT token string.|

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


