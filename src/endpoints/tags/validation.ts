import Joi from 'joi';
import {IAssignedTagInput} from '../../definitions/tag';
import {validationSchemas} from '../../utilities/validationUtils';
import {tagConstants} from './constants';

const assignedTag = Joi.object().keys({
  tagId: validationSchemas.resourceId.required(),
});

const assignedTagsList = Joi.array()
  .items(assignedTag)
  .unique((a: IAssignedTagInput, b: IAssignedTagInput) => a.tagId === b.tagId)
  .max(tagConstants.maxAssignedTags);

const tagValidationSchemas = {
  assignedTag,
  assignedTagsList,
};

export default tagValidationSchemas;
