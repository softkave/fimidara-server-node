import {IWorkspace} from '../../../definitions/workspace';
import {IAppVariables} from '../../../resources/appVariables';
import {wrapFireAndThrowError} from '../../../utilities/promiseFns';
import {IBaseContext, IBaseContextDataProviders} from '../BaseContext';
import {IEmailProviderContext} from '../EmailProviderContext';
import {IFilePersistenceProviderContext} from '../FilePersistenceProviderContext';

export interface IWorkspaceCacheProvider {
  insert: (context: IBaseContext, workspace: IWorkspace) => Promise<IWorkspace>;

  getById: (ctx: IBaseContext, id: string) => Promise<IWorkspace | null>;
  getByIds: (ctx: IBaseContext, ids: string[]) => Promise<IWorkspace[]>;
  existsByName: (ctx: IBaseContext, name: string) => Promise<boolean>;

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

export class WorkspaceDCacherovider implements IWorkspaceCacheProvider {
  private workspaces: Record<string, IWorkspace> = {};
  private intervalHandle: NodeJS.Timeout | null = null;

  public insert = wrapFireAndThrowError(
    async (ctx: IBaseContext, workspace: IWorkspace) => {
      workspace = this.workspaces[workspace.resourceId] =
        await ctx.dataProviders.workspace.insert(workspace);
      return workspace;
    }
  );

  public getById = wrapFireAndThrowError(
    async (ctx: IBaseContext, id: string) => {
      let w: IWorkspace | null =
        this.workspaces[id] || (await ctx.dataProviders.workspace.getById(id));

      if (w) {
        this.workspaces[id] = w;
      }

      return w;
    }
  );

  public getByIds = wrapFireAndThrowError(
    async (ctx: IBaseContext, ids: string[]) => {
      const ws = await ctx.dataProviders.workspace.getByIds(ids);
      for (const w of ws) {
        this.workspaces[w.resourceId] = w;
      }

      return ws;
    }
  );

  public existsByName = wrapFireAndThrowError(
    async (ctx: IBaseContext, name: string) => {
      return await ctx.dataProviders.workspace.existsByName(name);
    }
  );

  public updateById = wrapFireAndThrowError(
    async (ctx: IBaseContext, id: string, update: Partial<IWorkspace>) => {
      const w = await ctx.dataProviders.workspace.updateById(id, update);
      if (w) {
        this.workspaces[id] = w;
      }

      return w;
    }
  );

  public deleteById = wrapFireAndThrowError(
    async (ctx: IBaseContext, id: string) => {
      await ctx.dataProviders.workspace.deleteById(id);
      delete this.workspaces[id];
    }
  );

  public init = async (ctx: IBaseContext) => {
    const workspaces = await ctx.dataProviders.workspace.getAll();
    workspaces.forEach(w => {
      this.workspaces[w.resourceId] = w;
    });

    const refreshInterval = 1000 * 60 * 10; // 10 minutes
    this.intervalHandle = setInterval(this.init, refreshInterval, ctx);
  };

  public dispose = async () => {
    this.workspaces = {};
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
  };
}
