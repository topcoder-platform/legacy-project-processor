/**
 * Initialize database.
 */

require('../src/bootstrap')
const { getPostgresConnection, getInformixConnection } = require('../src/common/helper')
const logger = require('../src/common/logger')

async function initDB () {
  await getPostgresConnection().query(`delete from projects`)
  const connection = await getInformixConnection()
  try {
    await connection.queryAsync(`delete from direct_project_account`)
    await connection.queryAsync(`delete from tc_direct_project`)
    await connection.queryAsync(`delete from tc_direct_project_audit`)
    await connection.queryAsync(`delete from user_permission_grant`)
    await connection.queryAsync(`delete from user_permission_grant_audit`)
    await connection.queryAsync(`delete from time_oltp:project_contest_fee_percentage where project_id >= 70015983`)
    await connection.queryAsync(`delete from time_oltp:project_contest_fee where project_id >= 70015983`)
  } finally {
    await connection.closeAsync()
  }
}

if (!module.parent) {
  initDB().then(() => {
    logger.info('Done!')
    process.exit()
  }).catch((e) => {
    logger.logFullError(e)
    process.exit(1)
  })
}

module.exports = {
  initDB
}
