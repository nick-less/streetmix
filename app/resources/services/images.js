const cloudinary = require('cloudinary')
const config = require('config')
const User = require('../../models/user.js')
const logger = require('../../../lib/logger.js')()

exports.get = async function (req, res) {
  const query = req.query
  const userId = req.userId

  if (!userId) {
    res.status(400).json({ status: 400, msg: 'Please provide user ID.' })
  }

  let user

  try {
    user = await User.findOne({ id: userId })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ status: 400, msg: 'Error finding user.' })
  }

  if (!user) {
    res.status(404).json({ status: 404, msg: 'User not found.' })
    return
  }

  // Is requesting user logged in?
  if (user.login_tokens.indexOf(req.loginToken) === -1) {
    res.status(401).end()
    return
  }

  // If requesting user is logged in, permission granted to receive cloudinary signature.
  let signature
  try {
    signature = await cloudinary.utils.api_sign_request(query, config.cloudinary.api_secret)
  } catch (error) {
    logger.error(error)
    res.status(500).json({ status: 500, msg: 'Error generating signature.' })
  }

  if (!signature) {
    res.status(404).json({ status: 404, msg: 'Signature could not be generated.' })
  }

  const payload = {
    signature: signature,
    timestamp: query.timestamp,
    api_key: config.cloudinary.api_key
  }

  res.status(200).json(payload)
}
