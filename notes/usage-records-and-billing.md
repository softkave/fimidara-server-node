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
 * - How do we capture file deletion and change?
 * - How do we capture db object deletion?
 * - What's the price for db objects?
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

  /**
   * File ID when type is File
   * Request URL when type is RequestURL
   * Database object resource ID when type is DatabaseObject
   */
  artifact: any;
}

export interface IUsageRecord {
  resourceId: string;
  createdAt: Date | string;
  createdBy: IAgent;
  workspaceId: string;
  label: UsageRecordLabel;
  usage: number;
  artifacts: IUsageRecordArtifact[];
}
```

## How do we monetize these metrics?

Every metric will be collected and summed up by a separate job. The summation will acocunt for file deletion and change, and database object deletion. Database objects will be priced statically for all object types, meaning one price for all objects. On a set date, the job will run, sum up all the metrics, and then bill the users for the usage by reporting them to Stripe. Coupons will also be applied to the usage if they have any. The job will also report the summation to our db for record keeping. From the frontend, we can navigate the users to a Stripe hosted payment page, where they can pay for the usage. If they do not pay, the workspace will be locked for a month, with recurring notifications to the workspace owner. Locked workspaces will not accept requests, except payment requests. After a month if they don't pay, the workspace will be deleted with notifaction to the workspace owner.

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

**Development Costs**

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
- 0.023 per mongo object/operation

## Additional notes

We will allow the workspace to specify a max price to spend on usage. If the workspace has a max price, we will not allow the workspace to exceed that price. If the workspace has no max price, we will allow the workspace to spend as much as they want.

We could also allow a more granular pricing model, where the workspace can specify max usage for the individual metrics. For example, if the workspace has a max usage of 100 GB for storage, we will not allow the workspace to exceed that.
