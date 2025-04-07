import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {AgentToken} from '../../../definitions/agentToken.js';
import {FimidaraPermissionAction} from '../../../definitions/permissionItem.js';
import {
  FimidaraResourceType,
  SessionAgent,
  kFimidaraResourceType,
} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {kPublicSessionAgent} from '../../../utils/agent.js';
import {
  makeUserSessionAgent,
  makeWorkspaceAgentTokenAgent,
} from '../../../utils/sessionUtils.js';
import {AnyFn, OrPromise} from '../../../utils/types.js';
import {NewAgentTokenInput} from '../../agentTokens/addToken/types.js';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems.js';
import {PermissionItemInputTarget} from '../../permissionItems/types.js';
import {BaseEndpointResult} from '../../types.js';
import {SignupEndpointParams} from '../../users/signup/types.js';
import {AddWorkspaceEndpointParams} from '../../workspaces/addWorkspace/types.js';
import {
  insertAgentTokenForTest,
  insertPermissionItemsForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../utils.js';

export const kTestSessionAgentTypes = [
  kFimidaraResourceType.User,
  kFimidaraResourceType.AgentToken,
  kFimidaraResourceType.Public,
] as const;

interface GetTestSessionAgentPreResult {
  userResult: Awaited<ReturnType<typeof insertUserForTest>>;
  workspaceResult: Awaited<ReturnType<typeof insertWorkspaceForTest>>;
  adminUserToken: AgentToken;
  sessionAgent: SessionAgent;
  workspace: Workspace;
}

interface GetTestSessionAgentPermissionsOpts {
  actions: FimidaraPermissionAction[];
  target?: PermissionItemInputTarget;
}

interface GetTestSessionAgentPermissionsFnResult<TResult = unknown> {
  permissions: GetTestSessionAgentPermissionsOpts;
  other?: TResult;
}

type GetTestSessionAgentPermissionsFn<TResult = unknown> = AnyFn<
  [GetTestSessionAgentPreResult],
  OrPromise<GetTestSessionAgentPermissionsFnResult<TResult>>
>;

interface GetTestSessionAgentResult<TPermissionsFnResult = unknown>
  extends GetTestSessionAgentPreResult {
  permissionsResult?: BaseEndpointResult | void;
  beforePermissionsFnOtherResult?: GetTestSessionAgentPermissionsFnResult<TPermissionsFnResult>['other'];
  permissionsOpts?: GetTestSessionAgentPermissionsOpts;
  tokenResult?: Awaited<ReturnType<typeof insertAgentTokenForTest>>;
  collaboratorResult?: Awaited<ReturnType<typeof insertUserForTest>>;
}

type GetTestSessionAgentProps<TPermissionsFnResult = unknown> = Partial<{
  user: Partial<{
    userInput: Partial<SignupEndpointParams>;
    skipAutoVerifyEmail: boolean;
  }>;
  workspace: Partial<{
    workspaceInput: Partial<AddWorkspaceEndpointParams>;
  }>;
  token: Partial<{
    tokenInput: Partial<NewAgentTokenInput>;
  }>;
  beforePermissions: GetTestSessionAgentPermissionsFn<TPermissionsFnResult>;
  permissions: GetTestSessionAgentPermissionsOpts;
}>;

export async function getTestSessionAgent<TPermissionsFnResult = unknown>(
  agentType: FimidaraResourceType,
  props: GetTestSessionAgentProps<TPermissionsFnResult> = {}
): Promise<GetTestSessionAgentResult<TPermissionsFnResult>> {
  switch (agentType) {
    case kFimidaraResourceType.User: {
      const userResult = await insertUserForTest(
        props.user?.userInput,
        props.user?.skipAutoVerifyEmail
      );
      const workspaceResult = await insertWorkspaceForTest(
        userResult.userToken,
        props.workspace?.workspaceInput
      );
      const collaboratorResult = await insertUserForTest(
        props.user?.userInput,
        props.user?.skipAutoVerifyEmail
      );
      await kIjxSemantic
        .utils()
        .withTxn(opts =>
          assignWorkspaceToUser(
            userResult.sessionAgent,
            workspaceResult.rawWorkspace.resourceId,
            collaboratorResult.user.resourceId,
            opts
          )
        );
      const sessionAgent = makeUserSessionAgent(
        collaboratorResult.rawUser,
        collaboratorResult.userToken
      );
      const base: GetTestSessionAgentPreResult = {
        userResult,
        workspaceResult,
        sessionAgent,
        adminUserToken: userResult.userToken,
        workspace: workspaceResult?.rawWorkspace,
      };

      const permissionsCombinedResults = await makeTestSessionAgentPermissions(
        collaboratorResult.rawUser.resourceId,
        base,
        props
      );

      return {
        ...permissionsCombinedResults,
        userResult,
        workspaceResult,
        collaboratorResult,
        sessionAgent,
        adminUserToken: userResult.userToken,
        workspace: workspaceResult.rawWorkspace,
      };
    }

    case kFimidaraResourceType.AgentToken: {
      const userResult = await insertUserForTest(
        props.user?.userInput,
        props.user?.skipAutoVerifyEmail
      );
      const workspaceResult = await insertWorkspaceForTest(
        userResult.userToken,
        props.workspace?.workspaceInput
      );
      const tokenResult = await insertAgentTokenForTest(
        userResult.userToken,
        workspaceResult.rawWorkspace.resourceId,
        props.token?.tokenInput
      );
      const sessionAgent = makeWorkspaceAgentTokenAgent(tokenResult.rawToken);
      const base: GetTestSessionAgentPreResult = {
        userResult,
        workspaceResult,
        sessionAgent,
        adminUserToken: userResult.userToken,
        workspace: workspaceResult?.rawWorkspace,
      };

      const permissionsCombinedResults = await makeTestSessionAgentPermissions(
        tokenResult.rawToken.resourceId,
        base,
        props
      );

      return {
        ...base,
        ...permissionsCombinedResults,
        tokenResult,
      };
    }

    case kFimidaraResourceType.Public: {
      const userResult = await insertUserForTest(
        props.user?.userInput,
        props.user?.skipAutoVerifyEmail
      );
      const workspaceResult = await insertWorkspaceForTest(
        userResult.userToken,
        props.workspace?.workspaceInput
      );
      const sessionAgent = kPublicSessionAgent;
      const base: GetTestSessionAgentPreResult = {
        userResult,
        workspaceResult,
        sessionAgent,
        adminUserToken: userResult.userToken,
        workspace: workspaceResult?.rawWorkspace,
      };

      const permissionsCombinedResults = await makeTestSessionAgentPermissions(
        workspaceResult.rawWorkspace.publicPermissionGroupId,
        base,
        props
      );

      return {
        ...base,
        ...permissionsCombinedResults,
        sessionAgent,
      };
    }

    default: {
      throw new Error(`Unsupported type ${agentType}`);
    }
  }
}

async function makeTestSessionAgentPermissions<TPermissionsFnResult = unknown>(
  entityId: string,
  base: GetTestSessionAgentPreResult,
  props: Pick<
    NonNullable<GetTestSessionAgentProps<TPermissionsFnResult>>,
    'permissions' | 'beforePermissions'
  >
) {
  const {userResult, workspaceResult} = base;

  let permissionsResult:
    | Awaited<ReturnType<typeof insertPermissionItemsForTest>>
    | undefined;
  let permissionsOpts = props.permissions;
  let beforePermissionsFnResult:
    | Awaited<ReturnType<NonNullable<typeof props.beforePermissions>>>
    | undefined;

  if (props.beforePermissions) {
    beforePermissionsFnResult = await props.beforePermissions(base);
  }

  if (beforePermissionsFnResult?.permissions) {
    permissionsOpts = beforePermissionsFnResult.permissions;
  }

  if (permissionsOpts) {
    permissionsResult = await insertPermissionItemsForTest(
      userResult.userToken,
      workspaceResult.rawWorkspace.resourceId,
      /** input */ {
        entityId,
        ...(permissionsOpts.target || {
          targetId: workspaceResult.rawWorkspace.resourceId,
        }),
        access: true,
        action: permissionsOpts.actions,
      }
    );
  }

  return {
    permissionsResult,
    permissionsOpts,
    beforePermissionsFnOtherResult: beforePermissionsFnResult?.other,
  };
}
