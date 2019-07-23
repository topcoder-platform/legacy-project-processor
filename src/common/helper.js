/**
 * Contains generic helper methods
 */

require('pg').defaults.parseInt8 = true

const Sequelize = require('sequelize')
const config = require('config')
const ifxnjs = require('ifxnjs')

const sequelize = new Sequelize(config.get('POSTGRES.URL'), {
  logging: false,
  pool: {
    max: config.POSTGRES.MAX_POOL_SIZE,
    min: config.POSTGRES.MIN_POOL_SIZE,
    idle: config.POSTGRES.IDLE_TIME_OUT
  }
})

const Pool = ifxnjs.Pool
const pool = Promise.promisifyAll(new Pool())
pool.setMaxPoolSize(config.get('INFORMIX.POOL_MAX_SIZE'))

/**
 * Get Informix connection using the configured parameters
 * @return {Object} Informix connection
 */
async function getInformixConnection () {
  // construct the connection string from the configuration parameters.
  const connectionString = 'SERVER=' + config.get('INFORMIX.SERVER') +
                           ';DATABASE=' + config.get('INFORMIX.DATABASE') +
                           ';HOST=' + config.get('INFORMIX.HOST') +
                           ';Protocol=' + config.get('INFORMIX.PROTOCOL') +
                           ';SERVICE=' + config.get('INFORMIX.PORT') +
                           ';DB_LOCALE=' + config.get('INFORMIX.DB_LOCALE') +
                           ';UID=' + config.get('INFORMIX.USER') +
                           ';PWD=' + config.get('INFORMIX.PASSWORD')
  const conn = await pool.openAsync(connectionString)
  return Promise.promisifyAll(conn)
}

/**
 * Get Postgres connection using the configured parameters
 * @return {Object} Sequelize object
 */
function getPostgresConnection () {
  return sequelize
}

/**
 * Get Kafka options
 * @return {Object} the Kafka options
 */
function getKafkaOptions () {
  const options = { connectionString: config.KAFKA_URL, groupId: config.KAFKA_GROUP_ID }
  if (config.KAFKA_CLIENT_CERT && config.KAFKA_CLIENT_CERT_KEY) {
    options.ssl = { cert: config.KAFKA_CLIENT_CERT, key: config.KAFKA_CLIENT_CERT_KEY }
  }
  return options
}

module.exports = {
  getPostgresConnection,
  getInformixConnection,
  getKafkaOptions
}
