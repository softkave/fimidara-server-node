# Runner

- flag controlled, meaning a flag will tell the app to run as server or runner
- spins worker threads for each 1/2 core present
- each worker will pick a job at a time
- unfinished jobs first
- pending jobs next
