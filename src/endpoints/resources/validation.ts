import * as Joi from 'joi';
import {validationSchemas} from '../../utils/validationUtils';
import resourcesConstants from './constants';

const fetchResourceItem = Joi.object().keys({
  resourceId: validationSchemas.resourceId.required(),
  resourceType: validationSchemas.resourceType.required(),
});

const fetchResourceItemList = Joi.array().items(fetchResourceItem).max(resourcesConstants.maxFetchItems);
const resourcesValidationSchemas = {fetchResourceItem, fetchResourceItemList};
export default resourcesValidationSchemas;
