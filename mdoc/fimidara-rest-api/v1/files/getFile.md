---
title: Get File Endpoint
description: Get file endpoint.
---

# {% $markdoc.frontmatter.title %}
## `/v1/files/getFile` — `post`
**Request Parameter Pathnames**
`HTTPParameterPathname`
| Field | Type | Required | Description |
| - | - | - | - |
|`filepath`|`string`|Not required|File path. You can pass the filepath either in the URL or in the request body.|


**Request Queries**
| Field | Type | Required | Description |
| - | - | - | - |
|`w`|`string`|Not required|Resize to width if file is an image.|
|`h`|`string`|Not required|Resize to height if file is an image.|


**Request Headers**
| Field | Type | Required | Description |
| - | - | - | - |
|`Content-Type`|`string`|Not required||

**Request Body Type** — `application/json`

`GetFileEndpointParams`
| Field | Type | Required | Description |
| - | - | - | - |
|`filepath`|`string`|Not required|File name.|
|`fileId`|`string`|Not required|File ID.|
|`imageTranformation`|`object`|Not required|See below for `ImageTransformationParams`'s object fields. |

`ImageTransformationParams`
| Field | Type | Required | Description |
| - | - | - | - |
|`width`|`string`|Not required|Resize to width if file is an image.|
|`height`|`string`|Not required|Resize to height if file is an image.|

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
|`Content-Type`|`string`|Get file endpoint result content type. If request is successful, it will be the file's content type if it is known or application/octet-stream otherwise, and application/json containing errors if request fails.|
|`Content-Length`|`string`|HTTP response content length in bytes.|



**200  —  Response Body** — `binary`

