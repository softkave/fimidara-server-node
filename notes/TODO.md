## Server

- resumable uploads
- image manipulation
- authentication + authorization + workspaces
- metered read & read capacity
- set cookies
- test that multiple files with same name are not created
- api idempotency
- move from queue waitOnStream to pubsub
- usage thresholds internal and reporting
- docs
- range download
- cookies
- when the agent is public, don't return all data
- add providedId to add and update endpoints for workspace resources
- regex match for email not working because email contained +
- do not require rootname if using token
- there was an error with sharp that broke the instance (maybe not waiting for
  promise is why it breaks app)
- in delete jobs, use versions marked deleted for original objects
- usage records
  - usage records alerting
  - UI to set usage thresholds internal
  - make sure api and users can't set thresholds themselves for now, but can read it
  - UI to update costs, internal
  - limit how many workspaces a user can create, maybe 3 or 5 for now
- go through apis docs
- logs, maybe Sentry
- audit logs
- use local fs?
- check if email recipient is a user and only send login link, or signup link otherwise
- tool to print config without values for env
- email me with new signups in intervals
- what happens when a user still have bandwidth in but no storage?
- fix NotFoundException exception thrown from email deliverability check (AWS SES)
  - switch email to resend
- empty out test s3 bucket and write code to auto clean it after tests
- download folder as zip
- match file with node:fs stat, e.g. last accessed, last status change (though
  we don't have a similar concept), and nano seconds, etc.
- stop workers on sigint
- use uncreated folder and file path for permissions
- when surfacing jobs, make sure to not surface all info because a job can start
  a job owned by a different workspace, like remove collaborator is linked to
  unassigning a permission group owned by fimidara
- check that read available works for all file providers, local, s3, etc.

## JS SDK

- api
  - examples
  - json example code
  - hide N/A
  - sample apps
- auto extract and document exports
- support esm and commonjs (current issue is softkave-js-utils only supports esm, and lodash-es + peer deps)
- readFile typedef should return stream | blob depending on responseType
- diff files content?
- optimize node diff files
- optimize copyFolderFiles because currently we fetch all local and fimidara files for diff
  - issue is diff will be incomplete when we diff on paged results
- authentication + authorization + workspaces
- image manipulation
- mount external backends

## CLI

- login
- mute errors not fatal in fimidara sync
  - handle errors per file or global error like auth globally
  - show only error message
- show files it's working on/skipping
- maybe add an option to show files and folders interacted with
- show files and folders in sync it's working on

## NextJs

- dark mode
- authentication + authorization + workspaces
- image manipulation
- add that you get $# free hosting for 1 year on fimidara as a banner
- integrate sentry
- changelog
- agent token
  - encode jwt
  - hide agent token and toggle to see
- new homepage with features + code
- sample apps
- image manipulation
- report bug/request feature
- prevent submit if error and data has not changed
- group actions by resource type
- search
  - all resources
  - permissions
  - all list
- prevent submit again of change password after success
- only show actions if user has permission
- toggle allow showing password
- marketing emails & subscriptions using resend
- copy in agent token and other info
- add toast for long runnign tasks like delete so they can track and know it's not immediate
- no separate folders/files loading and error
- files and folders not refreshed after upload (testing in root)
- link to go back to file or folder from form
  - open in drawer/sidebar
- highlight in buttons particularly signup form
  - maybe move off antd gradually to shadcn
  - Tag not showing correctly, waitlist page
- little lag where dashboard shows sidebar and login/signup form
- workspace name not centered in list
- spacing nav bar
- disable mutation actions if not email verified
- loading and error background
- mobile docs and look through all pages for mobile
- dark mode styling for 404 and other pages
- center all "loading..."/"nothing found..." divs
- shows not logged in home page on first load when logged in
- only show errors not marked internal, but log in console
- revise overview docs
- revise docs one-by-one
- display public errors only
- logout
- silently refresh data when user visits page if page already has data (files and folders)
- not showing correct upload size for a file, and not advancing download progress
- retrying failed/successful uploads does not show green status
- custom yup error messages
- confirm file errors are showing in uploaded file list
- files and folders multi-select
- show status of long-running tasks
- move lodash to lodash-es
- soft refresh data on first load page (remove clear fetch state in folder form also)
- prevent mutation actions if user is not email verified
- auto-scroll back to top of page on error to surface error
- accessibility
- mount external backends
- login with token
- show file size
- choose first workspace if one
- homepage refresh
- icons to files, with size
- open items in drawer panel
- bolder font
