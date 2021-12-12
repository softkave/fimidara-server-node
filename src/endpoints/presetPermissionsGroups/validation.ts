import * as Joi from 'joi';
import {validationSchemas} from '../../utilities/validationUtils';
import {presetPermissionsGroupConstants} from './constants';
import {IPresetInput} from './types';

const assignedPreset = Joi.object().keys({
  presetId: validationSchemas.nanoid.required(),
  order: Joi.number().required(),
});

const assignedPresetsList = Joi.array()
  .items(assignedPreset)
  .unique((a: IPresetInput, b: IPresetInput) => a.presetId === b.presetId)
  .max(presetPermissionsGroupConstants.maxAssignedPresets);

const presetPermissionsGroupsValidationSchemas = {
  assignedPreset,
  assignedPresetsList,
};

export default presetPermissionsGroupsValidationSchemas;
