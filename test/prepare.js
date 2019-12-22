/*
 * Setup mock server
 */
process.env.NODE_ENV = 'test'
require('../src/bootstrap')

const prepare = require('mocha-prepare')
const nock = require('nock')
const testData = require('./testData')

prepare(function (done) {
  let directProjectId
  nock(/.*/)
    .persist()
    .filteringPath(path => {
      if (path.includes('/projects')) {
        return '/_projects'
      }
      if (path.includes('/token')) { // match auth0 url
        return '/_m2mAuth'
      }
      return path
    })
    .get('/_projects')
    .reply((uri) => {
      if (uri.match(/\/99$/)) { // simulate non-existent project id
        return [404, { message: 'project not found for id 99' }]
      }
      return [200, { directProjectId }]
    })
    .patch('/_projects')
    .reply(200, (uri, requestBody) => {
      directProjectId = requestBody.directProjectId
    })
    .post('/_m2mAuth')
    .reply(200, {
      access_token: testData.token.m2m,
      expiry: 8400
    })
    .get('/health')
    .reply(200, { checksRun: 1 })
  done()
}, function (done) {
  done()
})
