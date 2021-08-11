import {userExtractor} from '../utils';
import {GetUserDataEndpoint} from './types';

const getUserData: GetUserDataEndpoint = async (context, instData) => {
    const user = await context.session.getUser(context, instData);
    return {
        user: userExtractor(user),
    };
};

export default getUserData;
