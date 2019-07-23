/**
 * Processor Service
 */

const _ = require('lodash')
const config = require('config')
const joi = require('@hapi/joi')
const logger = require('../common/logger')
const helper = require('../common/helper')
const Entities = require('html-entities').AllHtmlEntities
const entities = new Entities()
const {
  PROJECT_STATUS,
  AUDIT_ACTION,
  PERMISSION_TYPE,
  PROJECT_CREATE_RESOURCES,
  PROJECT_UPDATE_RESOURCES,
  BUGR_CONTEST_TYPE_ID
} = require('../constants')

/**
 * Prepare Informix statement
 * @param {Object} connection the Informix connection
 * @param {String} sql the sql
 * @return {Object} Informix statement
 */
async function prepare (connection, sql) {
  const stmt = await connection.prepareAsync(sql)
  return Promise.promisifyAll(stmt)
}

/**
 * Get direct project by id
 * @param {Object} connection the Informix connection
 * @param {Number} directProjectId the direct project id
 * @returns {Object} the direct project with given id
 */
async function getProject (connection, directProjectId) {
  const result = await connection.queryAsync(`select * from tc_direct_project p where p.project_id = ${directProjectId}`)
  return result.length > 0 ? result[0] : undefined
}

/**
 * Ensure billing account exist
 * @param {Object} connection the Informix connection
 * @param {Number} billingAccountId the billing account id
 */
async function checkBillingAccountExist (connection, billingAccountId) {
  const result = await connection.queryAsync(`select count(*) as cnt from time_oltp:project p where p.project_id = ${billingAccountId}`)
  if (Number(result[0].cnt) === 0) {
    throw new Error(`The billing account with id: ${billingAccountId} doesn't exist`)
  }
}

/**
 * Check whether the billing account have already associated to the direct project
 * @param {Object} connection the Informix connection
 * @param {Number} directProjectId the direct project id
 * @param {Number} billingAccountId the billing account id
 * @returns {Boolean} the billing account have associated to the project or not
 */
async function checkBillingAccountAssociate (connection, directProjectId, billingAccountId) {
  const result = await connection.queryAsync(`SELECT count(*) as cnt FROM direct_project_account pba WHERE pba.project_id = ${directProjectId} AND pba.billing_account_id = ${billingAccountId}`)
  return Number(result[0].cnt) > 0
}

/**
 * Get one of the existing billing account id which have already associated to the given direct project
 * @param {Object} connection the Informix connection
 * @param {Number} directProjectId the direct project id
 * @returns {Number} the billing account id match criteria
 */
async function getExistingBillingAccountId (connection, directProjectId) {
  const result = await connection.queryAsync(`SELECT billing_account_id FROM direct_project_account pba WHERE pba.project_id = ${directProjectId}`)
  return result.length === 0 ? undefined : result[0].billing_account_id
}

/**
 * Get the client id for given billing account
 * @param {Object} connection the Informix connection
 * @param {Number} billingAccountId the billing account id
 * @returns {Number} the client id for given billing account
 */
async function getClientId (connection, billingAccountId) {
  const result = await connection.queryAsync(`select c.client_id from time_oltp:client c, time_oltp:client_project cp, time_oltp:project p where p.project_id = cp.project_id and c.client_id = cp.client_id and (p.is_deleted = 0 or p.is_deleted is null) and p.project_id = ${billingAccountId}`)
  return result[0].client_id
}

/**
 * Get project type id by name
 * @param {Object} connection the Informix connection
 * @param {String} name the type name
 * @returns {Number} the project type id
 */
async function getProjectTypeId (connection, name) {
  const result = await connection.queryAsync(`select direct_project_type_id from direct_project_type where name = '${name}'`)
  return result.length === 0 ? null : result[0].direct_project_type_id
}

/**
 * Get percentage bug contest fee base on billing account
 * @param {Object} connection the Informix connection
 * @param {Number} billingAccountId the billing account id
 * @returns {Number} the percentage bug contest fee
 */
async function getPercentageBugContestFee (connection, billingAccountId) {
  const result = await connection.queryAsync(`select contest_fee_percentage from time_oltp:project_contest_fee_percentage where project_id = ${billingAccountId} and active = 't'`)
  return result.length === 0 ? null : result[0].contest_fee_percentage
}

/**
 * Get fixed bug contest fee base on billing account
 * @param {Object} connection the Informix connection
 * @param {Number} billingAccountId the billing account id
 * @returns {Number} the fixed bug contest fee
 */
async function getFixedBugContestFee (connection, billingAccountId) {
  const result = await connection.queryAsync(`select contest_fee from time_oltp:project_contest_fee where project_id = ${billingAccountId} and contest_type_id = ${BUGR_CONTEST_TYPE_ID}`)
  return result.length === 0 ? null : result[0].contest_fee
}

