---
title: Update Workspace Endpoint
description: Update workspace endpoint.
---

# {% $markdoc.frontmatter.title %}
## `/v1/workspaces/updateWorkspace` — `post`
**Request Parameter Pathnames** — No extra pathnames present

**Request Queries** — No queries present

**Request Headers**
| Field | Type | Required | Description |
| - | - | - | - |
|`Authorization`|`string`|Required|Access token.|
|`Content-Type`|`string`|Required|HTTP JSON request content type.|

**Request Body Type** — `application/json`

`UpdateWorkspaceEndpointParams`
| Field | Type | Required | Description |
| - | - | - | - |
|`workspaceId`|`string`|Not required|Workspace ID. Will default to using workspace ID from client and program tokens if not provided.|
|`workspace`|`object`|Not required|See below for `UpdateWorkspaceInput`'s object fields. |

`UpdateWorkspaceInput`
| Field | Type | Required | Description |
| - | - | - | - |
|`name`|`string`|Not required|Workspace name.|
|`description`|`string`|Not required|Workspace description.|

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

`UpdateWorkspaceEndpointSuccessResult`
| Field | Type | Description |
| - | - | - |
|`workspace`|`object`|See below for `Workspace`'s object fields. |

`Workspace`
| Field | Type | Description |
| - | - | - |
|`resourceId`|`string`||
|`createdBy`|`object`|See below for `Agent`'s object fields. |
|`createdAt`|`string`|Date string.|
|`lastUpdatedBy`|`object`|See below for `Agent`'s object fields. |
|`lastUpdatedAt`|`string`|Date string.|
|`name`|`string`|Workspace name.|
|`rootname`|`string`|Workspace root name, must be a URL compatible name.|
|`description`|`string`|Workspace description.|
|`publicPermissionGroupId`|`undefined` or `string`|Resource ID.|
|`billStatusAssignedAt`|`undefined` or `string`|Date string.|
|`billStatus`|`undefined` or `string`|Workspace bill status|
|`usageThresholds`|`undefined` or `object`|See below for `WorkspaceUsageThresholds`'s object fields. |
|`usageThresholdLocks`|`undefined` or `object`|See below for `WorkspaceUsageThresholdLocks`'s object fields. |

`Agent`
| Field | Type | Description |
| - | - | - |
|`agentId`|`string`|Agent ID.|
|`agentType`|`string`|Agent type|

`WorkspaceUsageThresholds`
| Field | Type | Description |
| - | - | - |
|`storage`|`undefined` or `object`|See below for `UsageThreshold`'s object fields. |
|`bandwidth-in`|`undefined` or `object`|See below for `UsageThreshold`'s object fields. |
|`bandwidth-out`|`undefined` or `object`|See below for `UsageThreshold`'s object fields. |
|`total`|`undefined` or `object`|See below for `UsageThreshold`'s object fields. |

`UsageThreshold`
| Field | Type | Description |
| - | - | - |
|`lastUpdatedBy`|`object`|See below for `Agent`'s object fields. |
|`lastUpdatedAt`|`string`|Date string.|
|`category`|`string`|Usage record category.|
|`budget`|`number`|Price in USD.|


`WorkspaceUsageThresholdLocks`
| Field | Type | Description |
| - | - | - |
|`storage`|`undefined` or `object`|See below for `UsageThresholdLock`'s object fields. |
|`bandwidth-in`|`undefined` or `object`|See below for `UsageThresholdLock`'s object fields. |
|`bandwidth-out`|`undefined` or `object`|See below for `UsageThresholdLock`'s object fields. |
|`total`|`undefined` or `object`|See below for `UsageThresholdLock`'s object fields. |

`UsageThresholdLock`
| Field | Type | Description |
| - | - | - |
|`lastUpdatedBy`|`object`|See below for `Agent`'s object fields. |
|`lastUpdatedAt`|`string`|Date string.|
|`category`|`string`|Usage record category.|
|`locked`|`boolean`|Flag for whether a certain usage category is locked or not.|



