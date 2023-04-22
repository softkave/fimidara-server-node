---
title: Delete File Endpoint
description: Delete file endpoint.
---

# {% $markdoc.frontmatter.title %}
## `/v1/files/deleteFile` — `delete`
**Request Parameter Pathnames** — No extra pathnames present

**Request Queries** — No queries present

**Request Headers**
| Field | Type | Required | Description |
| - | - | - | - |
|`Authorization`|`string`|Required|Access token.|
|`Content-Type`|`string`|Required|HTTP JSON request content type.|

**Request Body Type** — `application/json`

`RevokeFileEndpointParams`
| Field | Type | Required | Description |
| - | - | - | - |
|`filepath`|`string`|Not required|File name.|
|`fileId`|`string`|Not required|File ID.|

**200  —  Response Headers**
| Field | Type | Description |
| - | - | - |
|`Content-Type`|`string`|HTTP JSON response content type.|
|`Content-Length`|`string`|HTTP response content length in bytes.|

**200  —  Response Body Type** — `application/json`

`EmptyEndpointSuccessResult`
| Field | Type | Description |
| - | - | - |

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


