import {UserExistsEndpoint} from './types';

const userExists: UserExistsEndpoint = async (context, instData) => {
    const exists = await context.user.userExists(context, instData.data.email);
    return {exists};
};

export default userExists;
