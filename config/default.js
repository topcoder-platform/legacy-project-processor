/**
 * The default configuration file.
 */

module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',

  KAFKA_URL: process.env.KAFKA_URL || 'localhost:9092',
  // below are used for secure Kafka connection, they are optional
  // for the local Kafka, they are not needed
  KAFKA_CLIENT_CERT: process.env.KAFKA_CLIENT_CERT,
  KAFKA_CLIENT_CERT_KEY: process.env.KAFKA_CLIENT_CERT_KEY,

  // Kafka group id
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'legacy-project-processor',

  CREATE_PROJECT_TOPIC: process.env.CREATE_PROJECT_TOPIC || 'project.notification.create',
  UPDATE_PROJECT_TOPIC: process.env.UPDATE_PROJECT_TOPIC || 'project.notification.update',
  DELETE_PROJECT_TOPIC: process.env.DELETE_PROJECT_TOPIC || 'project.notification.delete',

  // informix database configuration
  INFORMIX: {
    SERVER: process.env.IFX_SERVER || 'informixoltp_tcp', // informix server
    DATABASE: process.env.IFX_DATABASE || 'corporate_oltp', // informix database
    HOST: process.env.INFORMIX_HOST || 'localhost', // host
    PROTOCOL: process.env.IFX_PROTOCOL || 'onsoctcp',
    PORT: process.env.IFX_PORT || '2021', // port
    DB_LOCALE: process.env.IFX_DB_LOCALE || 'en_US.57372',
    USER: process.env.IFX_USER || 'informix', // user
    PASSWORD: process.env.IFX_PASSWORD || '1nf0rm1x', // password
    POOL_MAX_SIZE: parseInt(process.env.IFX_POOL_MAX_SIZE) || 10 // use connection pool in processor, the pool size
  },

  // postgres database configuration
  POSTGRES: {
    URL: process.env.POSTGRES_URL || 'postgres://coder:mysecretpassword@dockerhost:5432/projectsdb', // url
    MAX_POOL_SIZE: parseInt(process.env.POSTGRES_MAX_POOL_SIZE) || 50, // max pool size
    MIN_POOL_SIZE: parseInt(process.env.POSTGRES_MIN_POOL_SIZE) || 4, // min pool size
    IDLE_TIME_OUT: parseInt(process.env.POSTGRES_IDLE_TIME_OUT) || 1000, // idle time
    PROJECT_TABLE_NAME: 'projects' // project table name
  }
}
