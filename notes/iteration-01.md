# FILES - ITERATION 01

## Goals

1. Implement arbitrarily deep folders and files
2. Image fetch transforms
3. User tokens, program access tokens, and client assigned tokens
4. CDN (public - client token - program token - collaborators)
5. Collaborators

## Architecture

Check /architecture-01.txt

## Features

1. User
   a. Do some research on Auth0 to see if it meets our needs
2. Organizations [available to verified users]
   a. Users can create organization
   b. Invite/remove collaborators to/from the organization
   c. Users can update organizations.
   d. Users can delete organizations. on deleting an organization, an email is sent to the collaborators, letting them know the organization has been deleted and who did it.
   e. A list of organizations a user is part of is fetched and displayed on the organizations page. On click on an organization, it navigates to the organization's page.
