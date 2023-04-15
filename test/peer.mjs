import Hyperswarm from 'hyperswarm'
import goodbye from 'graceful-goodbye'
import crypto from 'hypercore-crypto'
import b4a from 'b4a'
const {
  createHash,
} = await import('node:crypto');
import * as dotenv from 'dotenv'
dotenv.config()

const COMMAND = process.env.command
const COMMANDED = process.env.commanded
const ITEM = process.env.item
const ITEMS = process.env.items

const account = {
  seed: process.argv[2] ? b4a.from(process.argv[2], 'hex') : crypto.randomBytes(32),
  alias: process.argv[3] ?? crypto.randomBytes(8).toString('hex'),
  [ITEMS]: 3
}

const swarm = new Hyperswarm({seed: account.seed})
goodbye(() => swarm.destroy())

account.publicKey = b4a.toString(swarm.keyPair.publicKey, 'hex')

// Keep track of all connections and console.log incoming data
const conns = []
swarm.on('connection', conn => {
  const name = b4a.toString(conn.remotePublicKey, 'hex')
  console.log('* got a connection from:', name, '*')
  conns.push(conn)
  conn.once('close', () => conns.splice(conns.indexOf(conn), 1))
  conn.on('data', data => console.log(`${name}: ${data}`))
  conn.on('error', console.error)
})

// Broadcast stdin to all connections
process.stdin.on('data', d => {
  const data = handleData(d)
  if (data) {
  console.log(`${account.alias}:`, b4a.toString(d, 'utf-8'))
  for (const conn of conns) {
    conn.write(data)
  }
  }
})

// Join a common topic
const topic = process.argv[4] ?? crypto.randomBytes(32).toString('hex')
const discovery = swarm.join(createHash('sha256').update(process.argv[4], 'utf-8').digest(), { client: true, server: true })

// The flushed promise will resolve when the topic has been fully announced to the DHT
discovery.flushed().then(() => {
  console.log('joined topic:', topic)
})

function handleData(data) {
  const message = b4a.toString(data, 'utf-8')
  if (message.startsWith(`!`)) {
    const args = message.split(' ')
    const item = args[1]
    const recipient = args[2]
    console.log(COMMAND)
    console.log('message:', message)
    if (message.startsWith(`!${COMMAND}`)) {
    if (item == ITEM) {
      if (account[ITEMS] > 0) {
        account[ITEMS]--
        return `(${COMMANDED} ${recipient} a ${ITEM})`
      } else {
        console.log(`No more ${ITEMS} left to ${COMMAND}`)
      }
    } else {
      console.log(`Can only ${COMMAND} ${ITEMS}`)
    }
    } else {
      console.log('Unsupported command')
    }
  } else {
    return data
  }
}
