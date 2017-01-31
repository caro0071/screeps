//TODO
//  - Task manager that handles distributing tasks - assigns targets for transports to optimize routes?
//  - Track resource claims on containers to avoid congestion on low resources
//  - Cache paths and targets in creep memory

// Cleanup dead stuff

require('garbage');


// Initialize memory

require('init');


// Source roles and structure modules

var roleExpander = require('role.expander');
var roleHarvester = require('role.harvester');
var roleWorker = require('role.worker');
var roleScout = require('role.scout');
var roleTransport = require('role.transport');
var roleRemoteHarvester = require('role.remoteHarvester')
var roleReserver = require('role.reserver');
var roleRecycle = require('role.recycle');
var structureTower = require('structure.tower');
var structureExtension = require('structure.extension'); 


// Execute towers

var towers = Game.spawns.Spawn1.room.find(FIND_STRUCTURES, { filter: (s) => {return s.structureType == STRUCTURE_TOWER}});
for(var tower of towers) {

    structureTower.execute(tower);
}


// Execute creep roles

for(var name in Game.creeps) {
    
    var creep = Game.creeps[name];
    
    switch(creep.memory.role) {
        
        case 'expander':
            
            roleExpander.execute(creep);
            break;
            
        case 'harvester':
            
            roleHarvester.execute(creep);
            break;
            
        case 'scout':
            
            roleScout.execute(creep);
            break;
            
        case 'transport':
            
            roleTransport.execute(creep);
            break;
            
        case 'worker':
            
            roleWorker.execute(creep);
            break;
            
        case 'remoteHarvester':
            
            roleRemoteHarvester.execute(creep);
            break;
            
        case 'reserver':
            
            roleReserver.execute(creep);
            break;
            
        case 'recycle':
            
            roleRecycle.execute(creep);
            break;
            
        defaults:
            
            // No role!
            creep.say("HalpWutdo?");
            break;
    }
}


// Process the spawns

var population = require('population');

for (var name in Game.spawns) {

    var spawn = Game.spawns[name];

    // Auto spawn

    population.autoSpawnCreeps(spawn);
    
    // Place extensions
    
    var numExtensions = spawn.room.find(FIND_STRUCTURES, {filter: (s) => {return s.structureType === STRUCTURE_EXTENSION}}).length
    
    if (numExtensions < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][spawn.room.controller.level]) {
        
        structureExtension.place(spawn);
    }
}
