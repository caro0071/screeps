//------------------------------------------------------
/// Main execute function
///
/// @param {Creep} creep **/

module.exports.execute = function(creep) {
    
    // Assign a target room to explore
    
    if (!creep.memory.targetRoom) {
        
        this.assignRoom(creep);
    }
    
    // Move to other room
    
    if (creep.memory.exploring) {
        
        // Map the target room
        
        if (creep.room.name == creep.memory.targetRoom) {
            
            this.mapRoom(creep);
            creep.memory.exploring = false;
            
        } else {
            
            this.moveToRoom(creep, creep.memory.targetRoom);
        }
        
    } else {
        
        // Return to the starting room and recycle the scout
        
        if (creep.room.name == creep.memory.homeRoom) {
            
            creep.memory.role = 'recycle';
            
        } else {
            
            this.moveToRoom(creep, creep.memory.homeRoom);
        }
    }
}


//------------------------------------------------------
/// Assign the scout a room to explore
///
/// @param {Creep} creep **/

module.exports.assignRoom = function(creep) {

    for (r in creep.room.memory.adjacentRooms) {
        
        if (!creep.room.memory.adjacentRooms[r].scouted) {

            creep.memory.homeRoom = creep.room.name;
            creep.memory.targetRoom = r;
            creep.memory.exploring = true;
        }
    }
}


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


//------------------------------------------------------
/// Map the current room's sources (TODO and minerals)
///
/// @param {Creep} creep **/

module.exports.mapRoom = function(creep) {
    
    Memory.rooms[creep.memory.homeRoom].adjacentRooms[creep.room.name].source = {};
    
    for (var source of creep.room.find(FIND_SOURCES)) {
        
        // Count number of empty spaces around each source
        
        var n = 0;
        
        for (var x = -1; x <= 1; ++x) { 
            
            for (var y = -1; y <= 1; ++y) {
                
                if (x==0 && y==0) continue
                if (Game.map.getTerrainAt((source.pos.x + x), (source.pos.y + y), creep.room.name) !== 'wall') ++n;
            }
        }
        
        Memory.rooms[creep.memory.homeRoom].adjacentRooms[creep.room.name].source[source.id] = {};
        Memory.rooms[creep.memory.homeRoom].adjacentRooms[creep.room.name].source[source.id].numFreespaces = n;
        Memory.rooms[creep.memory.homeRoom].adjacentRooms[creep.room.name].scouted = true;
    }
}
