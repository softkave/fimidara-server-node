import OperationError from '../../utilities/OperationError';

export class PresetPermissionsItemExistsError extends OperationError {
  public name = 'PresetPermissionsItemExistsError';
  public message = 'Preset permission item exists';
}

export class PresetPermissionsItemDoesNotExistError extends OperationError {
  public name = 'PresetPermissionsItemDoesNotExistError';
  public message = 'Preset permission item does not exist';
}
