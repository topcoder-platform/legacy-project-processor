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
  testTopics,
  token: {
    m2m: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik5VSkZORGd4UlRVME5EWTBOVVkzTlRkR05qTXlRamxETmpOQk5UYzVRVUV3UlRFeU56TTJRUSJ9.eyJpc3MiOiJodHRwczovL3RvcGNvZGVyLWRldi5hdXRoMC5jb20vIiwic3ViIjoibWFFMm1hQlN2OWZSVkhqU2xDMzFMRlpTcTZWaGhacUNAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vbTJtLnRvcGNvZGVyLWRldi5jb20vIiwiaWF0IjoxNTc1MjMyNTMyLCJleHAiOjE1NzUzMTg5MzIsImF6cCI6Im1hRTJtYUJTdjlmUlZIalNsQzMxTEZaU3E2VmhoWnFDIiwic2NvcGUiOiJyZWFkOmNoYWxsZW5nZXMgd3JpdGU6Y2hhbGxlbmdlcyByZWFkOmdyb3VwcyB1cGRhdGU6c3VibWlzc2lvbiByZWFkOnN1Ym1pc3Npb24gZGVsZXRlOnN1Ym1pc3Npb24gY3JlYXRlOnN1Ym1pc3Npb24gYWxsOnN1Ym1pc3Npb24gdXBkYXRlOnJldmlld190eXBlIHJlYWQ6cmV2aWV3X3R5cGUgZGVsZXRlOnJldmlld190eXBlIGFsbDpyZXZpZXdfdHlwZSB1cGRhdGU6cmV2aWV3X3N1bW1hdGlvbiByZWFkOnJldmlld19zdW1tYXRpb24gZGVsZXRlOnJldmlld19zdW1tYXRpb24gY3JlYXRlOnJldmlld19zdW1tYXRpb24gYWxsOnJldmlld19zdW1tYXRpb24gdXBkYXRlOnJldmlldyByZWFkOnJldmlldyBkZWxldGU6cmV2aWV3IGNyZWF0ZTpyZXZpZXcgYWxsOnJldmlldyByZWFkOmJ1c190b3BpY3Mgd3JpdGU6YnVzX2FwaSByZWFkOnVzZXJfcHJvZmlsZXMiLCJndHkiOiJjbGllbnQtY3JlZGVudGlhbHMifQ.YAunJfjPGZ0UM0an8UI0ISDiE31eWi9LOWUXFT8P_xftn2V0BkOlGpcm6zlMEMS4eR0LAInZS7WY6bfQW7z3Csl7untnrp2EwRh9gQWndcJejf6XizfhEvCwhbAVeS-95sS2vuxsG9WSsAXp6pcrBayzRFPMa5kUzolB1sExeUypkdGI5jR4gDF-NC7B1zHAsseHVyL3SknlDnzSbt0S6rAOX6BEXzaYERgmX5AtIdN4cZ9cwAikQkEj27ZhmYRR4gMaAZLK6sAC9Do7Rbux4yLQwVToAE2S2PQ7ehGHlHveVlCkRx1VGLIBAmsZp9He-t_uWSxU9n7ILDVhMsomTw'
  }
}
