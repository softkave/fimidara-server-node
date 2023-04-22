---
title: Upload File Endpoint
description: Upload file endpoint.
---

# {% $markdoc.frontmatter.title %}
## `/v1/files/uploadFile` — `post`
**Request Parameter Pathnames**
`HTTPParameterPathname`
| Field | Type | Required | Description |
| - | - | - | - |
|`filepath`|`string`|Not required|File path. You can pass the filepath either in the URL or in the request body.|


**Request Queries** — No queries present

**Request Headers**
| Field | Type | Required | Description |
| - | - | - | - |
|`Authorization`|`string`|Required|Access token.|
|`Content-Type`|`string`|Required|HTTP JSON request content type.|

**Request Body Type** — `multipart/form-data`

**Request Body**
`UploadFileEndpointParams`
| Field | Type | Required | Description |
| - | - | - | - |
|`filepath`|`string`|Not required|File name.|
|`fileId`|`string`|Not required|File ID.|
|`data`|`binary`|Required|File binary.|
|`description`|`string`|Not required|Description|
|`mimetype`|`string`|Not required|File MIME type|
|`publicAccessAction`|`string`|Not required|Public access actions allowed on a file|
|`encoding`|`string`|Not required|File encoding|
|`extension`|`string`|Not required|File extension|

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

`UploadFileEndpointSuccessResult`
| Field | Type | Description |
| - | - | - |
|`file`|`object`|See below for `File`'s object fields. |

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

`Agent`
| Field | Type | Description |
| - | - | - |
|`agentId`|`string`|Agent ID.|
|`agentType`|`string`|Agent type|


