//------------------------------------------------------
/// Main execute function
///
/// @param {Creep} creep **/

module.exports.execute = function(creep) {
    
    // Find a source that can be mined (do once per creep)
    
    if (creep.memory.source == undefined) this.assignSource(creep);

    // Switch tasks when appropriate
    
    if (creep.memory.harvesting && creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
        
        creep.memory.harvesting = false;
        creep.say('Storing');
        
    } else if (!creep.memory.harvesting && creep.carry[RESOURCE_ENERGY] == 0) {
        
        creep.memory.harvesting = true;
        creep.say('Harvesting');
    }
    
    // Harvest or store energy
    
    if (creep.memory.harvesting) {
        
        this.harvestEnergy(creep);
        
    } else {
        
        this.storeEnergy(creep);
    }
};


//------------------------------------------------------
/// Logic for gathering energy
///
/// @param {Creep} creep **/

module.exports.harvestEnergy = function(creep) {
    
    if (creep.room.name != creep.memory.sourceRoom) {
        
        // Move to room
        
        this.moveToRoom(creep, creep.memory.sourceRoom)
        
    } else {
        
        // Move to source and harvest it
        
        var source = Game.getObjectById(creep.memory.source);
        
        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            
            creep.moveTo(source, {reusePath: 10});
        }
    }
}


//------------------------------------------------------
/// Logic for storing energy
///
/// @param {Creep} creep **/

module.exports.storeEnergy = function(creep) {
    
    // Build roads within range of the creep
    
    var target = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1)[0];
    
    if (target != null) creep.build(target);
    
    // Repair road under creep if it is damaged

    if (target == null) {
        
        target = creep.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: (s) => {
                return ((s.hits / s.hitsMax) < .9) && (s.structureType != STRUCTURE_RAMPART) && (s.structureType != STRUCTURE_WALL);
            }
        })[0];
    }
        
    if (target != null) creep.repair(target);

    // Move to home spawn
    
    if (target == null) {
        
        if (creep.room.name != creep.memory.homeRoom) {
        
            // Move to room
            
            this.moveToRoom(creep, creep.memory.homeRoom)
            
        } else {
            
            // Move to room storage container and drop off energy
            // If we pass a link on the way try to store in it instead and transfer to the link by the storage container
            
            target = creep.pos.findInRange(FIND_STRUCTURES, 1, {
                filter : (s) => {
                    return ((s.structureType == STRUCTURE_LINK));
                }
            })[0];
            
            if (target) {
                
                // Store in link and transfer to main storage link when it's full
                
                creep.transfer(target, RESOURCE_ENERGY);
                
                if (target.energy == target.energyCapacity) {
                    
                    storageLink = creep.room.storage.pos.findInRange(FIND_STRUCTURES, 1, {
                        filter : (s) => {
                            return ((s.structureType == STRUCTURE_LINK) && (s.energy < s.energyCapacity));
                        }
                    })[0];
                    
                    if (storageLink) target.transferEnergy(storageLink);
                }
                
                target = null;
            }
            
            // Store in storage container
            
            target = creep.room.storage;
            
            if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                
                creep.moveTo(target, {reusePath: 10});
            }
        }
    }
}


//------------------------------------------------------
/// Run once function to assign a source to harvest
///
/// @param {Creep} creep **/

module.exports.assignSource = function(creep) {
    
    // Remember the home room
    
    creep.memory.homeRoom = creep.room.name;

    // Look through adjacent room's sources looking for one that currently don't have a remote harvester on it
    
    var currentRoomMemory = creep.room.memory;
    
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
                
                if (numHarvesters < currentRoomMemory.adjacentRooms[r].source[s].numFreespaces) {
                    
                    creep.memory.sourceRoom = r;
                    creep.memory.source = s;
                    break;
                }
            }
        }
        
        // Break out if the creep was assigned a source
        
        if (creep.memory.source != undefined) break;
    }
};


//------------------------------------------------------
/// Move the creep to the specified room (must be adjacent [I think])
///
/// @param {Creep} creep **/
/// @param {Room} room **/

module.exports.moveToRoom = function(creep, room) {
    
    var exitDir = Game.map.findExit(creep.room, room);
    var exit = creep.pos.findClosestByPath(exitDir);
    creep.moveTo(exit, {reusePath: 10});
}
