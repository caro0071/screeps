//------------------------------------------------------
/// Main execute function
///
/// @param {Spawn} spawn **/

module.exports.autoSpawnCreeps = function(spawn) {
    
    var roles = ['harvester', 'transport', 'worker', 'scout', 'remoteHarvester', 'reserver', 'expander'];
    
    // Loop through all roles in order of importance
    
    for(var i in roles) {
        
        var role = roles[i];
        
        var creeps = spawn.room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
                return creep.memory.role == role;
            }
        });
        
        var spawnCreep = false;
        
        switch(role) {
            
            case 'expander':
                
                spawnCreep = this.canSpawnExpander(spawn);
                break;
                
            case 'harvester':
                
                spawnCreep = this.canSpawnHarvester(spawn);
                break;
                
            case 'remoteHarvester':
            
                spawnCreep = this.canSpawnRemoteHarvester(spawn);
                break;
                
            case 'reserver':
                
                spawnCreep = this.canSpawnReserver(spawn);
                break;
                
            case 'transport':
                
                spawnCreep = this.canSpawnTransport(spawn, creeps);
                break;
                
            case 'worker':
                
                spawnCreep = this.canSpawnWorker(spawn, creeps);
                if (spawnCreep) spawn.memory.lastWorkerSpawnTime = Game.time;
                break;
                
            case 'scout':
                
                spawnCreep = this.canSpawnScout(spawn, creeps);
                break;
        }
        
        // Spawn the largest possible creep if not at the maximum
        
        if (spawnCreep) {
            
            var creepParts = this.getMaxCreepParts(spawn, role);
            spawn.createCreep(creepParts, null, {'role': role, "homeRoom": spawn.room.name});
            break;
        }
    }
}


//------------------------------------------------------
/// Get largest allowed creep for specified role
///
/// @param {Spawn} spawn **/
/// @param {Role} role **/

module.exports.getMaxCreepParts = function(spawn, role) {
    
    var numIncr = Math.floor((spawn.room.energyAvailable - Memory.creepSpecs[role].base.cost) / Memory.creepSpecs[role].incr.cost);
    if (numIncr > Memory.creepSpecs[role].maxIncr) numIncr = Memory.creepSpecs[role].maxIncr;
    var creepParts = Memory.creepSpecs[role].base.parts;
    
    for (var n = 0; n < numIncr; ++n) {
        
        creepParts = creepParts.concat(Memory.creepSpecs[role].incr.parts);
    }
    
    return creepParts;
}


//------------------------------------------------------
/// Decide if an expander should be spawned
///
/// @param {Spawn} spawn **/

module.exports.canSpawnExpander = function(spawn) {
    
    rc = false;
    
    // Look through adjacent rooms looking for one that currently doesn't have a reserver in it

    if (spawn.room.memory.expandTo) {
        
        var numExpanders = 0;
        
        for (c in Game.creeps) {
            
            if ((Game.creeps[c].memory.role == 'expander') &&
                (Game.creeps[c].memory.homeRoom == spawn.room.name) &&
                (Game.creeps[c].memory.targetRoom == spawn.room.memory.expandTo)) {
                
                ++numExpanders;
            }
        }
        
        if (numExpanders < 3) {
            
            rc = true;
        }
    }
    
    // Build up to two expanders to expand
    
    return rc;
}


//------------------------------------------------------
/// Decide if a harvester should be spawned
///
/// @param {Spawn} spawn **/

module.exports.canSpawnHarvester = function(spawn) {
    
    var rc = false
    
    // Loop through sources checking if more harvesters are needed.  Stop immediately if a creep can be spawned.
    
    for (var source of spawn.room.find(FIND_SOURCES)) {
        
        var harvesters = spawn.room.find(FIND_MY_CREEPS, {
            filter: (c) => {
                return ((c.memory.role == 'harvester') && (c.memory.source == source.id));
            }
        });
        
        var activeWork = 0;
        
        for (var harvester of harvesters) {
            
            activeWork += harvester.getActiveBodyparts(WORK);
        }
        
        // Spawn a harvester if there are open spaces around a source or if it is not already at max WORK
        
        if ((harvesters.length < spawn.room.memory.source[source.id].numFreespaces) && (activeWork < 5) && (harvesters.length < 3)) {
            
            rc = true; 
            break;
        }
    }

    return rc;
}


//------------------------------------------------------
/// Decide if a remote harvester should be spawned
///
/// @param {Spawn} spawn **/

