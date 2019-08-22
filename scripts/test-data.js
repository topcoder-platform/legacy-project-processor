/**
 * Insert test data to database.
 */

require('../src/bootstrap')
const { getPostgresConnection, getInformixConnection } = require('../src/common/helper')
const logger = require('../src/common/logger')

async function insertData () {
  await getPostgresConnection().query(`delete from projects`)
  await getPostgresConnection().query(`insert into projects(id, name, description, terms, type, status, "createdBy", "updatedBy", version, "lastActivityAt", "lastActivityUserId") values(1000, 'name-1', 'description-1', '{1}', 'test', 'draft', 8547899, 8547899, '1.0', now(), '8547899')`)
  await getPostgresConnection().query(`insert into projects(id, "directProjectId", name, description, terms, type, status, "createdBy", "updatedBy", version, "lastActivityAt", "lastActivityUserId") values(1001, 500, 'name-2', 'description-2', '{1}', 'test', 'draft', 8547899, 8547899, '1.0', now(), '8547899')`)
  const connection = await getInformixConnection()
  try {
    await connection.queryAsync(`delete from tcs_catalog:copilot_profile`)
    await connection.queryAsync(`insert into tcs_catalog:copilot_profile values(1, 132457, 1, 0, 0, null, null, '132457', current, '132457', current, 't', 't')`)
    await connection.queryAsync(`insert into tcs_catalog:copilot_profile values(2, 132458, 1, 0, 0, null, null, '132458', current, '132458', current, 't', 't')`)
    await connection.queryAsync(`delete from tcs_catalog:copilot_project`)
    await connection.queryAsync(`insert into tcs_catalog:copilot_project values(1, 2, 'test', 500, 1, 1, null, null, null, null, 0, null, '132457', current, '132457', current)`)
    await connection.queryAsync(`delete from tcs_catalog:group_associated_billing_accounts`)
    await connection.queryAsync(`delete from tcs_catalog:group_member`)
    await connection.queryAsync(`delete from tcs_catalog:customer_group`)
    await connection.queryAsync(`delete from tcs_catalog:customer_administrator`)
    await connection.queryAsync(`insert into tcs_catalog:customer_administrator values(1, 132457, 1001)`)
    await connection.queryAsync(`insert into tcs_catalog:customer_group values(1, 'test', 'FULL', 1001, 0, null, null, null)`)
    await connection.queryAsync(`insert into tcs_catalog:customer_group values(2, 'test', 'READ', 1001, 0, null, null, null)`)
    await connection.queryAsync(`insert into tcs_catalog:group_member values(1, 132457, 2, 0, 'FULL', 1, null, null)`)
    await connection.queryAsync(`insert into tcs_catalog:group_associated_billing_accounts values(1, 70015984)`)
    await connection.queryAsync(`insert into tcs_catalog:group_associated_billing_accounts values(2, 70016343)`)
    await connection.queryAsync(`update time_oltp:project set end_date = '2020-01-01 00:00:00'`)
    await connection.queryAsync(`delete from tc_direct_project where project_id = 500`)
    await connection.queryAsync(`delete from time_oltp:project_contest_fee_percentage where project_id >= 70015983`)
    await connection.queryAsync(`insert into time_oltp:project_contest_fee_percentage(project_contest_fee_percentage_id, project_id, contest_fee_percentage, active) values (time_oltp:project_contest_fee_percentage_seq.nextval, 70015983, 10, 't')`)
    await connection.queryAsync(`insert into time_oltp:project_contest_fee_percentage(project_contest_fee_percentage_id, project_id, contest_fee_percentage, active) values (time_oltp:project_contest_fee_percentage_seq.nextval, 70015984, 10, 'f')`)
    await connection.queryAsync(`insert into time_oltp:project_contest_fee_percentage(project_contest_fee_percentage_id, project_id, active) values (time_oltp:project_contest_fee_percentage_seq.nextval, 70016343, 't')`)
    await connection.queryAsync(`delete from time_oltp:project_contest_fee where project_id >= 70015983`)
    await connection.queryAsync(`insert into time_oltp:project_contest_fee(project_contest_fee_id, project_id, is_studio, contest_type_id, contest_fee) values (time_oltp:project_contest_fee_seq.nextval, 70015983, 0, 900001, 1000)`)
    await connection.queryAsync(`insert into time_oltp:project_contest_fee(project_contest_fee_id, project_id, is_studio, contest_type_id, contest_fee) values (time_oltp:project_contest_fee_seq.nextval, 70015984, 0, 900001, 1000)`)
    await connection.queryAsync(`insert into time_oltp:project_contest_fee(project_contest_fee_id, project_id, is_studio, contest_type_id, contest_fee) values (time_oltp:project_contest_fee_seq.nextval, 70016343, 0, 900001, 2000)`)
  } finally {
    await connection.closeAsync()
  }
}

if (!module.parent) {
  insertData().then(() => {
    logger.info('Done!')
    process.exit()
  }).catch((e) => {
    logger.logFullError(e)
    process.exit(1)
  })
}

module.exports = {
  insertData
}
