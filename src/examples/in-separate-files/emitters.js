import EPL from '../../index.js'
import plugins from './plugins'

// create basic event emitters
const [ E1, E2 ] = EPL.EventEmitter.mult(['E1', 'E2'])

// register events after AFTER event handlers
E1.registerEvents(['Initialized', 'Destroyed'])
E2.registerEvents(['Initialized', 'Destroyed'])

// Emit all the events
E1.emit('Initialized', 'Some Data')
E2.emit('Initialized', 'Some Other Data')
E2.emit('Destroyed', 'Without Errors')
