---
title: List Folder Content Endpoint
description: List folder content endpoint.
---

# {% $markdoc.frontmatter.title %}
## `/v1/folders/listFolderContent` — `post`
**Request Parameter Pathnames** — No extra pathnames present

**Request Queries** — No queries present

**Request Headers**
| Field | Type | Required | Description |
| - | - | - | - |
|`Authorization`|`string`|Required|Access token.|
|`Content-Type`|`string`|Required|HTTP JSON request content type.|

**Request Body Type** — `application/json`

`ListFolderContentEndpointParams`
| Field | Type | Required | Description |
| - | - | - | - |
|`folderpath`|`string`|Not required|Folder path.|
|`folderId`|`string`|Not required|Folder ID.|

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

`ListFolderContentEndpointSuccessResult`
| Field | Type | Description |
| - | - | - |
|`folders`|`array` of `object`|See below for `Folder`'s object fields.  undefined|
|`files`|`array` of `object`|See below for `File`'s object fields.  undefined|

`Folder`
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
|`idPath`|`array` of `string`|List of parent folder IDs. Folder ID.|
|`namePath`|`array` of `string`|List of parent folder names. Folder name.|
|`parentId`|`undefined` or `string`|Folder ID.|

`Agent`
| Field | Type | Description |
| - | - | - |
|`agentId`|`string`|Agent ID.|
|`agentType`|`string`|Agent type|

`File`
| Field | Type | Description |
| - | - | - |
|`size`|`string`|File size in bytes|
|`extension`|`string`|File extension|
|`resourceId`|`string`|Resource ID.|
|`workspaceId`|`string`|Workspace ID.|
|`folderId`|`undefined` or `string`|Folder ID.|
|`idPath`|`array` of `string`|List of parent folder IDs. Folder ID.|
|`namePath`|`array` of `string`|List of parent folder names. Folder name.|
|`mimetype`|`undefined` or `string`|File MIME type|
|`encoding`|`undefined` or `string`|File encoding|
|`createdBy`|`object`|See below for `Agent`'s object fields. |
|`createdAt`|`string`|Date string.|
|`lastUpdatedBy`|`object`|See below for `Agent`'s object fields. |
|`lastUpdatedAt`|`string`|Date string.|
|`name`|`string`|File name.|
|`description`|`undefined` or `string`|Description|



