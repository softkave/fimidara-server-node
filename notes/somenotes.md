# Some Notes

## Pipeline Block

New pipeline runs should only start after the previous run is done. Thinking each pipeline running should be logged in db and new ones check before they run. Question is, should we scrap the run if a current run is still on or should we schedule it to run once the current one is done? I think we should build a scheduler.

### Pipeline Scheduler

- Queuer: Will queue the jobs based on ID. Can live on the main thread since all it's doing is simply queueing jobs.
  - Will provide 2 openings, one for immediately queueing jobs to db, and another that accepts a cron pattern and queues the job if the Queuer is still alive.
- Executor: Will have a store where each job ID is mapped to the code to execute, and it'll listen on the db for queued jobs to execute. Will also live on a worker thread.
