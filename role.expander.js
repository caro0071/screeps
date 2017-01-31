//------------------------------------------------------
/// Helper function to add a new room to the expansions list
///
/// @param {Room} homeRoom **/
/// @param {Room} targetRoom **/

module.exports.designateExpansion = function(homeRoom, targetRoom) {
    
    Memory.rooms[homeRoom].expandTo = targetRoom
};


//------------------------------------------------------
/// Main execute function
///
/// @param {Creep} creep **/

module.exports.execute = function(creep) {
    
    // Assign room to claim
    
    if (creep.memory.targetRoom == undefined) this.assignRoom(creep);

    // Move to the room, claim the controller, and build a spawn
    
    this.captureRoom(creep);
};


//------------------------------------------------------
/// Logic for capturing and securing a room
///
/// @param {Creep} creep **/

module.exports.captureRoom = function(creep) {


    if (creep.room.name != creep.memory.targetRoom) {
        
        // Move to room
        
        this.moveToRoom(creep, creep.memory.targetRoom);
        
    } else {
        
        // Claim the controller
        
        if (!creep.room.controller.my) {
            
            this.claimController(creep);
            
        } else {
            
            // Construct and build a spawn
            
            this.buildSpawn(creep);
        }
    }
}


//------------------------------------------------------
/// Logic for claiming a controller
///
/// @param {Creep} creep **/

module.exports.claimController = function(creep) {
    
    if (creep.room.name != creep.memory.targetRoom) {
        
        // Move to room
        
        this.moveToRoom(creep, creep.memory.targetRoom)
        
    } else {
        
        // Move to controller and claim it
        
        if (creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            
            creep.moveTo(creep.room.controller, {reusePath: 10});
        }
    }
}




//------------------------------------------------------
/// Logic for building a spawn
///
/// @param {Creep} creep **/

module.exports.buildSpawn = function(creep) {
    
    // Switch tasks when appropriate
    
    if (creep.memory.working && creep.carry[RESOURCE_ENERGY] == 0) {
        
        creep.memory.working = false;
        creep.say('Depleted');
        
    } else if (!creep.memory.working && creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
        
        creep.memory.working = true;
        creep.say('Working');
    }
    
    // Construct the spawn
    
    if (creep.memory.working) {
        
        // Look for the spawn flag, construction site, and a completed spawn
        
        var spawnFlag = creep.room.find(FIND_FLAGS, {filter: (f) => {return f.name == 'spawn'}})[0];
        
        if (spawnFlag) var constructionSite = creep.room.lookForAt(LOOK_CONSTRUCTION_SITES, spawnFlag.pos)[0];
        var structure = creep.room.find(FIND_MY_STRUCTURES, {
            filter: (s) => {
                return (s.structureType == STRUCTURE_SPAWN);
            }
        });
        
        if (structure) {
            
            // Once the spawn is complete recycle the creep and remove the room from the expand list
            
            delete Memory.rooms[creep.memory.homeRoom].expandTo;
            creep.memory.role = 'recycle';
            if (spawnFlag) spawnFlag.remove();
            
        } else {
            
            if (constructionSite) {
                
                // Build the spawn
                
                if(creep.build(constructionSite) == ERR_NOT_IN_RANGE) {
                    
                    creep.moveTo(constructionSite, {reusePath: 10});
                }
                
            } else {
                
                // Create the construction site
                
                creep.room.createConstructionSite(spawnFlag.pos, STRUCTURE_SPAWN);
            }
        }
        
    } else {
        
        // Harvest energy
        
        var target = creep.pos.findClosestByPath(FIND_SOURCES);
        
        if (target != null) {
            
            if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
                
                creep.moveTo(target, {reusePath: 10});
            }
        }
    }
}


//------------------------------------------------------
/// Run once function to assign a source to harvest
///
/// @param {Creep} creep **/

module.exports.assignRoom = function(creep) {
    
    creep.memory.homeRoom = creep.room.name;
    creep.memory.targetRoom = creep.room.memory.expandTo;
};


//------------------------------------------------------
/// Move the creep to the specified room
///
/// @param {Creep} creep **/
/// @param {Room} room **/

module.exports.moveToRoom = function(creep, room) {
    
    var route = Game.map.findRoute(creep.room, room);
    
    if(route.length > 0) {
        
        var exit = creep.pos.findClosestByRange(route[0].exit);
        creep.moveTo(exit, {reusePath: 10});
    }
}
