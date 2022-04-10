import {
  IPresetInput,
  IPublicPresetPermissionsGroup,
} from '../../../definitions/presetPermissionsGroup';
import {IAssignedTagInput} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface INewPresetPermissionsGroupInput {
  name: string;
  description?: string;
  presets?: IPresetInput[];
  tags?: IAssignedTagInput[];
}

export interface IAddPresetPermissionsGroupEndpointParams {
  organizationId: string;
  preset: INewPresetPermissionsGroupInput;
}

export interface IAddPresetPermissionsGroupEndpointResult {
  preset: IPublicPresetPermissionsGroup;
}

export type AddPresetPermissionsGroupEndpoint = Endpoint<
  IBaseContext,
  IAddPresetPermissionsGroupEndpointParams,
  IAddPresetPermissionsGroupEndpointResult
>;
