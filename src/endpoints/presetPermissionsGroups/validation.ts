import * as Joi from 'joi';
import {IPresetInput} from '../../definitions/presetPermissionsGroup';
import {validationSchemas} from '../../utilities/validationUtils';
import {presetPermissionsGroupConstants} from './constants';

const assignedPreset = Joi.object().keys({
  presetId: validationSchemas.nanoid.required(),
  order: Joi.number().required(),
});

const assignedPresetsList = Joi.array()
  .items(assignedPreset)
  .unique((a: IPresetInput, b: IPresetInput) => a.presetId === b.presetId)
  .max(presetPermissionsGroupConstants.maxAssignedPresets);

const presetsValidationSchemas = {
  assignedPreset,
  assignedPresetsList,
};

export default presetsValidationSchemas;
