import {IWorkspace} from '../../../definitions/workspace';
import {IBaseContext} from '../BaseContext';

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

  public insert = async (ctx: IBaseContext, workspace: IWorkspace) => {
    workspace = this.workspaces[workspace.resourceId] =
      await ctx.dataProviders.workspace.insert(workspace);
    return workspace;
  };

  public getById = async (ctx: IBaseContext, id: string) => {
    let w: IWorkspace | null =
      this.workspaces[id] || (await ctx.dataProviders.workspace.getById(id));

    if (w) {
      this.workspaces[id] = w;
    }

    return w;
  };

  public getByIds = async (ctx: IBaseContext, ids: string[]) => {
    const ws = await ctx.dataProviders.workspace.getByIds(ids);
    for (const w of ws) {
      this.workspaces[w.resourceId] = w;
    }

    return ws;
  };

  public getByRootname = async (ctx: IBaseContext, rootname: string) => {
    // TODO: implement caching by rootname
    return await ctx.dataProviders.workspace.getByRootname(rootname);
  };

  public existsByName = async (ctx: IBaseContext, name: string) => {
    return await ctx.dataProviders.workspace.existsByName(name);
  };

  public existsByRootname = async (ctx: IBaseContext, name: string) => {
    return await ctx.dataProviders.workspace.existsByRootname(name);
  };

  public updateById = async (
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

  public deleteById = async (ctx: IBaseContext, id: string) => {
    await ctx.dataProviders.workspace.deleteById(id);
    delete this.workspaces[id];
  };

  public init = async (ctx: IBaseContext) => {
    this.dispose();
    const workspaces = await ctx.dataProviders.workspace.getAll();
    workspaces.forEach(w => {
      this.workspaces[w.resourceId] = w;
    });

    this.refreshIntervalHandle = setInterval(
      this.init,
      this.refreshIntervalMs,
      ctx
    );
  };

  public dispose = async () => {
    if (this.refreshIntervalHandle) {
      clearInterval(this.refreshIntervalHandle);
    }
  };
}
