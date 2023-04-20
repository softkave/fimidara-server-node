import Joi = require('joi');
import {AssignedTagInput} from '../../definitions/tag';
import {validationSchemas} from '../../utils/validationUtils';
import {tagConstants} from './constants';

const assignedTag = Joi.object().keys({
  tagId: validationSchemas.resourceId.required(),
});

const assignedTagsList = Joi.array()
  .items(assignedTag)
  .unique((a: AssignedTagInput, b: AssignedTagInput) => a.tagId === b.tagId)
  .max(tagConstants.maxAssignedTags);

const tagValidationSchemas = {
  assignedTag,
  assignedTagsList,
};

export default tagValidationSchemas;
