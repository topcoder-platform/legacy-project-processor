/*
 * Test data to be used in tests
 */

const testTopics = {
  create: {
    requiredFields: ['originator', 'timestamp', 'mime-type',
      'payload.id', 'payload.name', 'payload.description', 'payload.type', 'payload.createdBy'],
    stringFields: ['payload.name', 'payload.description', 'payload.type'],
    integerFields: ['payload.id', 'payload.directProjectId', 'payload.billingAccountId', 'payload.createdBy'],
    testMessages: [
      {
        topic: 'project.action.create',
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
          createdBy: 132458
        }
      },
      {
        topic: 'project.action.create',
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
          createdBy: 132458
        }
      },
      {
        topic: 'project.action.create',
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
          createdBy: 132458
        }
      }
    ]
  },
  update: {
    requiredFields: ['originator', 'timestamp', 'mime-type',
      'payload.id'],
    stringFields: [],
    integerFields: ['payload.id', 'payload.directProjectId', 'payload.billingAccountId'],
    testMessages: [
      {
        topic: 'project.action.update',
        originator: 'project-api',
        timestamp: '2018-07-02T00:00:00',
        'mime-type': 'application/json',
        payload: {
          resource: 'project',
          id: 1001,
          directProjectId: 500,
          billingAccountId: 70015984,
          updatedBy: 132458
        }
      },
      {
        topic: 'project.action.update',
        originator: 'project-api',
        timestamp: '2018-07-02T00:00:00',
        'mime-type': 'application/json',
        payload: {
          resource: 'project',
          id: 1001,
          directProjectId: 500,
          billingAccountId: 70016343,
          updatedBy: 132457
        }
      },
      {
        topic: 'project.action.update',
        originator: 'project-api',
        timestamp: '2018-07-02T00:00:00',
        'mime-type': 'application/json',
        payload: {
          resource: 'project',
          id: 1001,
          directProjectId: 500,
          billingAccountId: 70016347,
          updatedBy: 132458
        }
      },
      {
        topic: 'project.action.update',
        originator: 'project-api',
        timestamp: '2018-07-02T00:00:00',
        'mime-type': 'application/json',
        payload: {
          resource: 'project',
          id: 1001,
          billingAccountId: 70015984,
          updatedBy: 132457
        }
      }
    ]
  },
  addMember: {
    requiredFields: ['originator', 'timestamp', 'mime-type',
      'payload.projectId', 'payload.userId', 'payload.role', 'payload.createdBy'],
    stringFields: ['payload.role'],
    integerFields: ['payload.projectId', 'payload.userId', 'payload.createdBy'],
    testMessages: [
      {
        topic: 'project.action.create',
        originator: 'project-api',
        timestamp: '2018-07-02T00:00:00',
        'mime-type': 'application/json',
        payload: {
          resource: 'project.member',
          projectId: 1001,
          userId: 132457,
          role: 'copilot',
          createdBy: 132458
        }
      },
      {
        topic: 'project.action.create',
        originator: 'project-api',
        timestamp: '2018-07-02T00:00:00',
        'mime-type': 'application/json',
        payload: {
          resource: 'project.member',
          projectId: 1001,
          userId: 124835,
          role: 'manager',
          createdBy: 132458
        }
      },
      {
        topic: 'project.action.create',
        originator: 'project-api',
        timestamp: '2018-07-02T00:00:00',
        'mime-type': 'application/json',
        payload: {
          resource: 'project.member',
          projectId: 1001,
          userId: 124836,
          role: 'account_manager',
          createdBy: 132458
        }
      },
      {
        topic: 'project.action.create',
        originator: 'project-api',
        timestamp: '2018-07-02T00:00:00',
        'mime-type': 'application/json',
        payload: {
          resource: 'project.member',
          projectId: 1001,
          userId: 124852,
          role: 'manager',
          createdBy: 132458
        }
      },
      {
        topic: 'project.action.create',
        originator: 'project-api',
        timestamp: '2018-07-02T00:00:00',
        'mime-type': 'application/json',
        payload: {
          resource: 'project.member',
          projectId: 1001,
          userId: 124853,
          role: 'account_manager',
          createdBy: 132458
        }
      }
    ]
  },
  removeMember: {
    requiredFields: ['originator', 'timestamp', 'mime-type',
      'payload.projectId', 'payload.userId', 'payload.role', 'payload.deletedBy'],
    stringFields: ['payload.role'],
    integerFields: ['payload.projectId', 'payload.userId', 'payload.deletedBy'],
    testMessages: [
      {
        topic: 'project.action.delete',
        originator: 'project-api',
        timestamp: '2018-07-02T00:00:00',
        'mime-type': 'application/json',
        payload: {
          resource: 'project.member',
          projectId: 1001,
          userId: 132457,
          role: 'copilot',
          deletedBy: 132458
        }
      },
      {
        topic: 'project.action.delete',
        originator: 'project-api',
        timestamp: '2018-07-02T00:00:00',
        'mime-type': 'application/json',
        payload: {
          resource: 'project.member',
          projectId: 1001,
          userId: 124835,
          role: 'manager',
          deletedBy: 132458
        }
      },
      {
        topic: 'project.action.delete',
        originator: 'project-api',
        timestamp: '2018-07-02T00:00:00',
        'mime-type': 'application/json',
        payload: {
          resource: 'project.member',
          projectId: 1001,
          userId: 124836,
          role: 'account_manager',
          deletedBy: 132458
        }
      }
    ]
  }
}

module.exports = {
  testTopics
}