const projectAuditFields = ['name', 'description', 'project_status_id', 'project_forum_id', 'direct_project_type_id', 'direct_project_category_id', 'completion_date']

/**
 * Create direct project.
 * @param {Object} connection the Informix connection
 * @param {Number} directProjectId the direct project id
 * @param {Object} projectData the project data
 */
async function createProject (connection, directProjectId, projectData) {
  // prepare the statement for inserting the project data to coporate_oltp.tc_direct_project table
  const rawPayload = {
    project_id: directProjectId,
    name: entities.encode(projectData.name),
    description: entities.encode(projectData.description),
    user_id: projectData.userId,
    project_status_id: PROJECT_STATUS.ACTIVE, // direct project status always be active once created
    direct_project_type_id: await getProjectTypeId(connection, projectData.type),
    percentage_bug_contest_fee: projectData.percentageBugContestFee,
    fixed_bug_contest_fee: projectData.fixedBugContestFee
  }

  const normalizedPayload = _.omitBy(rawPayload, _.isUndefined)
  const keys = Object.keys(normalizedPayload)
  const fields = ['create_date', 'modify_date'].concat(keys)
  const values = ['current', 'current'].concat(_.fill(Array(keys.length), '?'))

  const createProjectStmt = await prepare(connection, `insert into tc_direct_project (${fields.join(', ')}) values (${values.join(', ')})`)

  await createProjectStmt.executeAsync(Object.values(normalizedPayload))

  for (const field of projectAuditFields) {
    if (rawPayload[field]) {
      // prepare the statement for inserting the audit data to coporate_oltp.tc_direct_project_audit table
      const auditPayload = {
        tc_direct_project_id: directProjectId,
        audit_action_type_id: AUDIT_ACTION.CREATE,
        action_user_id: projectData.userId,
        field_name: field,
        new_value: rawPayload[field]
      }

      const normalizedPayload = _.omitBy(auditPayload, _.isUndefined)
      const keys = Object.keys(normalizedPayload)
      const fields = ['tc_direct_project_audit_id'].concat(keys)
      const values = ['tc_direct_project_audit_sequence.nextval'].concat(_.fill(Array(keys.length), '?'))

      const createAuditStmt = await prepare(connection, `insert into tc_direct_project_audit (${fields.join(', ')}) values (${values.join(', ')})`)

      await createAuditStmt.executeAsync(Object.values(normalizedPayload))
    }
  }
}

/**
 * Calculated contest fee and determine whether do we need to associate the billing account
 * @param {Object} connection the Informix connection
 * @param {Number} directProjectId the direct project id
 * @param {Number} billingAccountId the billing account id
 * @param {Boolean} isCreated the boolean flag indicate we are going to create direct project or not
 * @returns {Object} the calculated contest fee and boolean flag indicate associate operation is need
 */
async function calculateFeeAndCheckAssociate (connection, directProjectId, billingAccountId, isCreated) {
  let alreadyAssociated = false
  let fee = {}

  await checkBillingAccountExist(connection, billingAccountId)

  // check whether billing account already associate to this direct project
  // not need to perform checking if we are going to create the direct project latter
  if (!isCreated) {
    alreadyAssociated = await checkBillingAccountAssociate(connection, directProjectId, billingAccountId)

    if (!alreadyAssociated) {
      // fetch one of associated billing account to check client consistent
      const existedBillingAccountId = await getExistingBillingAccountId(connection, directProjectId)
      if (existedBillingAccountId) {
        const client1Id = await getClientId(connection, existedBillingAccountId)
        const client2Id = await getClientId(connection, billingAccountId)
        if (client1Id !== client2Id) {
          throw new Error(`The client of the billing account to add does not match existing client`)
        }
      }
    }
  }

  fee.percentageBugContestFee = await getPercentageBugContestFee(connection, billingAccountId)
  if (!fee.percentageBugContestFee) {
    fee.fixedBugContestFee = await getFixedBugContestFee(connection, billingAccountId) || 0
  } else {
    fee.fixedBugContestFee = null
  }

  return { fee, needAssociate: !alreadyAssociated }
}

/**
 * Associate billing account to specified direct project
 * @param {Object} connection the Informix connection
 * @param {Number} directProjectId the direct project id
 * @param {Number} billingAccountId the billing account id
 */
async function associateBillingAccountToProject (connection, directProjectId, billingAccountId) {
  const payload = {
    project_id: directProjectId,
    billing_account_id: billingAccountId
  }
  const keys = Object.keys(payload)
  const fields = ['direct_project_account_id'].concat(keys)
  const values = ['direct_project_account_sequence.nextval'].concat(_.fill(Array(keys.length), '?'))

  const associateStmt = await prepare(connection, `insert into direct_project_account (${fields.join(', ')}) values (${values.join(', ')})`)
  await associateStmt.executeAsync(Object.values(payload))
}

