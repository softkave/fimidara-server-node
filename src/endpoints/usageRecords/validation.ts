import Joi from 'joi';
import {
  UsageRecordCategoryMap,
  UsageRecordFulfillmentStatusMap,
} from '../../definitions/usageRecord.js';

const category = Joi.string().valid(...Object.values(UsageRecordCategoryMap));
const fulfillmentStatus = Joi.string().valid(
  ...Object.values(UsageRecordFulfillmentStatusMap)
);
const categoryList = Joi.array()
  .items(category)
  .max(Object.values(UsageRecordCategoryMap).length);

const usageRecordValidationSchemas = {
  category,
  fulfillmentStatus,
  categoryList,
};

export default usageRecordValidationSchemas;
