---
title: Update Collaborator Permission Groups Endpoint
description: Update collaborator permission groups endpoint.
---

# {% $markdoc.frontmatter.title %}
## `/v1/collaborators/updateCollaboratorPermissionGroups` — `post`
**Request Parameter Pathnames** — No extra pathnames present

**Request Queries** — No queries present

**Request Headers**
| Field | Type | Required | Description |
| - | - | - | - |
|`Authorization`|`string`|Required|Access token.|
|`Content-Type`|`string`|Required|HTTP JSON request content type.|

**Request Body Type** — `application/json`

`UpdateCollaboratorEndpointParams`
| Field | Type | Required | Description |
| - | - | - | - |
|`workspaceId`|`string`|Not required|Workspace ID. Will default to using workspace ID from client and program tokens if not provided.|
|`collaboratorId`|`string`|Not required|Resource ID.|
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

`UpdateCollaboratorEndpointSuccessResult`
| Field | Type | Description |
| - | - | - |
|`collaborator`|`object`|See below for `Collaborator`'s object fields. |

`Collaborator`
| Field | Type | Description |
| - | - | - |
|`resourceId`|`string`|Resource ID.|
|`firstName`|`string`|First name.|
|`lastName`|`string`|Last name.|
|`email`|`string`|Email address.|
|`workspaceId`|`string`|Workspace ID.|
|`joinedAt`|`string`|Date string.|
|`permissionGroups`|`array` of `object`|See below for `AssignPermissionGroupInput`'s object fields.  undefined|

`AssignPermissionGroupInput`
| Field | Type | Description |
| - | - | - |
|`permissionGroupId`|`string`|Resource ID.|
|`order`|`number`||


