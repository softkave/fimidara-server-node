import Joi from 'joi';

const onReferenced = Joi.boolean().when('tokenId', [
  {
    is: Joi.any().valid(undefined),
    then: Joi.boolean().default(true),
  },
]);

const agentTokenValidationSchemas = {onReferenced};

export default agentTokenValidationSchemas;
