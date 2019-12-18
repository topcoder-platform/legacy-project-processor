# Topcoder - Legacy Project Processor

## Dependencies

- nodejs https://nodejs.org/en/ (v8)
- Kafka
- Informix
- Postgres
- Docker, Docker Compose

## Configuration

Configuration for the legacy groups processor is at `config/default.js`.
The following parameters can be set in config files or in env variables:
- LOG_LEVEL: the log level; default value: 'debug'
- KAFKA_URL: comma separated Kafka hosts; default value: 'localhost:9092'
- KAFKA_CLIENT_CERT: Kafka connection certificate, optional; default value is undefined;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to certificate file or certificate content
- KAFKA_CLIENT_CERT_KEY: Kafka connection private key, optional; default value is undefined;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to private key file or private key content
- KAFKA_GROUP_ID: the Kafka group id, default value is 'legacy-project-processor'
- CREATE_PROJECT_TOPIC: create project Kafka topic, default value is 'project.action.create'
- UPDATE_PROJECT_TOPIC: update project Kafka topic, default value is 'project.action.update'
- DELETE_PROJECT_TOPIC: delete project member Kafka topic, default value is 'project.action.delete'
- INFORMIX: Informix database configuration parameters, refer `config/default.js` for more information
- POSTGRES: Postgres database configuration parameters, refer `config/default.js` for more information

generally, we only need to update INFORMIX_HOST, KAFKA_URL and POSTGRES_URL via environment variables, see INFORMIX_HOST, KAFKA_URL and POSTGRES_URL parameter in docker/sample.api.env

There is a `/health` endpoint that checks for the health of the app. This sets up an expressjs server and listens on the environment variable `PORT`. It's not part of the configuration file and needs to be passed as an environment variable

Configuration for the tests is at `config/test.js`, only add such new configurations different from `config/default.js`
- WAIT_TIME: wait time used in test, default is 1000 or one second

## Local Kafka setup

- `http://kafka.apache.org/quickstart` contains details to setup and manage Kafka server,
  below provides details to setup Kafka server in Linux/Mac, Windows will use bat commands in bin/windows instead
- download kafka at `https://www.apache.org/dyn/closer.cgi?path=/kafka/1.1.0/kafka_2.11-1.1.0.tgz`
- extract out the downloaded tgz file
- go to extracted directory kafka_2.11-0.11.0.1
- start ZooKeeper server:
  `bin/zookeeper-server-start.sh config/zookeeper.properties`
- use another terminal, go to same directory, start the Kafka server:
  `bin/kafka-server-start.sh config/server.properties`
- note that the zookeeper server is at localhost:2181, and Kafka server is at localhost:9092
- use another terminal, go to same directory, create the needed topics:
  `bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic project.action.create`

  `bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic project.action.update`

  `bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic project.action.delete`

- verify that the topics are created:
  `bin/kafka-topics.sh --list --zookeeper localhost:2181`,
  it should list out the created topics
- run the producer and then write some message into the console to send to the `project.action.create` topic:
  in the console, write message, one message per line:
  `{ "topic": "project.action.create", "originator": "project-api", "timestamp": "2018-07-02T00:00:00", "mime-type": "application/json", "payload": { "resource": "project", "id": 1000, "name": "Develop website", "description": "<h>Test</h><p>This is description</p>", "type": "Develop website", "directProjectId": null, "billingAccountId": 70015983,  "type": "Web Application", "createdBy": 8547899 } }`
- optionally, use another terminal, go to same directory, start a consumer to view the messages:
  `bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic project.action.create --from-beginning`
- writing/reading messages to/from other topics are similar

## Topcoder Informix Database Setup
We will use Topcoder Informix database setup on Docker.

Go to `docker-ifx` folder and run `docker-compose up`

## Postgres database setup

- Checkout tc-project-service `v5-upgrade` branch
```bash
git clone https://github.com/topcoder-platform/tc-project-service.git
git checkout v5-upgrade
```
- Modify `dbConfig.masterUrl` in `config/default.json`
- Run command `npm install` to install dependencies
- Run command `npm run sync:db` to create tables on Postgres database

## Local deployment
- Given the fact that the library used to access Informix DB depends on Informix Client SDK.
We will run the application on Docker using a base image with Informix Client SDK installed and properly configured.
For deployment, please refer to next section 'Local Deployment with Docker'

## Local Deployment with Docker

To run the Legacy Project Processor using docker, follow the steps below

1. Make sure that Kafka, Postgres and Informix are running as per instructions above.

2. Go to `docker` folder

3. Rename the file `sample.api.env` to `api.env` And properly update the IP addresses to match your environment for the variables : KAFKA_URL, INFORMIX_HOST and POSTGRES_URL( make sure to use IP address instead of hostname ( i.e localhost will not work)).Here is an example:
```
KAFKA_URL=192.168.31.8:9092
INFORMIX_HOST=192.168.31.8
POSTGRES_URL=postgres://postgres:password@192.168.31.8:5432/postgres
```

4. Once that is done, go to run the following command

```
docker-compose up
```

5. When you are running the application for the first time, It will take some time initially to download the image and install the dependencies

## Running e2e tests
You need to run `docker-compose build` if modify source files.
Make sure run `docker-compose up` in `docker` folder once to make sure application will install dependencies and run successfully with Kafka, Postgres and Informix.

To run e2e tests
Modify `docker/docker-compose.yml` with `command: run test`(uncomment it) and run `docker-compose up` in `docker` folder

To run e2e tests and generates coverage report
Modify `docker/docker-compose.yml` with `command: run test:cov`(uncomment it) and run `docker-compose up` in `docker` folder

## Verification
Refer `Verification.md`
