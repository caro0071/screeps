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
    
    var source = Game.getObjectById(creep.memory.source);
        
    if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        
        creep.moveTo(source, {reusePath: 10});
    }
}


//------------------------------------------------------
/// Logic for storing energy
///
/// @param {Creep} creep **/

module.exports.storeEnergy = function(creep) {
    
    var transports = creep.room.find(FIND_MY_CREEPS, {
        filter: (c) => {
            return (c.memory.role == 'transport');
        }
    })
    
    var nearbyContainers = Game.getObjectById(creep.memory.source).pos.findInRange(FIND_STRUCTURES, 2, {
        filter: (s) => {
            return (s.structureType == STRUCTURE_CONTAINER);
        }
    });
    
    var target = null;
    
    // If no transports or no nearby containers, first try to store in the extensions/spawn
    
    if ((transports.length == 0) || (nearbyContainers.length == 0)) {
        
        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => {
                return ((s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN) && (s.energy < s.energyCapacity));
            }
        });
    }
    
    // Otherwise store in the container by the assigned source
    // Periodically repair the container if it drops below 90%
        
    if (target == null) {
        
        // Check container health
        
        if ((nearbyContainers.length > 0) && (nearbyContainers[0].hits / nearbyContainers[0].hitsMax) < .9) {
            
            if (creep.repair(nearbyContainers[0])) {
            
                creep.moveTo(nearbyContainers[0], {reusePath: 10});
            }
            
            return;
        }
        
        // Otherwise make sure it is not already full
        
        target = creep.pos.findClosestByPath(nearbyContainers, {
            filter: (s) => {
                return (_.sum(s.store) < s.storeCapacity);
            }
        });
    }
    
    // Store energy if a valid target was found
    
    if (target != null) {
        
        if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        
            creep.moveTo(target, {reusePath: 10});
        }
        
    // Otherwise look for a container construction site to build by the assigned source 
    
    } else {
        
        var target = Game.getObjectById(creep.memory.source).pos.findInRange(FIND_CONSTRUCTION_SITES, 2, {
        filter: (s) => {
            return (s.structureType == STRUCTURE_CONTAINER);
        }
        })[0];
        
        // Otherwise if the source container is already constructed then help the workers build the container by the controller
        
        var target = creep.room.controller.pos.findInRange(FIND_CONSTRUCTION_SITES, 3, {
        filter: (s) => {
            return (s.structureType == STRUCTURE_CONTAINER);
        }
        })[0];
        
        if (target != null) {
            
            var err = creep.build(target);
            
            if(err == ERR_NOT_IN_RANGE) {
                
                creep.moveTo(target, {reusePath: 10});
            }
        }
    }
}

//------------------------------------------------------
/// Run once function to assign source to harvest
///
/// @param {Creep} creep **/
module.exports.assignSource = function(creep) {
    
    // Loop through sources starting with the closest source and count number of harvesters and total
    // WORK body parts on each source to determine where to assign this harvester
    
    var sources = _.sortBy(creep.room.find(FIND_SOURCES), s => creep.pos.getRangeTo(s));
    
    for (var source of sources) {
        
        var harvesters = creep.room.find(FIND_MY_CREEPS, {
            filter: (c) => {
                return ((c.memory.role == 'harvester') && (c.memory.source == source.id));
            }
        });
        
        var activeWork = 0;
        
        for (var harvester of harvesters) {
            
            activeWork += harvester.getActiveBodyparts(WORK);
        }
        
        // Assign harvester to current source if:
        //   (1) It still has empty spaces around it
        //   (2) Current harvesters have less than 5 WORK parts (max)
        
        if ((harvesters.length < creep.room.memory.source[source.id].numFreespaces) && (activeWork < 5)) {
            
            creep.memory.source = source.id;
            
            // Try to place a container; if it already exists the call will error out but we don't care.
            var r = creep.room.createConstructionSite(creep.room.memory.source[source.id].container.x,
                                              creep.room.memory.source[source.id].container.y,
                                              STRUCTURE_CONTAINER);
            break;                        
        }
    }
};