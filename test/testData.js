/*
 * Test data to be used in tests
 */

const testTopics = {
  create: {
    requiredFields: ['originator', 'timestamp', 'mime-type',
      'payload.resource', 'payload.id', 'payload.name', 'payload.description', 'payload.type', 'payload.createdBy'],
    stringFields: ['payload.resource', 'payload.name', 'payload.description', 'payload.type'],
    integerFields: ['payload.id', 'payload.directProjectId', 'payload.billingAccountId', 'payload.createdBy'],
    testMessages: [
      {
        topic: 'project.notification.create',
        originator: 'project-api',
        timestamp: '2018-07-02T00:00:00',
        'mime-type': 'application/json',
        payload: {
          resource: 'project',
          id: 1000,
          name: 'Develop website',
          description: '<h>Test</h><p>This is description</p>',
          directProjectId: null,
          billingAccountId: 70015983,
          type: 'Web Application',
          createdBy: 8547899
        }
      },
      {
        topic: 'project.notification.create',
        originator: 'project-api',
        timestamp: '2018-07-02T00:00:00',
        'mime-type': 'application/json',
        payload: {
          resource: 'project',
          id: 1001,
          name: '<h1>Test Project</h1>',
          description: '<h>Test</h><p>This is description</p>',
          directProjectId: 500,
          billingAccountId: null,
          type: 'Web',
          createdBy: 8547899
        }
      },
      {
        topic: 'project.notification.create',
        originator: 'project-api',
        timestamp: '2018-07-02T00:00:00',
        'mime-type': 'application/json',
        payload: {
          resource: 'project',
          id: 1001,
          name: '<h1>New Test Project</h1>',
          description: '<h>Test</h><p>This is description</p>',
          directProjectId: 500,
          billingAccountId: 70015983,
          type: 'Other',
          createdBy: 8547899
        }
      }
    ]
  },
  update: {
    requiredFields: ['originator', 'timestamp', 'mime-type',
      'payload.resource', 'payload.directProjectId'],
    stringFields: ['payload.resource'],
    integerFields: ['payload.directProjectId', 'payload.billingAccountId'],
    testMessages: [
      {
        topic: 'project.notification.update',
        originator: 'project-api',
        timestamp: '2018-07-02T00:00:00',
        'mime-type': 'application/json',
        payload: {
          resource: 'project',
          directProjectId: 500,
          billingAccountId: 70015984
        }
      },
      {
        topic: 'project.notification.update',
        originator: 'project-api',
        timestamp: '2018-07-02T00:00:00',
        'mime-type': 'application/json',
        payload: {
          resource: 'project',
          directProjectId: 500,
          billingAccountId: 70016343
        }
      },
      {
        topic: 'project.notification.update',
        originator: 'project-api',
        timestamp: '2018-07-02T00:00:00',
        'mime-type': 'application/json',
        payload: {
          resource: 'project',
          directProjectId: 500,
          billingAccountId: 70016347
        }
      }
    ]
  }
}

module.exports = {
  testTopics
}
