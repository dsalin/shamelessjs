import EPL from '../index.js'

// register basic event emitter
const emitter = new EPL.EventEmitter('Simple')
emitter.registerEvent('Info Log')
emitter.registerEvent('Error Log')

// create simple plugin
const simpleLogger = new EPL.Plugin('Logger')
const simpleSaver = new EPL.Plugin('Saver')
// const mainHandler = new EPL.Plugin('Main')

// Listen for all events from all event emitters
simpleLogger.on('*', '*', data => {
  console.log("Logging (All Events from All event emitters): ", data)
})

// alternative registration for all events handler
simpleLogger.onAll(data => {
  console.log("Logging (All Events from All event emitters) with Alternative: ", data)
})

// throws error directly
simpleLogger.on('*', 'Simple', EPL.utils.wrapPossibleError((first, second) => {
  console.log("This function throws an error", first, second)
  throw new Error('Wants to crash your program')
}))

// Listen for all events from `Simple` event emitter
simpleLogger.on('*', 'Simple', data => {
  console.log("Logging all events from `Simple` event emitter: ", data)
})

// Listen `Info Log` event from all emitters
simpleSaver.on('Info Log', '*', data => {
  console.log("Saving `Info Log` from all event emitters: ", data)
})

// Listen for events that start with `Info` from `Simple` event emitter
simpleLogger.on(/Info Hey/g, 'Simple', data => {
  console.log("Logging `/Info Hey/g` from `Simple` event emitter: ", data)
})

// Listen for events that start with `Info` from event emitters
// whose name starts with `Simple`
simpleLogger.on(/Info/g, /Simple/g, data => {
  console.log("Logging `/Info/g` from /Simple/g event emitter: ", data)
})

// register all plugins
// new EPL.PluginManager([ simpleLogger, simpleSaver ], EPL.EventsManager)

emitter.emit('Info Log', ' --- Log String', ' || Second')
emitter.emit('Error Log', ' --- Error Log String')
