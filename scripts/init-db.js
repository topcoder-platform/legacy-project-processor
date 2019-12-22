/**
 * Initialize database.
 */

require('../src/bootstrap')
const { getInformixConnection } = require('../src/common/helper')
const logger = require('../src/common/logger')

async function initDB () {
  const connection = await getInformixConnection()
  try {
    await connection.queryAsync(`delete from tcs_catalog:direct_project_metadata_audit`)
    await connection.queryAsync(`delete from tcs_catalog:direct_project_metadata`)
    await connection.queryAsync(`delete from tcs_catalog:copilot_profile`)
    await connection.queryAsync(`delete from tcs_catalog:copilot_project`)
    await connection.queryAsync(`delete from tcs_catalog:group_associated_billing_accounts`)
    await connection.queryAsync(`delete from tcs_catalog:group_member`)
    await connection.queryAsync(`delete from tcs_catalog:customer_group`)
    await connection.queryAsync(`delete from tcs_catalog:customer_administrator`)
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
