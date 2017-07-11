#!/usr/bin/env node

const child_process = require('child_process') // eslint-disable-line camelcase
const MeshbluConfig = require('meshblu-config')
const MeshbluFirehose = require('meshblu-firehose-socket.io')
const MeshbluHttp = require('meshblu-http')
const Connector = require('./src/Connector')

class Command {
  constructor() {
    const meshbluConfig = new MeshbluConfig()
    const meshbluFirehose = new MeshbluFirehose({ meshbluConfig: meshbluConfig.toJSON() })
    const meshbluHttp = new MeshbluHttp(meshbluConfig.toJSON())
    this.connector = new Connector({ child_process, meshbluHttp, meshbluFirehose })
  }

  static panic(error) {
    console.error(error.stack) // eslint-disable-line no-console
    process.exit(1)
  }

  panicIfError(error) {
    if (!error) return
    this.panic(error)
  }

  run() {
    this.connector.run((error) => {
      if (error) this.panic(error)
    })
  }
}

if (require.main === module) {
  const command = new Command({ argv: process.argv })
  command.run()
}

module.exports = Command
