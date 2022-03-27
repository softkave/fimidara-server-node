import * as Joi from 'joi';
import {validationSchemas} from '../../utilities/validationUtils';
import resourcesConstants from './constants';

const fetchResourceItem = Joi.object().keys({
  resourceId: validationSchemas.nanoid.required(),
  resourceType: validationSchemas.resourceType.required(),
});

const fetchResourceItemList = Joi.array()
  .items(fetchResourceItem)
  .max(resourcesConstants.maxFetchItems);

const resourcesValidationSchemas = {fetchResourceItem, fetchResourceItemList};
export default resourcesValidationSchemas;
