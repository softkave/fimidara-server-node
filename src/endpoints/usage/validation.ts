import Joi from 'joi';
import {
  kUsageRecordCategory,
  kUsageRecordFulfillmentStatus,
} from '../../definitions/usageRecord.js';

const category = Joi.string().valid(...Object.values(kUsageRecordCategory));
const fulfillmentStatus = Joi.string().valid(
  ...Object.values(kUsageRecordFulfillmentStatus)
);
const categoryList = Joi.array()
  .items(category)
  .max(Object.values(kUsageRecordCategory).length);

const usageRecordValidationSchemas = {
  category,
  fulfillmentStatus,
  categoryList,
};

export default usageRecordValidationSchemas;
