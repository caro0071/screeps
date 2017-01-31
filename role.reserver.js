//------------------------------------------------------
/// Main execute function
///
/// @param {Creep} creep **/

module.exports.execute = function(creep) {
    
    // Find an adjacent room to reserve
    
    if (creep.memory.targetRoom == undefined) this.assignRoom(creep);

    // Move to other room and reserve the controller
    
    this.reserveController(creep);
};


//------------------------------------------------------
/// Logic for moving to and reserving a controller
///
/// @param {Creep} creep **/

module.exports.reserveController = function(creep) {
    
    if (creep.room.name != creep.memory.targetRoom) {
        
        // Move to room
        
        this.moveToRoom(creep, creep.memory.targetRoom)
        
    } else {
        
        // Move to controller and reserve it
        
        if (creep.reserveController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            
            creep.moveTo(creep.room.controller, {reusePath: 10});
        }
    }
}


//------------------------------------------------------
/// Run once function to assign a source to harvest
///
/// @param {Creep} creep **/

module.exports.assignRoom = function(creep) {
    
    // Remember the home room
    
    creep.memory.homeRoom = creep.room.name;

    // Look through adjacent rooms looking for one that currently doesn't have a reserver in it
    
    var currentRoomMemory = creep.room.memory;
    
    for (r in currentRoomMemory.adjacentRooms) {
        
        // Loop through all creeps checking for reservers with this room assigned
        
        var numReservers = 0;
        
        for (c in Game.creeps) {
            
            if ((Game.creeps[c].memory.role == 'claimer') &&
                (Game.creeps[c].memory.targetRoom == r)) {
                
                ++numReservers;
            }
        }
        
        // If it is not being reserved then assign the reserver
        
        if (numReservers < 1) {
            
            creep.memory.targetRoom = r;
            break;
        }
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
