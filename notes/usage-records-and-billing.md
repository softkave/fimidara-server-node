# Usage Records and Billing

## Overview

We want to be able to track usage records, so that we can display usage statistics, maybe predict usage patterns, and most importantly, to accurately predict the cost of usage and bill users for usage.

## What metrics do we want to track?

- File incoming bytes
- File outgoing bytes
- File storage bytes
- Requests made
- Database objects created

## How do we track these metrics?

```typescript
/**
 * TODO:
 * - Define usage thresholds data context, provider and sync method
 * - How to confirm each usage record is summed up in the overall usage?
 * - Should we track requests with metadata, like IP address, user agent, status code, etc?
 * - Track the full bandwidth in and out and use those for billing.
 * - Access control for usage records, billing, and setting usage thresholds.
 * - Setup accounts for new workspaces in Stripe.
 * - Setup acocunts for existing workspaces in Stripe.
 * - Setup products and prices in Stripe.
 * - Setup the subscription model in Stripe.
 * - Add the workspace Stripe accounts to the subscription model.
 * - Client-side visualizations of usage records.
 * - Client-side setting of usage thresholds.
 *
 * - workspace lock by usage label
 * - reached vs exceeded, and exceeded by what count?
 * - send email of usage dropped and why
 * - usage check short circuit
 * - sum up dropped usage records
 * - don't save upper sum levels if usage is dropped
 *
 * - use gb not bytes when calculating usage or should we use gb to store?
 * - storage & db objects is overall, not just monthly created
 * - only storage and bandwidth for now
 * - limit client tokens and push reusing tokens
 * - use and check workspace locks
 * - how to prevent too much client tokens created
 * - delete unused client tokens after a while
 * - how to implement bandwidth in before the file comes in
 *   - OPTIONS header
 *   - Content-Length header before the file comes in
 *   - proxy
 *   - negotiate before sending the file, and add the negotiation ID to the file when it comes in
 * 
Monthly usage
Bill usage = prev + current month
Prev = prev + current month - deleted

month usage - pipeline
bill usage - server
prev - pipeline
next bill usage - server
 *
 */

/**
 * Side Notes
 * - We may need to implement a proxy to get the full bandwidth sent out by the server or find a clever way to get it from Node.js
 */

export enum UsageRecordLabel {
  Storage = 'storage',
  BandwidthIn = 'bandwidth-in',
  BandwidthOut = 'bandwidth-out',
  Request = 'request',
  DatabaseObject = 'db-object',
}

export enum UsageRecordArtifactType {
  File = 'file',
  RequestURL = 'request-url',
  DatabaseObject = 'db-object',
}

export interface IUsageRecordArtifact {
  type: UsageRecordArtifactType;
  resourceType?: AppResourceType;
  action?: BasicCRUDActions;

  /**
   * File ID when type is File
   * Request URL when type is RequestURL
   * Database object resource ID when type is DatabaseObject
   */
  artifact: any;
}

enum UsageRecordSummationLevel {
  // individual usage records
  One = 1,
  // usage records grouped by billing period
  Two = 2,
}

enum UsageRecordFulfillmentStatus {
  // usage record has not been fulfilled
  Unfulfilled = 0,
  // usage record has been fulfilled
  Fulfilled = 1,
}

export interface IUsageRecord {
  resourceId: string;
  createdAt: Date | string;
  createdBy: IAgent;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: Date | string;
  workspaceId: string;
  label: UsageRecordLabel;
  usage: number;
  artifacts: IUsageRecordArtifact[];
  summationLevel: UsageRecordSummationLevel;
  fulfillmentStatus: UsageRecordFulfillmentStatus;
}

interface IUsageRecordDataProvider {
  insert(usageRecord: IUsageRecord): Promise<IUsageRecord>;
  updateSummationTwoById(
    id: string,
    count: number,
    increment?: boolean // default to true
  ): Promise<void>;
  getRecord(
    workspaceId: string,
    label: UsageRecordLabel,
    summationLevel: UsageRecordSummationLevel
  ): Promise<IUsageRecord>;
}

interface IUsageRecordLogicProvider {
  // private cache of usage records summation level 2
  // we'll be using this to guard against excess usage
  // when limit is exceeded, so need quick access to the usage records.
  usageRecords: Record<string, IUsageRecord>;

  /**
   * - if sum level 2 doesn't exist, create it
   * - increment sum level 2
   * - if summationLevel 2 usage is not exceeded
   *   - queue insert usage record
   *   - queue update summation level 2
   *   - return true
   * - else
   *   - queue insert unfufilled usage record
   *   - queue notify workspace that usage is exceeded
   *   - queue update summation level 2
   *   - return false
   */
  insert(usageRecord: IUsageRecord): Promise<boolean>;
}

// Artifact types
interface IFileUsageRecordArtifact {
  fileId: string;
  filepath: string;
  oldFileSize?: number;
  requestId: string;
}

interface IBandwidthUsageRecordArtifact {
  // bytes: number;
  // direction: 'in' | 'out';

  fileId: 'file-id';
  filepath: '/path/to/file';
  requestId: string;
}

interface IRequestUsageRecordArtifact {
  // method: string;
  // statusCode: number;
  // userAgent: string;
  // ipAddress: string;

  requestId: string;
  url: '/files/getFile';
}

interface IDatabaseObjectUsageRecordArtifact {
  resourceId: string;
  requestId: string;

  // resourceType: AppResourceType;
  // action: BasicCRUDActions;
}

interface IUsageThresholdByLabel {
  resourceId: string;
  createdAt: Date | string;
  createdBy: IAgent;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: Date | string;
  workspaceId: string;
  label: UsageRecordLabel;
  usage: number;
  price: number;
  pricePerUnit: number;
}

interface ITotalUsageThreshold {
  resourceId: string;
  createdAt: Date | string;
  createdBy: IAgent;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: Date | string;
  workspaceId: string;
  price: number;
}

enum WorkspaceUsageStatus {
  Normal = 0,
  UsageExceeded = 1,
  GracePeriod = 2,
  Locked = 3,
}

interface IWorkspace {
  usageStatusAssignedAt?: Date | string;
  usageStatus: WorkspaceUsageStatus;
  totalUsageThreshold?: ITotalUsageThreshold;
  usageThresholds: IUsageThresholdByLabel[];
}

class RequestData {
  requestId: string;
}
```