/**
 * Grant permission to user for specified direct project
 * @param {Object} connection the Informix connection
 * @param {Number} directProjectId the direct project id
 * @param {Number} userId the user id
 * @param {Number} permissionTypeId the permission type id
 */
async function grantPermission (connection, directProjectId, userId, permissionTypeId) {
  const generateId = await connection.queryAsync('select first 1 permission_seq.nextval from direct_project_type')
  const permissionId = generateId[0].nextval

  // prepare the statement for inserting the data to coporate_oltp.user_permission_grant table
  const permissionPayload = {
    user_permission_grant_id: permissionId,
    user_id: userId,
    resource_id: directProjectId,
    permission_type_id: permissionTypeId,
    is_studio: 0
  }
  const permissionKeys = Object.keys(permissionPayload)
  const permissionValues = _.fill(Array(permissionKeys.length), '?')

  const createPermissionStmt = await prepare(connection, `insert into user_permission_grant (${permissionKeys.join(', ')}) values (${permissionValues.join(', ')})`)
  await createPermissionStmt.executeAsync(Object.values(permissionPayload))

  // prepare the statement for inserting the audit data to coporate_oltp.user_permission_grant_audit table
  const auditPayload = {
    user_permission_grant_id: permissionId,
    audit_action_type_id: AUDIT_ACTION.CREATE,
    user_id: userId,
    resource_id: directProjectId,
    action_user_id: userId, // action user is the same when create the project
    field_name: 'permission_type_id',
    new_value: permissionTypeId
  }

  const keys = Object.keys(auditPayload)
  const auditKeys = ['user_permission_grant_audit_id'].concat(keys)
  const auditValues = ['user_permission_grant_audit_sequence.nextval'].concat(_.fill(Array(keys.length), '?'))

  const createAuditStmt = await prepare(connection, `insert into user_permission_grant_audit (${auditKeys.join(', ')}) values (${auditValues.join(', ')})`)
  await createAuditStmt.executeAsync(Object.values(auditPayload))
}

/**
 * Check the old field value and new field value are different
 * @param {Object} value1 the old field value
 * @param {Object} value2 the new field value
 * @returns {Boolean} true if different, false otherwise
 */
function isDifferentFieldValue (value1, value2) {
  return _.isNil(value1) ? !_.isNil(value2) : value1 !== value2
}

/**
 * Update direct project.
 * @param {Object} connection the Informix connection
 * @param {Number} directProjectId the direct project id
 * @param {Object} projectData the project data
 * @param {Object} existingProject existing project data
 */
async function updateProject (connection, directProjectId, projectData, existingProject) {
  // prepare the statement for updating the project data to coporate_oltp.tc_direct_project table
  const rawPayload = {
    name: projectData.name ? entities.encode(projectData.name) : undefined,
    description: projectData.description ? entities.encode(projectData.description) : undefined,
    user_id: projectData.userId,
    project_status_id: projectData.projectStatus,
    direct_project_type_id: projectData.type ? await getProjectTypeId(connection, projectData.type) : undefined,
    percentage_bug_contest_fee: projectData.percentageBugContestFee,
    fixed_bug_contest_fee: projectData.fixedBugContestFee
  }

  const normalizedPayload = _.omitBy(rawPayload, _.isUndefined)
  const keys = Object.keys(normalizedPayload)
  const fieldsStatement = keys.map(key => `${key} = ?`).join(', ')

  const updateProjectStmt = await prepare(connection, `update tc_direct_project set modify_date = current, ${fieldsStatement} where project_id = ${directProjectId}`)
  await updateProjectStmt.executeAsync(Object.values(normalizedPayload))

  for (const field of _.intersection(projectAuditFields, keys)) {
    if (isDifferentFieldValue(existingProject[field], rawPayload[field])) {
      // prepare the statement for inserting the audit data to coporate_oltp.tc_direct_project_audit table
      const auditPayload = {
        tc_direct_project_id: directProjectId,
        audit_action_type_id: AUDIT_ACTION.UPDATE,
        action_user_id: projectData.userId,
        field_name: field,
        old_value: existingProject[field],
        new_value: rawPayload[field]
      }

      const normalizedPayload = _.omitBy(auditPayload, _.isNil)
      const keys = Object.keys(normalizedPayload)
      const fields = ['tc_direct_project_audit_id'].concat(keys)
      const values = ['tc_direct_project_audit_sequence.nextval'].concat(_.fill(Array(keys.length), '?'))

      const createAuditStmt = await prepare(connection, `insert into tc_direct_project_audit (${fields.join(', ')}) values (${values.join(', ')})`)

      await createAuditStmt.executeAsync(Object.values(normalizedPayload))
    }
  }
}

/**
 * Process create project message
 * @param {Object} message the kafka message
 */
