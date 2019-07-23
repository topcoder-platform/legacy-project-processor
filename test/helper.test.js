/**
 * Unit test of the legacy project processor helper method.
 */

process.env.NODE_ENV = 'test'
require('../src/bootstrap')
const config = require('config')
const should = require('should')
const sinon = require('sinon')

describe('Topcoder - Legacy Project Processor Unit Test', () => {
  before(() => {
    sinon.stub(config, 'KAFKA_CLIENT_CERT').value('fake-cert')
    sinon.stub(config, 'KAFKA_CLIENT_CERT_KEY').value('fake-key')
  })

  after(() => {
    sinon.reset()
  })

  it('Test getKafkaOptions', async () => {
    const helper = require('../src/common/helper')
    const options = helper.getKafkaOptions()
    should.equal(options.ssl.cert, 'fake-cert')
    should.equal(options.ssl.key, 'fake-key')
  })
})
