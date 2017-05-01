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
const first = new EPL.Plugin('First')
const second = new EPL.Plugin('Second')
// const main = new EPL.Plugin('Main')

//------------------------------------
first.registerEvent('Initialized')
second.on('Initialized', 'First', () => console.log("SECOND: First Plugin has initialized"))
second.on('Future Event', 'First', () => console.log("SECOND: Future Event emitted here"))

first.emit('Initialized', 'First')
first.registerEvent('Future Event')
first.emit('Future Event', 'First')
console.log('\n\n')
// //------------------------------------

//------------------------------------
// attach to unregistered event emitter
second.on('Future Event', 'Future Emitter', name => console.log("SECOND: Future Event: ", name))
second.on('Future Event', /Future/, name => console.log("SECOND: Future Event: ", name))

const future = new EPL.Plugin('Future Emitter')
const futureProof = new EPL.Plugin('Future Proof')
future.registerEvent('Future Event')
future.emit('Future Event', 'Future')
futureProof.registerEvent('Future Event')
futureProof.emit('Future Event', 'Future Proof')
console.log('\n\n')
//------------------------------------

//------------------------------------
second.on('Future Event', ['AFirst', 'ASecond'], name => console.log("Array Methods", name))

const a1 = new EPL.Plugin('AFirst')
const a2 = new EPL.Plugin('ASecond')

a1.registerEvent('Future Event')
a1.emit('Future Event', 'AFirst')

a2.registerEvent('Future Event')
a2.emit('Future Event', 'ASecond')
console.log('\n\n')
//------------------------------------

second.on(['First', 'Second'], ['AAFirst', 'AASecond'], name => console.log("Array In Arrays Methods", name))

const aa1 = new EPL.Plugin('AAFirst')
const aa2 = new EPL.Plugin('AASecond')

aa1.registerEvents(['First', 'Second'])
aa1.emit('First', 'First - AAFirst')
aa1.emit('Second', 'Second - AAFirst')

aa2.registerEvent('Second')
aa2.emit('Second', 'Second - AASecond')

aa2.registerEvent('First')
aa2.emit('First', 'First - AASecond')
console.log('\n\n')
//------------------------------------

second.on(/REGX/, ['AAAFirst', 'AAASecond'], name => console.log("Array In Arrays Methods", name))

const aaa1 = new EPL.Plugin('AAAFirst')
const aaa2 = new EPL.Plugin('AAASecond')

aaa1.registerEvents(['REGX First', 'REGX Second'])
aaa1.emit('REGX First', 'REGX First - AAAFirst')
aaa1.emit('REGX Second', 'REGX Second - AAAFirst')

aaa2.registerEvent('REGX Second')
aaa2.emit('REGX Second', 'REGX Second - AAASecond')

aaa2.registerEvent('REGX First')
aaa2.emit('REGX First', 'REGX First - AAASecond')
//------------------------------------
