import EPL from '../../index.js'

const [ P1, P2, P3, P4 ] = EPL.Plugin.mult(['P1', 'P2', 'P3', 'P4'])

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
