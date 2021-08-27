module.exports = {
  app_host_port: process.env.APP_DOMAIN || 'streetmix.net',
  restapi: {
    protocol: process.env.PROTOCOL || 'https://',
    baseuri: '/api'
  }
}