async function processCreate (message) {
  // informix database connection
  const connection = await helper.getInformixConnection()

  try {
    // begin transaction
    await connection.beginTransactionAsync()

    let directProjectId
    let isCreated = true
    let billingAccountId = message.payload.billingAccountId

    if (message.payload.directProjectId) {
      // upsert project with given id
      directProjectId = message.payload.directProjectId
      isCreated = false
    } else {
      // create project
      const generateId = await connection.queryAsync('select first 1 project_sequence.nextval from direct_project_type')
      directProjectId = generateId[0].nextval
    }

    let fee = {}
    let needAssociate

    let existingProject
    if (!isCreated) {
      // determine upsert operation(insert or update) base on project with given id existed or not
      existingProject = await getProject(connection, directProjectId)
      if (!existingProject) {
        isCreated = true
      }
    }

    if (billingAccountId) {
      // Calculated contest fee and determine whether do we need to associate the billing account
      let result = await calculateFeeAndCheckAssociate(connection, directProjectId, billingAccountId, isCreated)
      fee = result.fee
      needAssociate = result.needAssociate
    }

    if (isCreated) {
      // create the direct project
      await createProject(connection, directProjectId,
        _.assign({
          projectStatus: PROJECT_STATUS.ACTIVE,
          userId: message.payload.createdBy
        }, fee, message.payload))
      // grant permission to created user
      await grantPermission(connection, directProjectId, message.payload.createdBy, PERMISSION_TYPE.PROJECT_FULL)
    } else {
      // update the direct project
      await updateProject(connection, directProjectId,
        _.assign({
          projectStatus: PROJECT_STATUS.ACTIVE,
          userId: message.payload.createdBy
        }, fee, message.payload),
        existingProject)
      // since the project is already existed, no need to grant permission to created user again
    }

    if (needAssociate) {
      await associateBillingAccountToProject(connection, directProjectId, billingAccountId)
    }

    // update projects.directProjectId in Postgres
    await helper.getPostgresConnection().query(`update ${config.POSTGRES.PROJECT_TABLE_NAME} set "directProjectId" = ${directProjectId} where id = ${message.payload.id}`)

    // commit the transaction after successfully update projects.directProjectId in Postgres
    await connection.commitTransactionAsync()
  } catch (e) {
    await connection.rollbackTransactionAsync()
    throw e
  } finally {
    await connection.closeAsync()
  }
}

processCreate.schema = {
  message: joi.object().keys({
    topic: joi.string().required(),
    originator: joi.string().required(),
    timestamp: joi.date().required(),
    'mime-type': joi.string().required(),
    payload: joi.object().keys({
      resource: joi.string().required().valid(PROJECT_CREATE_RESOURCES),
      id: joi.numberId(),
      name: joi.string().max(200).required(),
      description: joi.string().max(10000).allow('').required(),
      directProjectId: joi.optionalNumberId().allow(null),
      billingAccountId: joi.optionalNumberId().allow(null),
      type: joi.string().max(45).required(),
      createdBy: joi.numberId()
    }).unknown(true).required()
  }).required()
}

/**
 * Process create project message
 * @param {Object} message the kafka message
 */
async function processUpdate (message) {
  // informix database connection
  const connection = await helper.getInformixConnection()

  try {
    // begin transaction
    await connection.beginTransactionAsync()

    const directProjectId = message.payload.directProjectId
    const existingProject = await getProject(connection, directProjectId)
    if (existingProject) {
      if (message.payload.billingAccountId) {
        const billingAccountId = message.payload.billingAccountId
        // Calculated contest fee and determine whether do we need to associate the billing account
        let { fee, needAssociate } = await calculateFeeAndCheckAssociate(connection, directProjectId, billingAccountId, false)

        // update the direct project
        await updateProject(connection, directProjectId, fee, existingProject)

        if (needAssociate) {
          await associateBillingAccountToProject(connection, directProjectId, billingAccountId)
        }
      } else {
        logger.info('Ignore other message, only update billing account is supported')
      }
    } else {
      throw new Error(`Direct project with given id: ${directProjectId} doesn't existed.`)
    }

    // commit the transaction
    await connection.commitTransactionAsync()
  } catch (e) {
    await connection.rollbackTransactionAsync()
    throw e
  } finally {
    await connection.closeAsync()
  }
}

processUpdate.schema = {
  message: joi.object().keys({
    topic: joi.string().required(),
    originator: joi.string().required(),
    timestamp: joi.date().required(),
    'mime-type': joi.string().required(),
    payload: joi.object().keys({
      resource: joi.string().required().valid(PROJECT_UPDATE_RESOURCES),
      directProjectId: joi.numberId(),
      billingAccountId: joi.optionalNumberId().allow(null)
    }).unknown(true).required()
  }).required()
}

module.exports = {
  processCreate,
  processUpdate
}

logger.buildService(module.exports)
