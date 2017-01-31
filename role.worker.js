//------------------------------------------------------
/// Main execute function
///
/// @param {Creep} creep **/

module.exports.execute = function(creep) {
    
    // Switch tasks when appropriate
    
    if (creep.memory.working && creep.carry[RESOURCE_ENERGY] == 0) {
        
        creep.memory.working = false;
        creep.say('Depleted');
        
    } else if (!creep.memory.working && creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
        
        creep.memory.working = true;
        creep.say('Working');
    }
    
    // Behave differently if the room controller is going to downgrade soon
    
    var controllerEmergency = creep.room.controller.ticksToDowngrade <= 2000;
    if (controllerEmergency) creep.say("EMERGENCY!");
    
    // Do work or pickup energy
    
    if(creep.memory.working) {
        
        // Handle a controller emergency first
        // Otherwise do the assigned job or generic work
        
        if (controllerEmergency) {
            
            this.upgradeController(creep);
            
        } else {
            
            this.doWork(creep);
        }
        
    } else {
        
        this.pickupEnergy(creep, controllerEmergency);
    }
}


//------------------------------------------------------
/// Logic for picking up energy
///
/// @param {Creep} creep **/

module.exports.pickupEnergy = function(creep, controllerEmergency) {
    
    // Pull from the controller storage
    
    var controllerContainers = creep.room.controller.pos.findInRange(FIND_STRUCTURES, 5, {
        filter: (s) => {
            return (((s.structureType == STRUCTURE_CONTAINER) || (s.structureType == STRUCTURE_STORAGE)) && (s.store[RESOURCE_ENERGY] > 0));
        }
    });
        
    var target = creep.pos.findClosestByPath(controllerContainers);
    
    // In the event of an emergency pull from an extension if the controller storage is empty
    
    if ((target == null) && controllerEmergency) {
        
        storage = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION && creep.room.energyAvailable);
            }
        });
        
        if (storage != null) {
            
            if (creep.withdraw(storage, RESOURCE_ENERGY, 50) == ERR_NOT_IN_RANGE) {
                
                creep.moveTo(storage, {reusePath: 10});
            }
        }
    }
    
    // Otherwise help empty full containers
    
    if (target == null) {
        
        var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => {
                return ((s.structureType == STRUCTURE_CONTAINER) && (_.sum(s.store) >= s.storeCapacity*.9));
            }
        });
    }
    
    // Withdraw energy
    
    if (target != null) {
        
        if(creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        
            creep.moveTo(target, {reusePath: 10});
        }
        
    } else {
        
        // If all else fails try to harvest some energy
        
        var target = creep.pos.findClosestByPath(FIND_SOURCES);
        
        if (target != null) {
            
            if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
                
                creep.moveTo(target, {reusePath: 10});
            }
        }
    }
}


//------------------------------------------------------
/// Logic for doing work
///
/// @param {Creep} creep **/

module.exports.doWork = function(creep) {
    
    // Load jobs
    
    var wallbitch = require('role.worker.wallbitch');
    var repairman = require('role.worker.repairman');
    
    // Check if a job needs to be done and no current job assignment
    
    if (this.numCreepsWithJob(creep.room, 'wallbitch') < 1 && wallbitch.hasWork(creep.room)) {
        
        this.assignJob(creep, 'wallbitch');
        
    } else if (this.numCreepsWithJob(creep.room, 'repairman') < 1 && repairman.hasWork(creep.room)) {
        
        this.assignJob(creep, 'repairman');
    }
    
    // Perform job or generic work
    
    switch (creep.memory.job) {
        
        case 'wallbitch':
            
            wallbitch.doWork(creep);
            break;
            
        case 'repairman':
            
            repairman.doWork(creep);
            break;
            
        default:
            
            var nearbyContainers = creep.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: (s) => {
                    return (s.structureType == STRUCTURE_CONTAINER);
                }
            });
            
            var damagedStructures = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    return ((s.hits / s.hitsMax) < .75) && (s.structureType != STRUCTURE_RAMPART) && (s.structureType != STRUCTURE_WALL);
                }
            });
            
            damagedStructures.sort(function(a,b) {return a.hits/a.hitsMax - b.hits/b.hitsMax});
            
            // Check container health and repair if it is low
                
            if ((nearbyContainers.length > 0) && ((nearbyContainers[0].hits / nearbyContainers[0].hitsMax) < .9)) {
                
                if (creep.repair(nearbyContainers[0])) {
                    
                    creep.moveTo(nearbyContainers[0], {reusePath: 10});
                }
                
            // Repair damaged structures
            
            } else if (damagedStructures.length > 0) {
                
                if (creep.repair(damagedStructures[0])) {
                    
                    creep.moveTo(damagedStructures[0], {reusePath: 10});
                }
                
            // Build construction sites
            
            } else {
                
                var target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                
                if (target != undefined) {
                    
                    if (creep.build(target) == ERR_NOT_IN_RANGE) {
                        
                        creep.moveTo(target, {reusePath: 10});
                        
                    }
                    
                } else {
                    
                    this.upgradeController(creep);
                }
            }
            
            break;
    }
}


//------------------------------------------------------
/// Function to move to and upgrade the room controller
///
/// @param {Creep} creep **/

module.exports.upgradeController = function(creep) {
    
    if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        
        creep.moveTo(creep.room.controller, {reusePath: 10});
    }
}


//------------------------------------------------------
/// Function to move to count number of creeps currently assigned the specified job
///
/// @param {Creep} creep **/

module.exports.numCreepsWithJob = function(room, job) {
    
    var workers = room.find(FIND_MY_CREEPS, {
        filter: (c) => {
            return (c.memory.job === job);
        }
    });
    
    return workers.length;
}


//------------------------------------------------------
/// Function to assign creep a new job
///
/// @param {Creep} creep
/// @param {Job} job **/

module.exports.assignJob = function(creep, job) {
    
    creep.memory.job = job;
}