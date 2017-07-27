const async = require('async')
const debug = require('debug')('meshblu-connector-bash:Runner')
const bindAll = require('lodash/fp/bindAll')
const get = require('lodash/fp/get')
const isEmpty = require('lodash/fp/isEmpty')

class Minimizer {
  constructor({ child_process, commands, deviceId, meshbluFirehose, meshbluHttp }) {
    bindAll(Object.getOwnPropertyNames(Minimizer.prototype), this)

    if (!child_process) throw new Error('Missing required parameter: child_process') // eslint-disable-line camelcase
    if (!commands) throw new Error('Missing required parameter: commands')
    if (!deviceId) throw new Error('Missing required parameter: deviceId')
    if (!meshbluFirehose) throw new Error('Missing required parameter: meshbluFirehose')
    if (!meshbluHttp) throw new Error('Missing required parameter: meshbluHttp')

    this.child_process = child_process // eslint-disable-line camelcase
    this.commands = commands
    this.deviceId = deviceId
    this.meshbluFirehose = meshbluFirehose
    this.meshbluHttp = meshbluHttp
  }

  run(callback) {
    this.meshbluFirehose.on(`configure.sent.${this.deviceId}`, this._onConfigure)
    this.meshbluFirehose.on('message.received.*', this._onMessage)
    this._subscribeToSelf(callback)
  }

  _onConfigure(configureEvent) {
    this.commands = get('data.leftRightOptions.commands', configureEvent)
    debug('_onConfigure', JSON.stringify({ commands: this.commands }))
  }

  _onMessage(message) {
    debug('_onMessage: ', JSON.stringify(message, null, 2))
    const action = get('data.data.action', message)
    const command = get(action, this.commands)
    if (isEmpty(command)) return

    debug('_exec', JSON.stringify({ action, command }, null, 2))
    this.child_process.exec(command, (error, stdout, stderr) => {
      debug('_exec result:', JSON.stringify({ command, stdout, stderr, error: (error || null) }))
    })
  }

  _subscribeToSelf(callback) {
    async.parallel([
      this._subscribeToSelfConfigureReceived,
      this._subscribeToSelfConfigureSent,
      this._subscribeToSelfMessageReceived,
    ], callback)
  }

  _subscribeToSelfConfigureSent(callback) {
    this.meshbluHttp.createSubscription({
      subscriberUuid: this.deviceId,
      emitterUuid: this.deviceId,
      type: 'configure.sent',
    }, callback)
  }

  _subscribeToSelfConfigureReceived(callback) {
    this.meshbluHttp.createSubscription({
      subscriberUuid: this.deviceId,
      emitterUuid: this.deviceId,
      type: 'configure.received',
    }, callback)
  }

  _subscribeToSelfMessageReceived(callback) {
    this.meshbluHttp.createSubscription({
      subscriberUuid: this.deviceId,
      emitterUuid: this.deviceId,
      type: 'message.received',
    }, callback)
  }
}

module.exports = Minimizer
