//------------------------------------------------------
/// Main execute function
///
/// @param {Creep} creep **/

module.exports.execute = function(creep) {
    
    // Switch tasks when appropriate
    
    if (creep.memory.collecting && (creep.carry[RESOURCE_ENERGY] == creep.carryCapacity)) {
        
        creep.memory.collecting = false;
        creep.say("Drop'n Off");
        
    } else if (!creep.memory.collecting && (creep.carry[RESOURCE_ENERGY] == 0)) {
        
        creep.memory.collecting = true;
        creep.say("Picking Up");
    }
    
    // Pick-up or deliver energy
    
    if (creep.memory.collecting) {
        
        this.pickupEnergy(creep);
        
    } else {
        
        this.storeEnergy(creep);
    }
}


//------------------------------------------------------
/// Pickup Energy
///
/// @param {Creep} creep **/

module.exports.pickupEnergy = function(creep) {
    
    // Pickup dropped energy OR energy from the fullest container
        
    var target = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY);
    if (target) {
        
        if(creep.pickup(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            
            creep.moveTo(target, {reusePath: 10});
        }
        
    } else {

        // When spawn or extensions need energy get the closest energy available
        
        if (creep.room.energyAvailable < creep.room.energyCapacityAvailable) {
            
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => {
                    return (((s.structureType == STRUCTURE_CONTAINER) || (s.structureType == STRUCTURE_STORAGE)) && (s.store[RESOURCE_ENERGY] > 50));
                }
            });
        }
        
        // Empty the link by the storage container if it exists
        
        if (!target) {
            
            if (creep.room.storage) {
                
                target = creep.room.storage.pos.findInRange(FIND_STRUCTURES, 1, {
                    filter : (s) => {
                        return ((s.structureType == STRUCTURE_LINK) && (s.energy > 0));
                    }
                })[0];
            }
        }
        
        // Find the containers near sources and sort by fullest
        
        if (!target) {
            
            var containers = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    return ((s.structureType == STRUCTURE_CONTAINER) && (s.store[RESOURCE_ENERGY] > 0) && (s.pos.findInRange(FIND_SOURCES, 5).length > 0));
                }
            });
            
            containers.sort(function(a,b) {return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]});
            
            if (containers.length > 0) var target = containers[0];
        }
        
        if (target) {
            
            // Stop collecting if the target is a container that has less than half the transports capacity and the transport has more than 50 energy
            
            if (target.structureType == STRUCTURE_CONTAINER) {
                
                if ((target.store[RESOURCE_ENERGY] < Math.min((creep.carryCapacity * .5), 800)) && (creep.carry[RESOURCE_ENERGY] >= 50)) {
                    
                    creep.memory.collecting = false;
                }
            }
            
            // Otherwise move to and withdraw energy
            
            if(creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                
                creep.moveTo(target, {reusePath: 10});
            }
        }

    }
}


//------------------------------------------------------
/// Store energy
///
/// @param {Creep} creep **/

module.exports.storeEnergy = function(creep) {
    
    // Fill up spawn and extensions first
    
    var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => {
            return ((s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN) &&
                    s.energy < s.energyCapacity);
        }
    });
    
    // Next keep towers 90% full
        
    if (target == null) {
        
        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => {
                return ((s.structureType == STRUCTURE_TOWER) && ((s.energy/s.energyCapacity) < .90));
            }
        });
    }
    
    // Finally fill up the containers by the controller
    // If they are already full then wait there
        
    if (target == null) {
        
        var controllerContainers = creep.room.controller.pos.findInRange(FIND_STRUCTURES, 5, {
            filter: (s) => {
                return (((s.structureType == STRUCTURE_CONTAINER) || (s.structureType == STRUCTURE_STORAGE)) && (_.sum(s.store) < s.storeCapacity));
            }
        });
        
        target = creep.pos.findClosestByPath(controllerContainers);
    }
    
    if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        
        creep.moveTo(target, {reusePath: 10});
    }

}
