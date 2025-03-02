import assert from 'assert';
import {
  kIjxData,
  kIjxSemantic,
  kIjxUtils,
} from '../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../contexts/ijx/register.js';
import {
  AppRuntimeState,
  SessionAgent,
  kFimidaraResourceType,
} from '../../definitions/system.js';
import {Workspace} from '../../definitions/workspace.js';
import {FimidaraRuntimeConfig} from '../../resources/config.js';
import {getTimestamp} from '../../utils/dateFns.js';
import {getNewIdForResource, kIdSize} from '../../utils/resource.js';
import {makeUserSessionAgent} from '../../utils/sessionUtils.js';
import EndpointReusableQueries from '../queries.js';
import {INTERNAL_forgotPassword} from '../users/forgotPassword/handler.js';
import {getUserToken} from '../users/login/utils.js';
import {INTERNAL_sendEmailVerificationCode} from '../users/sendEmailVerificationCode/handler.js';
import {INTERNAL_signupUser} from '../users/signup/utils.js';
import INTERNAL_createWorkspace from '../workspaces/addWorkspace/internalCreateWorkspace.js';
import {assertWorkspace} from '../workspaces/utils.js';

// TODO: there's currently a backwards way of doing things, where we first
// initialize app before we run unit tests, meaning, the same things we're
// trying to test are required to work before we can even test them. We need to
// fix this for unit tests at the very least, but it may be okay for integration
// tests.

export const kAppRuntimeStatsDocId = getNewIdForResource(
  kFimidaraResourceType.System,
  kIdSize,
  true
);

export const kNewSignupsOnWaitlistJobIntervalMs = 1_000 * 60 * 60;
export const kNewSignupsOnWaitlistJobIdempotencyToken = '1';

/** 1 hour in ms */
const kAppSetupVars = {
  workspaceName: 'fimidara',
  rootname: 'fimidara',
};

async function setupWorkspace(
  agent: SessionAgent,
  name: string,
  rootname: string
) {
  const result = await kIjxSemantic.utils().withTxn(async opts => {
    const existingWorkspace = await kIjxSemantic
      .workspace()
      .getByRootname(rootname);

    if (existingWorkspace) {
      return {workspace: existingWorkspace};
    }

    return await INTERNAL_createWorkspace(
      {
        name,
        rootname,
        description: "System-generated workspace for fimidara's own operations",
      },
      agent,
      agent.agentId,
      opts
    );
  });

  return result;
}

async function setupDefaultUser() {
  const {user, userToken} = await kIjxSemantic.utils().withTxn(async opts => {
    const suppliedConfig = kIjxUtils.suppliedConfig();
    const nodeEnv = process.env.NODE_ENV;
    assert(suppliedConfig.rootUserEmail);
    assert(suppliedConfig.rootUserPassword);
    assert(suppliedConfig.rootUserFirstName);
    assert(suppliedConfig.rootUserLastName);
    let user = await kIjxSemantic
      .user()
      .getByEmail(suppliedConfig.rootUserEmail, opts);

    if (!user) {
      const isDevRelatedvEnv = nodeEnv === 'development' || nodeEnv === 'test';
      user = await INTERNAL_signupUser(
        {
          email: suppliedConfig.rootUserEmail,
          firstName: suppliedConfig.rootUserFirstName,
          lastName: suppliedConfig.rootUserLastName,
          password: suppliedConfig.rootUserPassword,
        },
        {
          requiresPasswordChange: isDevRelatedvEnv ? false : true,
          isEmailVerified: isDevRelatedvEnv ? true : false,
          isOnWaitlist: false,
        },
        opts
      );

      if (!isDevRelatedvEnv) {
        await INTERNAL_forgotPassword(user);
        await INTERNAL_sendEmailVerificationCode(user);
      }
    }

    const userToken = await getUserToken(user.resourceId, opts);
    return {user, userToken};
  });

  const agent = makeUserSessionAgent(user, userToken);
  return {user, userToken, agent};
}

export async function isRootWorkspaceSetup() {
  const appRuntimeState = await kIjxData
    .appRuntimeState()
    .getOneByQuery(
      EndpointReusableQueries.getByResourceId(kAppRuntimeStatsDocId)
    );
  return appRuntimeState;
}

async function getRootWorkspace(appRuntimeState: AppRuntimeState) {
  const appRuntimeVars: FimidaraRuntimeConfig = {
    appWorkspaceId: appRuntimeState.appWorkspaceId,
  };

  kRegisterIjxUtils.runtimeConfig(appRuntimeVars);
  const workspace = await kIjxSemantic
    .workspace()
    .getOneById(appRuntimeState.appWorkspaceId);
  assertWorkspace(workspace);
  return workspace;
}

async function insertRuntimeVars(workspace: Workspace) {
  return await kIjxSemantic.utils().withTxn(async opts => {
    const appRuntimeVars: FimidaraRuntimeConfig = {
      appWorkspaceId: workspace.resourceId,
    };

    await kIjxData.appRuntimeState().insertItem(
      {
        isAppSetup: true,
        resourceId: kAppRuntimeStatsDocId,
        ...appRuntimeVars,
        createdAt: getTimestamp(),
        lastUpdatedAt: getTimestamp(),
        isDeleted: false,
      },
      opts
    );

    return {appRuntimeVars};
  });
}

async function setupAppArtifacts(agent: SessionAgent) {
  const {workspace} = await setupWorkspace(
    agent,
    kAppSetupVars.workspaceName,
    kAppSetupVars.rootname
  );

  const {appRuntimeVars} = await insertRuntimeVars(workspace);

  kRegisterIjxUtils.runtimeConfig(appRuntimeVars);
  return workspace;
}

// async function setupNewUsersOnWaitlistJob() {
//   const {FLAG_waitlistNewSignups} = kUtilsInjectables.suppliedConfig();

//   if (!FLAG_waitlistNewSignups) {
//     return;
//   }

//   await queueJobs<{}>(
//     /** workspaceId */ undefined,
//     /** parent job ID */ undefined,
//     [
//       {
//         params: {},
//         createdBy: kSystemSessionAgent,
//         type: kJobType.newSignupsOnWaitlist,
//         /** there should always be only one such job */
//         idempotencyToken: kNewSignupsOnWaitlistJobIdempotencyToken,
//         runCategory: kJobRunCategory.cron,
//         cronInterval: kNewSignupsOnWaitlistJobIntervalMs,
//       },
//     ]
//   );
// }

export async function initFimidara() {
  const appRuntimeState = await isRootWorkspaceSetup();

  if (appRuntimeState) {
    return await getRootWorkspace(appRuntimeState);
  }

  const {agent} = await setupDefaultUser();
  const [appArtifacts] = await Promise.all([
    setupAppArtifacts(agent),
    // setupNewUsersOnWaitlistJob(),
  ]);

  return appArtifacts;
}
