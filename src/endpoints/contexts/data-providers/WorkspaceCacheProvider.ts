import {IWorkspace} from '../../../definitions/workspace';
import {IBaseContext} from '../types';

export interface IWorkspaceCacheProvider {
  insert: (context: IBaseContext, workspace: IWorkspace) => Promise<IWorkspace>;
  getById: (ctx: IBaseContext, id: string) => Promise<IWorkspace | null>;
  getByRootname: (
    ctx: IBaseContext,
    rootname: string
  ) => Promise<IWorkspace | null>;
  getByIds: (ctx: IBaseContext, ids: string[]) => Promise<IWorkspace[]>;
  existsByName: (ctx: IBaseContext, name: string) => Promise<boolean>;
  existsByRootname: (ctx: IBaseContext, name: string) => Promise<boolean>;
  updateById: (
    ctx: IBaseContext,
    id: string,
    update: Partial<IWorkspace>
  ) => Promise<IWorkspace | null>;
  deleteById: (ctx: IBaseContext, id: string) => Promise<void>;

  // refresh utils
  setRefreshIntervalMs: (ctx: IBaseContext, ms: number) => Promise<void>;
  getRefreshIntervalMs: () => number;
  refreshCache: (ctx: IBaseContext) => Promise<void>;

  // call and wait for the promise to resolve before using the provider
  init: (ctx: IBaseContext) => Promise<void>;
  dispose: () => Promise<void>;
}

export class WorkspaceCacheProvider implements IWorkspaceCacheProvider {
  private workspaces: Record<string, IWorkspace> = {};
  private refreshIntervalHandle: NodeJS.Timeout | null = null;
  private refreshIntervalMs: number;

  constructor(refreshIntervalMs: number = 1000 * 60 * 10 /* 10 minutes */) {
    this.refreshIntervalMs = refreshIntervalMs;
  }

  insert = async (ctx: IBaseContext, workspace: IWorkspace) => {
    workspace = this.workspaces[workspace.resourceId] =
      await ctx.dataProviders.workspace.insert(workspace);
    return workspace;
  };

  getById = async (ctx: IBaseContext, id: string) => {
    const w: IWorkspace | null =
      this.workspaces[id] || (await ctx.dataProviders.workspace.getById(id));

    if (w) {
      this.workspaces[id] = w;
    }

    return w;
  };

  getByIds = async (ctx: IBaseContext, ids: string[]) => {
    const ws = await ctx.dataProviders.workspace.getByIds(ids);
    for (const w of ws) {
      this.workspaces[w.resourceId] = w;
    }

    return ws;
  };

  getByRootname = async (ctx: IBaseContext, rootname: string) => {
    // TODO: implement caching by rootname
    return await ctx.dataProviders.workspace.getByRootname(rootname);
  };

  existsByName = async (ctx: IBaseContext, name: string) => {
    return await ctx.dataProviders.workspace.existsByName(name);
  };

  existsByRootname = async (ctx: IBaseContext, name: string) => {
    return await ctx.dataProviders.workspace.existsByRootname(name);
  };

  updateById = async (
    ctx: IBaseContext,
    id: string,
    update: Partial<IWorkspace>
  ) => {
    const w = await ctx.dataProviders.workspace.updateById(id, update);
    if (w) {
      this.workspaces[id] = w;
    }

    return w;
  };

  deleteById = async (ctx: IBaseContext, id: string) => {
    await ctx.dataProviders.workspace.deleteById(id);
    delete this.workspaces[id];
  };

  getRefreshIntervalMs = () => this.refreshIntervalMs;
  setRefreshIntervalMs = async (ctx: IBaseContext, ms: number) => {
    this.refreshIntervalMs = ms;
    this.init(ctx);
  };

  init = async (ctx: IBaseContext) => {
    await this.dispose();
    this.refreshIntervalHandle = setInterval(
      this.refreshCache.bind(this, ctx),
      this.refreshIntervalMs
    );
  };

  dispose = async () => {
    if (this.refreshIntervalHandle) {
      clearInterval(this.refreshIntervalHandle);
    }
  };

  refreshCache = async (ctx: IBaseContext) => {
    const workspaces = await ctx.dataProviders.workspace.getAll();
    workspaces.forEach(w => {
      this.workspaces[w.resourceId] = w;
    });
  };
}
