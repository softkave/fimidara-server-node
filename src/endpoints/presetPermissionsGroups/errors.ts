import OperationError from '../../utilities/OperationError';

export class PresetPermissionsGroupExistsError extends OperationError {
  public name = 'PresetPermissionsGroupExistsError';
  public message = 'Preset permissions groups exists';
}

export class PresetPermissionsGroupDoesNotExistError extends OperationError {
  public name = 'PresetPermissionsGroupDoesNotExistError';
  public message = 'Preset permissions group not found';
}
