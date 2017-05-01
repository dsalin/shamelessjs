/**
* By default, all events in NodeJS are emitted synchronously.
* This might not be the desired behaviour in majority of ways, therefore
* `EventEmitter.emitAsync` is introduced.
* 
* @demo
*/

import EPL from '../index.js'

// register basic event emitter
const emitter = new EPL.EventEmitter('Test')
emitter.registerEvent('Long Async')
emitter.registerEvent('Long Sync')

console.log("Emitter events: ", emitter.events)

// create simple plugin
const _sync = new EPL.Plugin('Sync')
const _async = new EPL.Plugin('Async')

_sync.on('Long Sync', 'Test', () => console.log("Sync method"))
_async.on('Long Async', 'Test', () => console.log("Async method"))

// register all plugins
new EPL.PluginManager([ _sync, _async ], EPL.EventsManager)

emitter.emitAsync('Long Async')
emitter.emit('Long Sync')
emitter.emit('Long Sync')
