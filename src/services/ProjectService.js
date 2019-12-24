/*
 * Project Service
 */

const config = require('config')
const request = require('superagent')
const helper = require('../common/helper')

/**
 * Get a project.
 *
 * @param {String} id the project id
 * @returns {Promise} the project data
 */
async function getProject (id) {
  const token = await helper.getM2MToken()
  const res = await request.get(`${config.PROJECTS_API}/projects/${id}`)
    .set({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    })
  return res.body
}

/**
 * Update a project.
 *
 * @param {String} id the project id
 * @param {Object} data the project patch data
 * @returns {Promise} the updated project data
 */
async function updateProject (id, data) {
  const token = await helper.getM2MToken()
  const res = await request.patch(`${config.PROJECTS_API}/projects/${id}`)
    .set({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    })
    .send(data)
  return res.body
}

module.exports = {
  getProject,
  updateProject
}
