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
