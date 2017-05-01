import EPL from '../index.js'

// create basic event emitters
const [ E1, E2 ] = EPL.EventEmitter.mult(['E1', 'E2'])

// create plugins
// Note: in AutoRegister mode, plugins cannot have 
// multiple handlers for the same events, that is why we create
// a couple more plugins to show the whole power of selectors
const [ P1, P2, P3, P4 ] = EPL.Plugin.mult(['P1', 'P2', 'P3', 'P4'])

// Here we register event handlers before we even know exactly
// what events will be available in the future
// 
// For convenience, this refers to plugin object itself, so you don't
// need to worry about those

P1.on('*', 'E1', function (data, eventName, emitterName) {
  console.log(this.name, "Emitter1 :", data, ' | Emitter: ', emitterName, ' | Event:', eventName)
})

P2.on('Initialized', '*', function(data, eventName, emitterName) {
  console.log(this.name, "- All Emitters:", data, ' | Emitter: ', emitterName, ' | Event:', eventName)
})

P3.on(['Initialized', 'Destroyed'], /E/, function(data, eventName, emitterName) {
  console.log(this.name, "- Event from /E/: ", data, ' | Emitter:', emitterName, ' | Event:', eventName)
})

P4.on(/ed/, /E/, function(data, eventName, emitterName) {
  console.log(this.name, "- Event /ed/ from /E/: ", data, ' | Emitter:', emitterName, 'Event:', eventName)
})

// register events after AFTER event handlers
E1.registerEvents(['Initialized', 'Destroyed'])
E2.registerEvents(['Initialized', 'Destroyed'])

// Emit all the events
E1.emit('Initialized', 'Some Data')
E2.emit('Initialized', 'Some Other Data')
E2.emit('Destroyed', 'Without Errors')
