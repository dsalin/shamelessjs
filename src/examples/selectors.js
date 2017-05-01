import EPL from '../index.js'

// create basic event emitters
const [ E1, E2 ] = EPL.EventEmitter.mult(['E1', 'E2'])

// register their events
E1.registerEvents(['Initialized', 'Destroyed'])
E2.registerEvents(['Initialized', 'Destroyed'])

// create plugins
// Note: in AutoRegister mode, plugins cannot have 
// multiple handlers for the same events, that is why we create
// a couple more plugins to show the whole power of selectors
const [ P1, P2, P3, P4 ] = EPL.Plugin.mult(['P1', 'P2', 'P3', 'P4'])

// Listen for all events from 'E1' emitter
P1.on('*', 'E1', data => 
  console.log("Plugin1 - Emitter1 :", data)
)

// Listen for `Initialized` event from All emitters
P2.on('Initialized', '*', data => 
  console.log("Plugin2 - All Emitters:", data)
)

// Did I say we can use RegEx?
// Listen for `Initialized` and `Destroyed` events from emtters that match the RegEx
// Tip: THAT COVERS EVENT EMITTERS CREATED IN THE FUTURE AS WELL! (more on that in the next example)
P3.on(['Initialized', 'Destroyed'], /E/, data => 
  console.log("Plugin3 - Event from /E/ matching emitters: ", data)
)

// Did I say we can use RegEx everywhere?
// Listen for events matching /ed/ from emtters that match the /E/
P4.on(/ed/, /E/, data => 
  console.log("Plugin4 - Event /ed/ from /E/ matching emitters: ", data)
)

E1.emit('Initialized', 'Emitter1')
E2.emit('Initialized', 'Emitter1')
E2.emit('Destroyed', 'Emitter2')
