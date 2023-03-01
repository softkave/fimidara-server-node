import {IResourceBase} from './system';

export interface IEav extends IResourceBase {
  entityId: string;
  attribute: string;
  value: any;
}
