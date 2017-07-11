const debug = require('debug')('meshblu-connector-bash:Connector')
const bindAll = require('lodash/fp/bindAll')
const getOr = require('lodash/fp/getOr')

const Bash = require('./Bash')

class Connector {
  constructor({ child_process, meshbluHttp, meshbluFirehose }) {
    bindAll(Object.getOwnPropertyNames(Connector.prototype), this)

    if (!child_process) throw new Error('Missing required parameter: child_process') // eslint-disable-line camelcase
    if (!meshbluFirehose) throw new Error('Missing required parameter: meshbluFirehose')
    if (!meshbluHttp) throw new Error('Missing required parameter: meshbluHttp')

    this.child_process = child_process // eslint-disable-line camelcase
    this.meshbluHttp = meshbluHttp
    this.meshbluFirehose = meshbluFirehose
  }

  run(callback) {
    debug('run')
    this.meshbluFirehose.connect()
    this.meshbluHttp.whoami((error, device) => {
      if (error) return callback

      this._startBash(device, callback)
    })
  }

  _startBash(device, callback) {
    const { child_process, meshbluFirehose, meshbluHttp } = this
    const { commands } = getOr({}, 'leftRightOptions', device)
    const deviceId = device.uuid

    if (!commands) {
      debug('no commands found, skipping Bash')
      return callback()
    }

    const bash = new Bash({ child_process, commands, deviceId, meshbluFirehose, meshbluHttp })
    bash.run(callback)
  }
}

module.exports = Connector
