import {Connection, Model} from 'mongoose';
import {getWorkspaceModel} from '../../../db/workspace';
import {IWorkspace} from '../../../definitions/workspace';

export interface IWorkspaceDataProvider {
  insert: (workspace: IWorkspace) => Promise<IWorkspace>;
  getById: (id: string) => Promise<IWorkspace | null>;
  getByIds: (ids: string[]) => Promise<IWorkspace[]>;
  getByRootname: (rootname: string) => Promise<IWorkspace | null>;
  getAll: () => Promise<IWorkspace[]>;
  existsByName: (name: string) => Promise<boolean>;
  existsByRootname: (rootname: string) => Promise<boolean>;
  updateById: (
    id: string,
    update: Partial<IWorkspace>
  ) => Promise<IWorkspace | null>;
  deleteById: (id: string) => Promise<void>;
}

export class WorkspaceMongoDataProvider implements IWorkspaceDataProvider {
  private model: Model<IWorkspace>;

  constructor(connection: Connection) {
    this.model = getWorkspaceModel(connection);
  }

  // No need to wrap in fireAndThrowError, because it's
  // going to be used exclusively by the cache provider
  // and the cache provider will fire and throw errors
  insert = async (workspace: IWorkspace) => {
    const doc = new this.model(workspace);
    const saved = await doc.save();
    return saved;
  };

  getById = async (id: string) => {
    return await this.model.findOne({resourceId: id}).lean().exec();
  };

  getByIds = async (ids: string[]) => {
    return await this.model
      .find({resourceId: {$in: ids}})
      .lean()
      .exec();
  };

  getByRootname = async (rootname: string) => {
    return await this.model
      .findOne({
        rootname: {$regex: new RegExp(`^${rootname}$`, 'i')},
      })
      .lean()
      .exec();
  };

  existsByName = async (name: string) => {
    const w = await this.model
      .findOne(
        {
          name: {
            $regex: new RegExp(`^${name}$`, 'i'),
          },
        },
        '_id'
      )
      .lean()
      .exec();

    return w !== null;
  };

  existsByRootname = async (rootname: string) => {
    const w = await this.model
      .findOne(
        {
          rootname: {$regex: new RegExp(`^${rootname}$`, 'i')},
        },
        '_id'
      )
      .lean()
      .exec();

    return w !== null;
  };

  getAll = async () => {
    return await this.model.find().lean().exec();
  };

  updateById = async (id: string, update: Partial<IWorkspace>) => {
    return await this.model
      .findOneAndUpdate({resourceId: id}, update, {new: true})
      .lean()
      .exec();
  };

  deleteById = async (id: string) => {
    await this.model.deleteOne({resourceId: id}).exec();
  };
}
