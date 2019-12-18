/**
 * E2E test of the legacy project processor.
 */

process.env.NODE_ENV = 'test'
require('../src/bootstrap')
const _ = require('lodash')
const config = require('config')
const should = require('should')
const Kafka = require('no-kafka')
const request = require('superagent')
const logger = require('../src/common/logger')
const { testTopics } = require('./testData')
const { initDB } = require('../scripts/init-db')
const { insertData } = require('../scripts/test-data')
const { getPostgresConnection, getInformixConnection, getKafkaOptions } = require('../src/common/helper')

describe('Topcoder - Legacy Project Processor E2E Test', () => {
  let app
  let connection
  let infoLogs = []
  let errorLogs = []
  let debugLogs = []
  const info = logger.info
  const error = logger.error
  const debug = logger.debug

  const producer = new Kafka.Producer(getKafkaOptions())

  /**
     * Sleep with time from input
     * @param time the time input
     */
  const sleep = (time) => {
    return new Promise((resolve) => {
      setTimeout(resolve, time)
    })
  }

  /**
     * Send message
     * @param testMessage the test message
     */
  const sendMessage = async (testMessage) => {
    await producer.send({
      topic: testMessage.topic,
      message: {
        value: JSON.stringify(testMessage)
      }
    })
  }

  /**
     * Consume not committed messages before e2e test
     */
  const consumeMessages = async () => {
    // remove all not processed messages
    const consumer = new Kafka.GroupConsumer(getKafkaOptions())
    await consumer.init([{
      subscriptions: [config.CREATE_PROJECT_TOPIC, config.UPDATE_PROJECT_TOPIC, config.DELETE_PROJECT_TOPIC],
      handler: (messageSet, topic, partition) => Promise.each(messageSet,
        (m) => consumer.commitOffset({ topic, partition, offset: m.offset }))
    }])
    // make sure process all not committed messages before test
    await sleep(2 * config.WAIT_TIME)
    await consumer.end()
  }

  /**
     * Wait job finished with successful log or error log is found
     */
  const waitJob = async () => {
    while (true) {
      if (errorLogs.length > 0) {
        break
      }
      if (debugLogs.some(x => String(x).includes('Successfully processed message'))) {
        break
      }
      if (infoLogs.some(x => String(x).includes('Ignored the message'))) {
        break
      }
      // use small time to wait job and will use global timeout so will not wait too long
      await sleep(config.WAIT_TIME)
    }
  }

  const assertErrorMessage = (message) => {
    errorLogs.should.not.be.empty()
    errorLogs.some(x => String(x).includes(message)).should.be.true()
  }

  before(async () => {
    // inject logger with log collector
    logger.info = (message) => {
      infoLogs.push(message)
      info(message)
    }
    logger.debug = (message) => {
      debugLogs.push(message)
      debug(message)
    }
    logger.error = (message) => {
      errorLogs.push(message)
      error(message)
    }
    await consumeMessages()
    // start kafka producer
    await producer.init()
    // start the application (kafka listener)
    app = require('../src/app')
    // wait until consumer init successfully
    while (true) {
      if (infoLogs.some(x => String(x).includes('Kick Start'))) {
        break
      }
      await sleep(config.WAIT_TIME)
    }
    await initDB()
    await insertData()
    connection = await getInformixConnection()
  })

  after(async () => {
    await initDB()

    // restore logger
    logger.error = error
    logger.info = info
    logger.debug = debug

    try {
      await producer.end()
    } catch (err) {
      // ignore
    }
    try {
      await app.end()
    } catch (err) {
      // ignore
    }

    await connection.closeAsync()
  })

  beforeEach(() => {
    // clear logs
    infoLogs = []
    debugLogs = []
    errorLogs = []
  })

  it('Should setup healthcheck with check on kafka connection', async () => {
    const healthcheckEndpoint = `http://localhost:${process.env.PORT || 3000}/health`
    let result = await request.get(healthcheckEndpoint)
    should.equal(result.status, 200)
    should.deepEqual(result.body, { checksRun: 1 })
    debugLogs.should.match(/connected=true/)
  })

  it('Should ignore the mssage', async () => {
    let message = _.cloneDeep(testTopics.addMember.testMessages[0])
    message.payload.resource = 'ignore'
    await sendMessage(message)
    await waitJob()

    should.equal(infoLogs[infoLogs.length - 1], 'Ignored the message')
  })

  it('Should handle invalid json message', async () => {
    const testMessage = testTopics.create.testMessages[0]
    await producer.send({
      topic: testMessage.topic,
      message: {
        value: '[ invalid'
      }
    })
    await waitJob()
    should.equal(errorLogs[0], 'Invalid message JSON.')
  })

  it('Should handle incorrect topic field message', async () => {
    const testMessage = testTopics.create.testMessages[0]
    let message = _.cloneDeep(testMessage)
    message.topic = 'invalid'
    await producer.send({
      topic: testMessage.topic,
      message: {
        value: JSON.stringify(message)
      }
    })
    await waitJob()
    should.equal(errorLogs[0], 'The message topic invalid doesn\'t match the Kafka topic project.action.create.')
  })

  it('failure - processor create project with nonexistent billing account ', async () => {
    let message = _.cloneDeep(testTopics.create.testMessages[0])
    message.payload.billingAccountId = 100
    await sendMessage(message)
    await waitJob()

    assertErrorMessage(`The billing account with id: ${message.payload.billingAccountId} doesn't exist`)
  })

  it('processor create project success', async () => {
    await sendMessage(testTopics.create.testMessages[0])
    await waitJob()

    // verify data in postgres database
    let res = await getPostgresConnection().query(`select * from projects where id = 1000`)
    const directProjectId = res[0][0].directProjectId
    directProjectId.should.be.above(0)

    // verify data in informix database
    res = await connection.queryAsync(`select * from tc_direct_project p where p.project_id = ${directProjectId}`)
    should.equal(res.length, 1)
    should.equal(res[0].name, 'Develop website')
    should.equal(res[0].description, '&lt;h&gt;Test&lt;/h&gt;&lt;p&gt;This is description&lt;/p&gt;')
    should.equal(res[0].project_status_id, 1)
    should.equal(res[0].user_id, 132458)
    should.equal(res[0].direct_project_type_id, 1)
    should.equal(res[0].create_date !== null, true)
    should.equal(res[0].modify_date !== null, true)
    should.equal(res[0].fixed_bug_contest_fee === null, true)
    should.equal(res[0].percentage_bug_contest_fee, 10)

    res = await connection.queryAsync(`select * from tc_direct_project_audit where audit_action_type_id = 1 and old_value is null and tc_direct_project_id = ${directProjectId}`)
    should.equal(res.length, 4)
    const expecteResult = [
      { field_name: 'name', new_value: 'Develop website' },
      { field_name: 'description', new_value: '&lt;h&gt;Test&lt;/h&gt;&lt;p&gt;This is description&lt;/p&gt;' },
      { field_name: 'project_status_id', new_value: '1' },
      { field_name: 'direct_project_type_id', new_value: '1' }
    ]
    const hasElements = [false, false, false, false]
    for (const element of res) {
      for (let i = 0; i < 4; i++) {
        if (element.field_name === expecteResult[i].field_name && element.new_value === expecteResult[i].new_value) {
          hasElements[i] = true
          break
        }
      }
    }
    should.equal(hasElements[0], true)
    should.equal(hasElements[1], true)
    should.equal(hasElements[2], true)
    should.equal(hasElements[3], true)

    res = await connection.queryAsync(`select * from user_permission_grant where resource_id = ${directProjectId} and user_id = 132458 and is_studio = 0`)
    should.equal(res.length, 1)
    should.equal(res[0].permission_type_id, 3)

    res = await connection.queryAsync(`select * from user_permission_grant_audit where user_permission_grant_id = ${res[0].user_permission_grant_id} and audit_action_type_id = 1 and user_id = 132458 and resource_id = ${directProjectId}`)
    should.equal(res.length, 1)
    should.equal(res[0].field_name, 'permission_type_id')
    should.equal(res[0].old_value === null, true)
    should.equal(res[0].new_value, 3)

    res = await connection.queryAsync(`select * from direct_project_account where project_id = ${directProjectId}`)
    should.equal(res.length, 1)
    should.equal(res[0].billing_account_id, testTopics.create.testMessages[0].payload.billingAccountId)
  })

  it('processor create(upsert) project success, perform insert operation', async () => {
    await sendMessage(testTopics.create.testMessages[1])
    await waitJob()

    let res = await getPostgresConnection().query(`select * from projects where id = 1001`)
    const directProjectId = res[0][0].directProjectId
    should.equal(directProjectId, 500)

    res = await connection.queryAsync(`select * from tc_direct_project p where p.project_id = ${directProjectId}`)
    should.equal(res.length, 1)
    should.equal(res[0].name, '&lt;h1&gt;Test Project&lt;/h1&gt;')
    should.equal(res[0].description, '&lt;h&gt;Test&lt;/h&gt;&lt;p&gt;This is description&lt;/p&gt;')
    should.equal(res[0].project_status_id, 1)
    should.equal(res[0].user_id, 132458)
    should.equal(res[0].direct_project_type_id === null, true)
    should.equal(res[0].create_date !== null, true)
    should.equal(res[0].modify_date !== null, true)
    should.equal(res[0].fixed_bug_contest_fee === null, true)
    should.equal(res[0].percentage_bug_contest_fee === null, true)

    res = await connection.queryAsync(`select * from tc_direct_project_audit where audit_action_type_id = 1 and old_value is null and tc_direct_project_id = ${directProjectId}`)
    should.equal(res.length, 3)
    const expecteResult = [
      { field_name: 'name', new_value: '&lt;h1&gt;Test Project&lt;/h1&gt;' },
      { field_name: 'description', new_value: '&lt;h&gt;Test&lt;/h&gt;&lt;p&gt;This is description&lt;/p&gt;' },
      { field_name: 'project_status_id', new_value: '1' }
    ]
    const hasElements = [false, false, false]
    for (const element of res) {
      for (let i = 0; i < 3; i++) {
        if (element.field_name === expecteResult[i].field_name && element.new_value === expecteResult[i].new_value) {
          hasElements[i] = true
          break
        }
      }
    }
    should.equal(hasElements[0], true)
    should.equal(hasElements[1], true)
    should.equal(hasElements[2], true)

    res = await connection.queryAsync(`select * from user_permission_grant where resource_id = ${directProjectId} and user_id = 132458 and is_studio = 0`)
    should.equal(res.length, 1)
    should.equal(res[0].permission_type_id, 3)

    res = await connection.queryAsync(`select * from user_permission_grant_audit where user_permission_grant_id = ${res[0].user_permission_grant_id} and audit_action_type_id = 1 and user_id = 132458 and resource_id = ${directProjectId}`)
    should.equal(res.length, 1)
    should.equal(res[0].field_name, 'permission_type_id')
    should.equal(res[0].old_value === null, true)
    should.equal(res[0].new_value, 3)

    res = await connection.queryAsync(`select * from direct_project_account where project_id = ${directProjectId}`)
    should.equal(res.length, 0)
  })

  it('processor create(upsert) project success, perform update operation at this time.', async () => {
    await sendMessage(testTopics.create.testMessages[2])
    await waitJob()

    let res = await getPostgresConnection().query(`select * from projects where id = 1001`)
    const directProjectId = res[0][0].directProjectId
    should.equal(directProjectId, 500)

    res = await connection.queryAsync(`select * from tc_direct_project p where p.project_id = ${directProjectId}`)
    should.equal(res.length, 1)
    should.equal(res[0].name, '&lt;h1&gt;New Test Project&lt;/h1&gt;')
    should.equal(res[0].description, '&lt;h&gt;Test&lt;/h&gt;&lt;p&gt;This is description&lt;/p&gt;')
    should.equal(res[0].project_status_id, 1)
    should.equal(res[0].user_id, 132458)
    should.equal(res[0].direct_project_type_id, 8)
    should.equal(res[0].create_date !== null, true)
    should.equal(res[0].modify_date !== null, true)
    should.equal(res[0].fixed_bug_contest_fee === null, true)
    should.equal(res[0].percentage_bug_contest_fee, 10)

    res = await connection.queryAsync(`select * from tc_direct_project_audit where audit_action_type_id = 3 and tc_direct_project_id = ${directProjectId}`)
    should.equal(res.length, 2)
    const expecteResult = [
      { field_name: 'name', old_value: '&lt;h1&gt;Test Project&lt;/h1&gt;', new_value: '&lt;h1&gt;New Test Project&lt;/h1&gt;' },
      { field_name: 'direct_project_type_id', old_value: null, new_value: '8' }
    ]
    const hasElements = [false, false]
    for (const element of res) {
      for (let i = 0; i < 2; i++) {
        if (element.field_name === expecteResult[i].field_name && element.old_value === expecteResult[i].old_value && element.new_value === expecteResult[i].new_value) {
          hasElements[i] = true
          break
        }
      }
    }
    should.equal(hasElements[0], true)
    should.equal(hasElements[1], true)

    res = await connection.queryAsync(`select * from direct_project_account where project_id = ${directProjectId}`)
    should.equal(res.length, 1)
    should.equal(res[0].billing_account_id, testTopics.create.testMessages[2].payload.billingAccountId)
  })

  it('processor update project success, update billing account 1', async () => {
    const directProjectId = testTopics.update.testMessages[0].payload.directProjectId
    await sendMessage(testTopics.update.testMessages[0])
    await waitJob()

    const billingAccountId = testTopics.update.testMessages[0].payload.billingAccountId
    let res = await connection.queryAsync(`select * from direct_project_account where project_id = ${directProjectId} and billing_account_id = ${billingAccountId}`)
    should.equal(res.length, 1)

    res = await connection.queryAsync(`select * from tc_direct_project p where p.project_id = ${directProjectId}`)
    should.equal(res.length, 1)
    should.equal(res[0].fixed_bug_contest_fee, 1000)
    should.equal(res[0].percentage_bug_contest_fee === null, true)
  })

  it('processor update project success, update billing account 2', async () => {
    const directProjectId = testTopics.update.testMessages[1].payload.directProjectId
    await sendMessage(testTopics.update.testMessages[1])
    await waitJob()

    const billingAccountId = testTopics.update.testMessages[1].payload.billingAccountId
    let res = await connection.queryAsync(`select * from direct_project_account where project_id = ${directProjectId} and billing_account_id = ${billingAccountId}`)
    should.equal(res.length, 1)

    res = await connection.queryAsync(`select * from tc_direct_project p where p.project_id = ${directProjectId}`)
    should.equal(res.length, 1)
    should.equal(res[0].fixed_bug_contest_fee, 2000)
    should.equal(res[0].percentage_bug_contest_fee === null, true)
  })

  it('processor update project success, update billing account 3', async () => {
    const directProjectId = testTopics.update.testMessages[2].payload.directProjectId
    await sendMessage(testTopics.update.testMessages[2])
    await waitJob()

    const billingAccountId = testTopics.update.testMessages[2].payload.billingAccountId
    let res = await connection.queryAsync(`select * from direct_project_account where project_id = ${directProjectId} and billing_account_id = ${billingAccountId}`)
    should.equal(res.length, 1)

    res = await connection.queryAsync(`select * from tc_direct_project p where p.project_id = ${directProjectId}`)
    should.equal(res.length, 1)
    should.equal(res[0].fixed_bug_contest_fee, 0)
    should.equal(res[0].percentage_bug_contest_fee === null, true)
  })

  it('processor update project success, update billing account 4', async () => {
    const directProjectId = 500
    await sendMessage(testTopics.update.testMessages[3])
    await waitJob()

    const billingAccountId = testTopics.update.testMessages[3].payload.billingAccountId
    let res = await connection.queryAsync(`select * from direct_project_account where project_id = ${directProjectId} and billing_account_id = ${billingAccountId}`)
    should.equal(res.length, 1)

    res = await connection.queryAsync(`select * from tc_direct_project p where p.project_id = ${directProjectId}`)
    should.equal(res.length, 1)
    should.equal(res[0].fixed_bug_contest_fee, 1000)
    should.equal(res[0].percentage_bug_contest_fee === null, true)
  })

  it('processor update project success, update billing account again(already associated), just update contest fee', async () => {
    const directProjectId = testTopics.update.testMessages[1].payload.directProjectId
    const billingAccountId = testTopics.update.testMessages[1].payload.billingAccountId

    let res = await connection.queryAsync(`select * from direct_project_account where project_id = ${directProjectId} and billing_account_id = ${billingAccountId}`)
    should.equal(res.length, 1)

    await sendMessage(testTopics.update.testMessages[1])
    await waitJob()

    // no change on direct_project_account table
    res = await connection.queryAsync(`select * from direct_project_account where project_id = ${directProjectId} and billing_account_id = ${billingAccountId}`)
    should.equal(res.length, 1)

    res = await connection.queryAsync(`select * from tc_direct_project p where p.project_id = ${directProjectId}`)
    should.equal(res.length, 1)
    should.equal(res[0].fixed_bug_contest_fee, 2000)
    should.equal(res[0].percentage_bug_contest_fee === null, true)
  })

  it('failure processor update project, billing account is belong to different client', async () => {
    const message = _.cloneDeep(testTopics.update.testMessages[0])
    message.payload.billingAccountId = 1
    await sendMessage(message)
    await waitJob()

    assertErrorMessage(`The client of the billing account to add does not match existing client`)
  })

  it(`failure processor update project, user can't access billing account`, async () => {
    const message = _.cloneDeep(testTopics.update.testMessages[2])
    message.payload.updatedBy = 132457
    await sendMessage(message)
    await waitJob()

    assertErrorMessage(`You don't have permission to access this billing account`)
  })

  it(`failure processor update project, user doesn't existed`, async () => {
    const message = _.cloneDeep(testTopics.update.testMessages[1])
    message.payload.updatedBy = 10000
    await sendMessage(message)
    await waitJob()

    assertErrorMessage(`User with id: 10000 doesn't exist.`)
  })

  it(`failure processor update project, billing account doesn't existed`, async () => {
    const message = _.cloneDeep(testTopics.update.testMessages[0])
    message.payload.billingAccountId = 100
    await sendMessage(message)
    await waitJob()

    assertErrorMessage(`The billing account with id: ${message.payload.billingAccountId} doesn't exist`)
  })

  it(`failure processor update project, direct project doesn't existed`, async () => {
    const message = _.cloneDeep(testTopics.update.testMessages[0])
    message.payload.directProjectId = 100
    await sendMessage(message)
    await waitJob()

    assertErrorMessage(`Direct project with given id: ${message.payload.directProjectId} doesn't existed.`)
  })

  it(`processor update project, ignore the message`, async () => {
    const message = _.cloneDeep(testTopics.update.testMessages[0])
    message.payload.billingAccountId = null
    await sendMessage(message)
    await waitJob()

    should.equal(infoLogs[infoLogs.length - 1], 'Ignore other message, only update billing account is supported')
  })

  it('processor update project success, add copilot', async () => {
    await sendMessage(testTopics.addMember.testMessages[0])
    await waitJob()

    let res = await connection.queryAsync(`select * from tcs_catalog:copilot_project where copilot_profile_id = 1 and tc_direct_project_id = 500`)
    should.equal(res.length, 1)
  })

  it('processor update project success, add manager', async () => {
    await sendMessage(testTopics.addMember.testMessages[1])
    await waitJob()

    let res = await connection.queryAsync(`select * from tcs_catalog:direct_project_metadata where tc_direct_project_id = 500 and project_metadata_key_id = 2`)
    should.equal(res.length, 1)
    should.equal(res[0].metadata_value, 124835)

    res = await connection.queryAsync(`select * from user_permission_grant where resource_id = 500 and user_id = 124835 and is_studio = 0`)
    should.equal(res.length, 1)
    should.equal(res[0].permission_type_id, 3)

    res = await connection.queryAsync(`select * from user_permission_grant_audit where user_permission_grant_id = ${res[0].user_permission_grant_id} and audit_action_type_id = 1 and user_id = 124835 and resource_id = 500`)
    should.equal(res.length, 1)
    should.equal(res[0].field_name, 'permission_type_id')
    should.equal(res[0].old_value === null, true)
    should.equal(res[0].new_value, 3)
  })

  it('processor update project success, add account manager', async () => {
    await sendMessage(testTopics.addMember.testMessages[2])
    await waitJob()

    let res = await connection.queryAsync(`select * from tcs_catalog:direct_project_metadata where tc_direct_project_id = 500 and project_metadata_key_id = 14`)
    should.equal(res.length, 1)
    should.equal(res[0].metadata_value, 124836)

    res = await connection.queryAsync(`select * from user_permission_grant where resource_id = 500 and user_id = 124836 and is_studio = 0`)
    should.equal(res.length, 1)
    should.equal(res[0].permission_type_id, 3)

    res = await connection.queryAsync(`select * from user_permission_grant_audit where user_permission_grant_id = ${res[0].user_permission_grant_id} and audit_action_type_id = 1 and user_id = 124836 and resource_id = 500`)
    should.equal(res.length, 1)
    should.equal(res[0].field_name, 'permission_type_id')
    should.equal(res[0].old_value === null, true)
    should.equal(res[0].new_value, 3)
  })

  it('processor update project success, add manager 2', async () => {
    await sendMessage(testTopics.addMember.testMessages[3])
    await waitJob()

    let res = await connection.queryAsync(`select * from tcs_catalog:direct_project_metadata where tc_direct_project_id = 500 and project_metadata_key_id = 2`)
    should.equal(res.length, 2)
    should.equal(res[0].metadata_value, 124835)
    should.equal(res[1].metadata_value, 124852)

    res = await connection.queryAsync(`select * from user_permission_grant where resource_id = 500 and user_id = 124852 and is_studio = 0`)
    should.equal(res.length, 1)
    should.equal(res[0].permission_type_id, 3)

    res = await connection.queryAsync(`select * from user_permission_grant_audit where user_permission_grant_id = ${res[0].user_permission_grant_id} and audit_action_type_id = 1 and user_id = 124852 and resource_id = 500`)
    should.equal(res.length, 1)
    should.equal(res[0].field_name, 'permission_type_id')
    should.equal(res[0].old_value === null, true)
    should.equal(res[0].new_value, 3)
  })

  it('processor update project success, add account manager 2', async () => {
    await sendMessage(testTopics.addMember.testMessages[4])
    await waitJob()

    let res = await connection.queryAsync(`select * from tcs_catalog:direct_project_metadata where tc_direct_project_id = 500 and project_metadata_key_id = 14`)
    should.equal(res.length, 2)
    should.equal(res[0].metadata_value, 124836)
    should.equal(res[1].metadata_value, 124853)

    res = await connection.queryAsync(`select * from user_permission_grant where resource_id = 500 and user_id = 124853 and is_studio = 0`)
    should.equal(res.length, 1)
    should.equal(res[0].permission_type_id, 3)

    res = await connection.queryAsync(`select * from user_permission_grant_audit where user_permission_grant_id = ${res[0].user_permission_grant_id} and audit_action_type_id = 1 and user_id = 124853 and resource_id = 500`)
    should.equal(res.length, 1)
    should.equal(res[0].field_name, 'permission_type_id')
    should.equal(res[0].old_value === null, true)
    should.equal(res[0].new_value, 3)
  })

  it('processor update project, ignore the message', async () => {
    let message = _.cloneDeep(testTopics.addMember.testMessages[0])
    message.topic = config.UPDATE_PROJECT_TOPIC
    await sendMessage(message)
    await waitJob()

    should.equal(infoLogs[infoLogs.length - 1], 'Ignored the message')
  })

  it('processor update project, ignore member role observer', async () => {
    let message = _.cloneDeep(testTopics.addMember.testMessages[0])
    message.payload.role = 'observer'
    await sendMessage(message)
    await waitJob()

    should.equal(infoLogs[infoLogs.length - 1], 'Ignore other message, only add copilot/manager are supported')
  })

  it('processor update project fail, user is not in copilot pool', async () => {
    let message = _.cloneDeep(testTopics.addMember.testMessages[0])
    message.payload.userId = 124836
    await sendMessage(message)
    await waitJob()

    assertErrorMessage(`Given user: 124836 is not in the copilot pool`)
  })

  it('processor update project fail, incorrect project id', async () => {
    let message = _.cloneDeep(testTopics.addMember.testMessages[0])
    message.payload.projectId = 100
    await sendMessage(message)
    await waitJob()

    assertErrorMessage(`No project with id: 100 exist in Postgres database`)
  })

  it('processor update project fail, add the same copilot', async () => {
    await sendMessage(testTopics.addMember.testMessages[0])
    await waitJob()

    assertErrorMessage(`User: 132457 is already the copilot of the given project`)
  })

  it('processor update project fail, add the same manager', async () => {
    await sendMessage(testTopics.addMember.testMessages[3])
    await waitJob()

    assertErrorMessage(`User: 124852 is already the manager of the given project`)
  })

  it('processor update project fail, add the same account manager', async () => {
    await sendMessage(testTopics.addMember.testMessages[4])
    await waitJob()

    assertErrorMessage(`User: 124853 is already the account manager of the given project`)
  })

  it('processor delete project member success, remove copilot', async () => {
    await sendMessage(testTopics.removeMember.testMessages[0])
    await waitJob()

    let res = await connection.queryAsync(`select * from tcs_catalog:copilot_project where copilot_profile_id = 1 and tc_direct_project_id = 500`)
    should.equal(res.length, 0)
  })

  it('processor delete project member success, remove manager', async () => {
    await sendMessage(testTopics.removeMember.testMessages[1])
    await waitJob()

    let res = await connection.queryAsync(`select * from tcs_catalog:direct_project_metadata where tc_direct_project_id = 500 and project_metadata_key_id = 2`)
    should.equal(res.length, 1)
    should.equal(res[0].metadata_value, 124852)

    res = await connection.queryAsync(`select * from user_permission_grant where resource_id = 500 and user_id = 124835 and is_studio = 0`)
    should.equal(res.length, 0)

    res = await connection.queryAsync(`select * from user_permission_grant_audit where audit_action_type_id = 2 and user_id = 124835 and resource_id = 500`)
    should.equal(res.length, 1)
    should.equal(res[0].field_name, 'permission_type_id')
    should.equal(res[0].old_value, 3)
    should.equal(res[0].new_value === null, true)
  })

  it('processor delete project member success, remove account manager', async () => {
    await sendMessage(testTopics.removeMember.testMessages[2])
    await waitJob()

    let res = await connection.queryAsync(`select * from tcs_catalog:direct_project_metadata where tc_direct_project_id = 500 and project_metadata_key_id = 14`)
    should.equal(res.length, 1)
    should.equal(res[0].metadata_value, 124853)

    res = await connection.queryAsync(`select * from user_permission_grant where resource_id = 500 and user_id = 124836 and is_studio = 0`)
    should.equal(res.length, 0)

    res = await connection.queryAsync(`select * from user_permission_grant_audit where audit_action_type_id = 2 and user_id = 124836 and resource_id = 500`)
    should.equal(res.length, 1)
    should.equal(res[0].field_name, 'permission_type_id')
    should.equal(res[0].old_value, 3)
    should.equal(res[0].new_value === null, true)
  })

  it('processor delete project member, ignore the message', async () => {
    let message = _.cloneDeep(testTopics.removeMember.testMessages[0])
    message.payload.resource = 'project'
    await sendMessage(message)
    await waitJob()

    should.equal(infoLogs[infoLogs.length - 1], 'Ignored the message')
  })

  it('processor delete project member fail, remove same copilot again', async () => {
    await sendMessage(testTopics.removeMember.testMessages[0])
    await waitJob()

    assertErrorMessage(`User: 132457 is not the copilot of the given project`)
  })

  it('processor delete project member fail, remove same manager again', async () => {
    await sendMessage(testTopics.removeMember.testMessages[1])
    await waitJob()

    assertErrorMessage(`User: 124835 is not the manager of the given project`)
  })

  it('processor delete project member fail, remove same account manager again', async () => {
    await sendMessage(testTopics.removeMember.testMessages[2])
    await waitJob()

    assertErrorMessage(`User: 124836 is not the account manager of the given project`)
  })

  it('processor delete project member, ignore member role observer', async () => {
    let message = _.cloneDeep(testTopics.removeMember.testMessages[2])
    message.payload.role = 'observer'
    await sendMessage(message)
    await waitJob()

    should.equal(infoLogs[infoLogs.length - 1], 'Ignore other message, only remove copilot/manager are supported')
  })

  for (const op of ['create', 'update', 'addMember', 'removeMember']) {
    let { requiredFields, integerFields, stringFields, testMessages } = testTopics[op]

    it(`test invalid parameters resource, message is ignored`, async () => {
      let message = _.cloneDeep(testMessages[0])
      message.payload.resource = 'ignore'
      await sendMessage(message)
      await waitJob()

      should.equal(infoLogs[infoLogs.length - 1], 'Ignored the message')
    })

    for (const requiredField of requiredFields) {
      it(`test invalid parameters, required field ${requiredField} is missing`, async () => {
        let message = _.cloneDeep(testMessages[0])
        message = _.omit(message, requiredField)
        await sendMessage(message)
        await waitJob()

        assertErrorMessage(`"${_.last(requiredField.split('.'))}" is required`)
      })
    }

    for (const stringField of stringFields) {
      it(`test invalid parameters, invalid string type field ${stringField}`, async () => {
        let message = _.cloneDeep(testMessages[0])
        _.set(message, stringField, 123)
        await sendMessage(message)
        await waitJob()

        assertErrorMessage(`"${_.last(stringField.split('.'))}" must be a string`)
      })
    }

    if (op === 'create') {
      it(`test invalid parameters, string field name too long`, async () => {
        let message = _.cloneDeep(testMessages[0])
        _.set(message, 'payload.name', 'a'.repeat(201))
        await sendMessage(message)
        await waitJob()

        assertErrorMessage(`"name" length must be less than or equal to 200 characters long`)
      })

      it(`test invalid parameters, string field description too long`, async () => {
        let message = _.cloneDeep(testMessages[0])
        _.set(message, 'payload.description', 'a'.repeat(10001))
        await sendMessage(message)
        await waitJob()

        assertErrorMessage(`"description" length must be less than or equal to 10000 characters long`)
      })

      it(`test invalid parameters, string field type too long`, async () => {
        let message = _.cloneDeep(testMessages[0])
        _.set(message, 'payload.type', 'a'.repeat(46))
        await sendMessage(message)
        await waitJob()

        assertErrorMessage(`"type" length must be less than or equal to 45 characters long`)
      })
    }

    for (const integerField of integerFields) {
      it(`test invalid parameters, invalid integer type field ${integerField}(wrong number)`, async () => {
        let message = _.cloneDeep(testMessages[0])
        _.set(message, integerField, 'string')
        await sendMessage(message)
        await waitJob()

        assertErrorMessage(`"${_.last(integerField.split('.'))}" must be a number`)
      })

      it(`test invalid parameters, invalid integer type field ${integerField}(wrong integer)`, async () => {
        let message = _.cloneDeep(testMessages[0])
        _.set(message, integerField, 1.1)
        await sendMessage(message)
        await waitJob()

        assertErrorMessage(`"${_.last(integerField.split('.'))}" must be an integer`)
      })
    }
  }
})
