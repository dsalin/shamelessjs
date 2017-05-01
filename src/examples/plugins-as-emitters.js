/**
* In EPluginize, usually EventEmitters are responsible
* for emitting stuff, however, this is not the only option.
* Plugin are just a subclass of EventEmitter, therefore,
* everything that is possible with EventEmitter is possible
* with Plugin.
* 
* @demo
*/

import EPL from '../index.js'

// construct plugins
const [ first, second, main ] = EPL.Plugin.mult(['First', 'Second', 'Main'])

first.registerEvent('Initialized')
second.registerEvent('Initialized')

second.on('Initialized', 'First', () => console.log("SECOND: First Plugin has initialized"))
first.on('Initialized', 'Second', () => console.log("FIRST: Second Plugin has initialized"))
main.onAll(pname => console.log(`MAIN: Plugin ${pname} has initialized`))

first.emit('Initialized', 'First')
second.emit('Initialized', 'Second')
