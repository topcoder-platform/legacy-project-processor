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
1. start kafka-console-producer to write messages to `project.action.create` topic:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic project.action.create`
2. write message:
  `{ "topic": "project.action.create", "originator": "project-api", "timestamp": "2018-07-02T00:00:00", "mime-type": "application/json", "payload": { "resource": "project", "id": 1000, "name": "Develop website", "description": "<h>Test</h><p>This is description</p>", "directProjectId": null, "billingAccountId": 70015983,  "type": "Web Application", "createdBy": 132458 } }`
3. check the app console to verify message has been properly handled.
4. Again, write another message(directProjectId is provided at this time):
  `{ "topic": "project.action.create", "originator": "project-api", "timestamp": "2018-07-02T00:00:00", "mime-type": "application/json", "payload": { "resource": "project", "id": 1001, "name": "<h1>Test Project</h1>", "description": "<h>Test</h><p>This is description</p>", "directProjectId": 500, "billingAccountId": null, "type": "Web", "createdBy": 132458 } }`
5. check the app console to verify message has been properly handled.
6. Try to write an invalid message:
  `{ "topic": "project.action.create", "originator": "project-api", "timestamp": "2018-07-02T00:00:00", "mime-type": "application/json", "payload": { "resource": "project", "id": 1001, "name": "<h1>Test Project</h1>", "description": "<h>Test</h><p>This is description</p>", "directProjectId": 500, "billingAccountId": 100, "type": "Web", "createdBy": 132458 } }`
7. You will see error message in the app console.
8. start kafka-console-producer to write messages to `project.action.update` topic:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic project.action.update`
9. write message:
  `{ "topic": "project.action.update", "originator": "project-api", "timestamp": "2018-07-02T00:00:00", "mime-type": "application/json", "payload": { "resource": "project", "id": 1001, "directProjectId": 500, "billingAccountId": 70015984, "updatedBy": 132458 } }`
10. check the app console to verify message has been properly handled.
11. Try to write an invalid message:
  `{ "topic": "project.action.update", "originator": "project-api", "timestamp": "2018-07-02T00:00:00", "mime-type": "application/json", "payload": { "resource": "project", "id": 1001, "directProjectId": 500, "billingAccountId": 1, "updatedBy": 132458 } }`
12. You will see error message in the app console.
13. start kafka-console-producer to write messages to `project.action.update` topic:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic project.action.create`
14. write messages:
`{ "topic": "project.action.create", "originator": "project-api", "timestamp": "2018-07-02T00:00:00", "mime-type": "application/json", "payload": { "resource": "project.member", "projectId": 1001, "userId": 132457, "role": "copilot", "createdBy": 132458 } }`

`{ "topic": "project.action.create", "originator": "project-api", "timestamp": "2018-07-02T00:00:00", "mime-type": "application/json", "payload": { "resource": "project.member", "projectId": 1001, "userId": 124835, "role": "manager", "createdBy": 132458 } }`

`{ "topic": "project.action.create", "originator": "project-api", "timestamp": "2018-07-02T00:00:00", "mime-type": "application/json", "payload": { "resource": "project.member", "projectId": 1001, "userId": 124836, "role": "account_manager", "createdBy": 132458 } }`

15. check the app console to verify messages has been properly handled.
16. Repeat step 14 again.
17. You will see error messages in the app console.
18. start kafka-console-producer to write messages to `project.action.update` topic:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic project.action.delete`
19. write messages:
`{ "topic": "project.action.delete", "originator": "project-api", "timestamp": "2018-07-02T00:00:00", "mime-type": "application/json", "payload": { "resource": "project.member", "projectId": 1001, "userId": 132457, "role": "copilot", "deletedBy": 132458 } }`

`{ "topic": "project.action.delete", "originator": "project-api", "timestamp": "2018-07-02T00:00:00", "mime-type": "application/json", "payload": { "resource": "project.member", "projectId": 1001, "userId": 124835, "role": "manager", "deletedBy": 132458 } }`

`{ "topic": "project.action.delete", "originator": "project-api", "timestamp": "2018-07-02T00:00:00", "mime-type": "application/json", "payload": { "resource": "project.member", "projectId": 1001, "userId": 124836, "role": "account_manager", "deletedBy": 132458 } }`

20. check the app console to verify messages has been properly handled.
21. Repeat step 14 again.
22. You will see error messages in the app console.

You can use Database GUI tool to verify the data in database.
For Informix database:
```sql
select * from tc_direct_project;
select * from tc_direct_project_audit;
select * from user_permission_grant;
select * from user_permission_grant_audit;
select * from direct_project_account;
select * from tcs_catalog:copilot_project;
select * from tcs_catalog:direct_project_metadata;
```
For Postgres database:
```sql
select * from projects;
```

## E2E tests coverage

  103 passing (3m)

 File                  |  % Stmts | % Branch |  % Funcs |  % Lines | Uncovered Line #s
 ----------------------|----------|----------|----------|----------|------------------
 All files             |    98.23 |    91.98 |      100 |    98.21 |
  config               |      100 |    89.74 |      100 |      100 |
   default.js          |      100 |    89.74 |      100 |      100 |           8,25,36
   test.js             |      100 |      100 |      100 |      100 |
  src                  |    98.57 |       85 |      100 |    98.51 |
   app.js              |    98.41 |       85 |      100 |    98.39 |                85
   bootstrap.js        |      100 |      100 |      100 |      100 |
   constants.js        |      100 |      100 |      100 |      100 |
  src/common           |    92.59 |    70.83 |      100 |    92.59 |
   helper.js           |      100 |      100 |      100 |      100 |
   logger.js           |    90.63 |       65 |      100 |    90.63 |32,55,60,84,98,118
  src/services         |    99.67 |    99.04 |      100 |    99.66 |
   ProcessorService.js |    99.67 |    99.04 |      100 |    99.66 |               875