### Summation Strategy

- Storage
  - New files are added by bytes
  - Increase in delta of updated files is added by bytes
- BandwidthIn
  - Incremented by bytes
- BandwidthOut
  - Incremented by bytes
- Request
  - Incremented by count
- DatabaseObject
  - Incremented by count

### Storage

For every file stored, updated, and deleted, we want to track the size of the file in the number of bytes stored.

```typescript
const fileStoredRecord: IUsageRecord = {
  resourceId: 'record-id',
  createdAt: new Date(),
  createdBy: {
    /* agent */
  },
  workspaceId: 'workspace-id',
  label: UsageRecordLabel.Storage,
  usage: 12345, // bytes
  artifacts: [
    {
      type: UsageRecordArtifactType.File,
      resourceType: AppResourceType.File,
      action: BasicCRUDActions.Create,
      artifact: {
        fileId: 'file-id',
        filepath: '/path/to/file',
      },
    },
  ],
  summationLevel: UsageRecordSummationLevel.One,
  fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
};

const fileUpdatedRecord: IUsageRecord = {
  resourceId: 'record-id',
  createdAt: new Date(),
  createdBy: {
    /* agent */
  },
  workspaceId: 'workspace-id',
  label: UsageRecordLabel.Storage,
  usage: 54321, // bytes
  artifacts: [
    {
      type: UsageRecordArtifactType.File,
      resourceType: AppResourceType.File,
      action: BasicCRUDActions.Update,
      artifact: {
        fileId: 'file-id',
        filepath: '/path/to/file',
        oldFileSize: 12345,
      },
    },
  ],
  summationLevel: UsageRecordSummationLevel.One,
  fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
};

const fileDeletedRecord: IUsageRecord = {
  resourceId: 'record-id',
  createdAt: new Date(),
  createdBy: {
    /* agent */
  },
  workspaceId: 'workspace-id',
  label: UsageRecordLabel.Storage,
  usage: -54321, // file size in bytes
  artifacts: [
    {
      type: UsageRecordArtifactType.File,
      resourceType: AppResourceType.File,
      action: BasicCRUDActions.Delete,
      artifact: {
        fileId: 'file-id',
        filepath: '/path/to/file',
      },
    },
  ],
  summationLevel: UsageRecordSummationLevel.One,
  fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
};

// usage record summation level 2
const storageRecordLevel2: IUsageRecord = {
  resourceId: 'record-id',
  createdAt: new Date(),
  createdBy: {
    /* agent */
  },
  workspaceId: 'workspace-id',
  label: UsageRecordLabel.Storage,
  usage: 54321, // file size in bytes per billing period
  summationLevel: UsageRecordSummationLevel.Two,
  fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
};
```

