# Topcoder - Legacy Project Processor

## Setup
- start Kafka server, start Informix database, start processor app.
- If you have started the processor under Docker, use the following command to initialize test data inside the docker container.
```bash
docker exec -it legacy-project-processor bash
npm run init-db
npm run test-data
```
- Otherwise, just run following command in your local environment.
```bash
npm run init-db
npm run test-data
```

## Verification
1. start kafka-console-producer to write messages to `project.notification.create` topic:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic project.notification.create`
2. write message:
  `{ "topic": "project.notification.create", "originator": "project-api", "timestamp": "2018-07-02T00:00:00", "mime-type": "application/json", "payload": { "resource": "project", "id": 1000, "name": "Develop website", "description": "<h>Test</h><p>This is description</p>", "directProjectId": null, "billingAccountId": 70015983,  "type": "Web Application", "createdBy": 8547899 } }`
3. check the app console to verify message has been properly handled.
4. Again, write another message(directProjectId is provided at this time):
  `{ "topic": "project.notification.create", "originator": "project-api", "timestamp": "2018-07-02T00:00:00", "mime-type": "application/json", "payload": { "resource": "project", "id": 1001, "name": "<h1>Test Project</h1>", "description": "<h>Test</h><p>This is description</p>", "directProjectId": 500, "billingAccountId": null, "type": "Web", "createdBy": 8547899 } }`
5. check the app console to verify message has been properly handled.
6. Try to write an invalid message:
  `{ "topic": "project.notification.create", "originator": "project-api", "timestamp": "2018-07-02T00:00:00", "mime-type": "application/json", "payload": { "resource": "project", "id": 1001, "name": "<h1>Test Project</h1>", "description": "<h>Test</h><p>This is description</p>", "directProjectId": 500, "billingAccountId": 100, "type": "Web", "createdBy": 8547899 } }`
7. You will see error message in the app console.
8. start kafka-console-producer to write messages to `project.notification.update` topic:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic project.notification.update`
9. write message:
  `{ "topic": "project.notification.update", "originator": "project-api", "timestamp": "2018-07-02T00:00:00", "mime-type": "application/json", "payload": { "resource": "project", "directProjectId": 500, "billingAccountId": 70015984 } }`
10. check the app console to verify message has been properly handled.
11. Try to write an invalid message:
  `{ "topic": "project.notification.update", "originator": "project-api", "timestamp": "2018-07-02T00:00:00", "mime-type": "application/json", "payload": { "resource": "project", "directProjectId": 500, "billingAccountId": 1 } }`
12. You will see error message in the app console.

You can use Database GUI tool to verify the data in database.
For Informix database:
```sql
select * from tc_direct_project;
select * from tc_direct_project_audit;
select * from user_permission_grant;
select * from user_permission_grant_audit;
select * from direct_project_account;
```
For Postgres database:
```sql
select * from projects;
```

## E2E tests coverage

  50 passing (1m)

File                  |  % Stmts | % Branch |  % Funcs |  % Lines | Uncovered Line #s
----------------------|----------|----------|----------|----------|-------------------
All files             |    97.55 |    89.52 |      100 |    97.52 |
 config               |      100 |    91.67 |      100 |      100 |
  default.js          |      100 |    91.67 |      100 |      100 |           8,24,35
  test.js             |      100 |      100 |      100 |      100 |
 src                  |    98.15 |       70 |      100 |    98.04 |
  app.js              |    97.87 |       70 |      100 |    97.83 |                66
  bootstrap.js        |      100 |      100 |      100 |      100 |
  constants.js        |      100 |      100 |      100 |      100 |
 src/common           |    92.59 |    70.83 |      100 |    92.59 |
  helper.js           |      100 |      100 |      100 |      100 |
  logger.js           |    90.63 |       65 |      100 |    90.63 |32,55,60,84,98,118
 src/services         |      100 |      100 |      100 |      100 |
  ProcessorService.js |      100 |      100 |      100 |      100 |
