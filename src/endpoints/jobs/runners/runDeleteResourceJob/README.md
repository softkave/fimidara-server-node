# runDeleteResourceJob

- Process is split into 2 steps:

  - queue job for deleting artifacts
  - queue job for deleting self (resource to be deleted), run after the job for deleting artifacts is complete

- Process to delete artifacts is split into 2:
  - fetch artifacts that contain children & create jobs for them
  - delete artifacts that do not contain children
