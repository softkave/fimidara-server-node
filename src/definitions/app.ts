import {ValueOf} from 'type-fest';
import {Resource} from './system.js';

export const kAppType = {
  runner: 'runner',
  server: 'server',
} as const;

export const kAppPresetShards = {
  fimidaraMain: 'fimidaraMain',
};

export type AppType = ValueOf<typeof kAppType>;
export type AppPresetShards = ValueOf<typeof kAppPresetShards>;
export type AppShardId = number | string;

export interface App extends Resource {
  type: AppType;
  shard?: AppShardId;
  serverId: string | undefined;
  ipv4: string | undefined;
  ipv6: string | undefined;
  httpPort: string | undefined;
  httpsPort: string | undefined;
  version: string | undefined;
}

export interface AppShard extends Resource {
  occupantCount: number;
  startedByAppId: string;
  acceptanceKey: string;
}