### BandwidthIn

```typescript
const bandwidthInRecord: IUsageRecord = {
  resourceId: 'record-id',
  createdAt: new Date(),
  createdBy: {
    /* agent */
  },
  workspaceId: 'workspace-id',
  label: UsageRecordLabel.BandwidthIn,
  usage: 12345, // bytes
  artifacts: [
    {
      type: UsageRecordArtifactType.File,
      resourceType: AppResourceType.File,
      artifact: {
        fileId: 'file-id',
        filepath: '/path/to/file',
      },
    },
  ],
  summationLevel: UsageRecordSummationLevel.One,
  fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
};

// usage record summation level 2
const bandwidthInRecordLevel2: IUsageRecord = {
  resourceId: 'record-id',
  createdAt: new Date(),
  createdBy: {
    /* agent */
  },
  workspaceId: 'workspace-id',
  label: UsageRecordLabel.BandwidthIn,
  usage: 54321, // file size in bytes per billing period
  summationLevel: UsageRecordSummationLevel.Two,
  fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
};
```

### BandwidthOut

```typescript
const bandwidthOutRecord: IUsageRecord = {
  resourceId: 'record-id',
  createdAt: new Date(),
  createdBy: {
    /* agent */
  },
  workspaceId: 'workspace-id',
  label: UsageRecordLabel.BandwidthOut,
  usage: 12345, // bytes
  artifacts: [
    {
      type: UsageRecordArtifactType.File,
      resourceType: AppResourceType.File,
      artifact: {
        fileId: 'file-id',
        filepath: '/path/to/file',
      },
    },
  ],
  summationLevel: UsageRecordSummationLevel.One,
  fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
};

// usage record summation level 2
const bandwidthOutRecordLevel2: IUsageRecord = {
  resourceId: 'record-id',
  createdAt: new Date(),
  createdBy: {
    /* agent */
  },
  workspaceId: 'workspace-id',
  label: UsageRecordLabel.BandwidthOut,
  usage: 54321, // file size in bytes per billing period
  summationLevel: UsageRecordSummationLevel.Two,
  fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
};
```

### Request

```typescript
const requestRecord: IUsageRecord = {
  resourceId: 'record-id',
  createdAt: new Date(),
  createdBy: {
    /* agent */
  },
  workspaceId: 'workspace-id',
  label: UsageRecordLabel.Request,
  usage: 1, // count
  artifacts: [
    {
      type: UsageRecordArtifactType.Request,
      resourceType: AppResourceType.File,
      action: BasicCRUDActions.Read,
      artifact: {
        url: '/files/getFile',
        requestId: 'request-id',
      },
    },
  ],
  summationLevel: UsageRecordSummationLevel.One,
  fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
};

// usage record summation level 2
const requestRecordLevel2: IUsageRecord = {
  resourceId: 'record-id',
  createdAt: new Date(),
  createdBy: {
    /* agent */
  },
  workspaceId: 'workspace-id',
  label: UsageRecordLabel.Request,
  usage: 500, // count per billing period
  summationLevel: UsageRecordSummationLevel.Two,
  fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
};

// unfulfilled usage record, since we'll only have unfulfilled records for requests as it gates other record types
const requestRecordUnfulfilled: IUsageRecord = {
  resourceId: 'record-id',
  createdAt: new Date(),
  createdBy: {
    /* agent */
  },
  workspaceId: 'workspace-id',
  label: UsageRecordLabel.Storage,
  usage: 0,
  artifacts: [
    {
      type: UsageRecordArtifactType.Request,
      resourceType: AppResourceType.File,
      action: BasicCRUDActions.Read,
      artifact: {
        requestPath: '/files/getFile',
      },
    },
  ],
  summationLevel: UsageRecordSummationLevel.One,
  fulfillmentStatus: UsageRecordFulfillmentStatus.Unfulfilled,
};

// usage record summation level 2 for unfulfilled usage records
const requestRecordLevel2: IUsageRecord = {
  resourceId: 'record-id',
  createdAt: new Date(),
  createdBy: {
    /* agent */
  },
  workspaceId: 'workspace-id',
  label: UsageRecordLabel.Request,
  usage: 500, // count per billing period
  summationLevel: UsageRecordSummationLevel.Two,
  fulfillmentStatus: UsageRecordFulfillmentStatus.Unfulfilled,
};
```