module.exports.canSpawnRemoteHarvester = function(spawn) {
    
    var rc = false
    
    // Look through adjacent room's and look for an unoccupied source
                    
    var currentRoomMemory = spawn.room.memory;
    
    for (r in currentRoomMemory.adjacentRooms) {
        
        if (currentRoomMemory.adjacentRooms[r].enableRemoteMining) {
            
            for (s in currentRoomMemory.adjacentRooms[r].source) {
                
                // Loop through all creeps checking remoteHarvesters with this source assigned
                
                var numHarvesters = 0;
                
                for (c in Game.creeps) {
                    
                    if ((Game.creeps[c].memory.role == 'remoteHarvester') &&
                        (Game.creeps[c].memory.source == s)) {
                        
                        ++numHarvesters;
                    }
                }
                
                // If it is not claimed then a remote harvester can be spawned
                
                //if ((numHarvesters < currentRoomMemory.adjacentRooms[r].source[s].numFreespaces) &&
                if ((numHarvesters < 1) &&
                    (spawn.room.storage != null)) {
                    
                    rc = true;
                    break;
                }
            }
        }
        
        // Breakout early if an unoccupied source was found
        
        if (rc) break;
    }
    
    return rc;
}



//------------------------------------------------------
/// Decide if a reserver should be spawned
///
/// @param {Spawn} spawn **/

module.exports.canSpawnReserver = function(spawn) {
    
    var rc = false
    
    // Look through adjacent rooms looking for one that currently doesn't have a reserver in it

    var currentRoomMemory = spawn.room.memory;
    
    for (r in currentRoomMemory.adjacentRooms) {
        
        if (currentRoomMemory.adjacentRooms[r].enableRemoteMining) {
            
            // Loop through all creeps checking for reservers with this room assigned
            
            var numReservers = 0;
            
            for (c in Game.creeps) {
                
                if ((Game.creeps[c].memory.role == 'reserver') &&
                    (Game.creeps[c].memory.targetRoom == r)) {
                    
                    ++numReservers;
                }
            }
        }
        
        // If it is not being reserved then spawn a reserver
        
        if (numReservers < 1) {
            
            rc = true;
            break;
        }
    }
    
    return rc;
}



//------------------------------------------------------
/// Decide if a scout should be spawned
///
/// @param {Spawn} spawn **/
/// @param {Creeps} creeps **/

module.exports.canSpawnScout = function(spawn, creeps) {
    
    var rc = false
    
    // Check if there are unscouted rooms. Only allow one scout at a time.
    
    if ((spawn.room.controller.level >= 4) && !spawn.room.memory.adjacentRoomsScouted && (creeps.length < 1)) {
        
        for (r in spawn.room.memory.adjacentRooms) {
            
            if (!spawn.room.memory.adjacentRooms[r].scouted) {
                
                rc = true;
                break;
            }
        }
        
        if (!rc) {
            
            spawn.room.memory.adjacentRoomsScouted = true;
        }
    }
    
    return rc;
}


//------------------------------------------------------
/// Decide if a transport should be spawned
/// Spawn a transport for each source container once there's at least one source container and a controller container
///
/// @param {Spawn} spawn **/
/// @param {Creeps} creeps **/

module.exports.canSpawnTransport = function(spawn, creeps) {

    var controllerStorage = spawn.room.controller.pos.findInRange(FIND_STRUCTURES, 3, {
        filter: (s) => {
            return (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE);
        }
    });

    var totalContainers = spawn.room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE;
        }
    });
    
    var numSourceContainers = totalContainers.length - controllerStorage.length;
    return ((controllerStorage.length >  0) && (creeps.length < numSourceContainers));
}


//------------------------------------------------------
/// Decide if a worker should be spawned
///
/// @param {Spawn} spawn **/
/// @param {Creeps} creeps **/

module.exports.canSpawnWorker = function(spawn, creeps) {

    var rc = false

    // Restrict maximum spawn rate to 200 ticks
    
    if (!spawn.memory.lastWorkerSpawnTime) spawn.memory.lastWorkerSpawnTime = 0;
    
    if ((Game.time - spawn.memory.lastWorkerSpawnTime) > 100) {
        
        var storage = spawn.room.find(FIND_STRUCTURES, {
            filter: (s) => {
                return (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE);
            }
        });
        
        var totalEnergy = 0;
        for (c of storage) {
            totalEnergy += c.store[RESOURCE_ENERGY];
        };
        
        // Sum work parts (including parts for a newly spawned creep)
        
        var numWorkParts = 0;
        for (var c of creeps) {
            
            numWorkParts += c.getActiveBodyparts(WORK);
        }
        
        for (p of this.getMaxCreepParts(spawn, 'worker')) {
            
            numWorkParts += (p == WORK) ? 1 : 0;
        }
        
        // A creep can be spawned if there aren't any workers or if the total energy in the room is more than 100 * active work parts
        
        rc = ((creeps.length < 1) || (totalEnergy/numWorkParts > (100 * spawn.room.controller.level)));
    }
    
    return rc;
}
