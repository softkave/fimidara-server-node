import Joi from 'joi';

const onReferenced = Joi.boolean();
const agentTokenValidationSchemas = {onReferenced};

export default agentTokenValidationSchemas;