### DatabaseObject

```typescript
const dbObjectRecord: IUsageRecord = {
  resourceId: 'record-id',
  createdAt: new Date(),
  createdBy: {
    /* agent */
  },
  workspaceId: 'workspace-id',
  label: UsageRecordLabel.DatabaseObject,
  usage: 1, // count
  artifacts: [
    {
      type: UsageRecordArtifactType.DatabaseObject,
      resourceType: AppResourceType.File,
      action: BasicCRUDActions.Create, // or Delete
      artifact: {
        resourceId: 'file-id',
      },
    },
  ],
  summationLevel: UsageRecordSummationLevel.One,
  fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
};

// usage record summation level 2
const dbObjectRecordLevel2: IUsageRecord = {
  resourceId: 'record-id',
  createdAt: new Date(),
  createdBy: {
    /* agent */
  },
  workspaceId: 'workspace-id',
  label: UsageRecordLabel.DatabaseObject,
  usage: 500, // count per billing period
  summationLevel: UsageRecordSummationLevel.Two,
  fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
};
```

## How do we monetize these metrics?

Every metric will be collected, stored, and summed up in an intermediate metric (a summation metric by label by workspace, per billing period). If limits are set for labels, it'll be applied to the summation metric. The summation metrics will then be summed up into a final metric (a final summation metric by label by workspace, per billing period). The final metric will be used to calculate the cost of usage.

At the end of the billing period, we will report the cost to Stripe, apply discounts, and send an invoice to the user. A grace period will be set for payment, after which the invoice will be marked as unpaid and the user will be notified. After another grace period, the workspace will stop accepting requests with notifying the user.

### Usage pricing

Not every spending is listed here, but we are currently thinking of:

**AWS S3**

- $0.023 per GB/month stored
- $0.005 per 1000 request from SDK and console
- $0.09 per GB for bandwidth out
- $0.00 per GB for bandwidth in

**Heroku**

- $0.09 per GB in
- $0.09 per GB out
- $0.025 per request

**Frontend - Vercel**

- $0.005

**Mongo DB**

- 0.0005 per mongo object

**Profit**

- $0.09 per GB in
- $0.09 per GB out
- $0.023 per request
- $0.023 per GB stored

**Total**

- 0.046 per GB stored
- 0.18 per gb in
- 0.27 per gb out
- 0.053 per request
- 0.0005 per mongo object

## Algorithm

- Every billing period, we will:

  - Collect all usage records for the current billing period
  - Sum up the usage records
  - Apply limits to the summation metrics
    - If usage is exceeded, we will lock the workspace, and mark incoming requests as unfulfilled
    - Notify the workspace owner of the lock and count of unfulfilled requests
  - Report usage to Stripe and apply discounts
  - Put the workspace in a grace period
    - When the grace period ends, we will:
      - Mark the workspace as not accepting requests
      - Notify the workspace owner of the lock and count of unfulfilled requests
    - Remove the workspace from the grace period when payment is received

- Backgound job will:
  - Will sum up overall usage for visualization
  - Will send info to Stripe
  - Will send notification if usage is above threshold
  - Will send notification if bill is overdue
  - Will disable account if bill is overdue after X days

## Additional notes

We will allow the workspace to specify a max price to spend on usage. If the workspace has a max price, we will not allow the workspace to exceed that price. If the workspace has no max price, we will allow the workspace to spend as much as they want.

We could also allow a more granular pricing model, where the workspace can specify max usage for the individual metrics. For example, if the workspace has a max usage of 100 GB for storage, we will not allow the workspace to exceed that.

```

```
