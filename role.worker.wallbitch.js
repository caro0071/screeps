// Constants

const MAX_WALL_REPAIR_HP = 150000; // 150K hits


//------------------------------------------------------
/// Logic for doing work
///
/// @param {Creep} creep **/

module.exports.doWork = function(creep) {
    
    var damagedWalls = creep.room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return ((s.hits < MAX_WALL_REPAIR_HP) && ((s.structureType === STRUCTURE_RAMPART) || (s.structureType === STRUCTURE_WALL)));
        }
    });
    
    damagedWalls.sort(function(a,b) {return a.hits/MAX_WALL_REPAIR_HP - b.hits/MAX_WALL_REPAIR_HP});
    
    // Repair the lowest HP wall
    
    if (damagedWalls.length > 0) {
        
        if (creep.repair(damagedWalls[0])) {
            
            creep.moveTo(damagedWalls[0], {reusePath: 10});
        }
        
    // Otherwise if there are no damaged walls then the wall-bitch is no longer required so clear the job

    } else { 
     
        delete creep.memory.job;
    }
}


//------------------------------------------------------
/// Function to report if there is work to do for this job
///
/// @param {Room} room **/

module.exports.hasWork = function(room) {
    
    var damagedWalls = room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return ((s.hits < MAX_WALL_REPAIR_HP) && ((s.structureType === STRUCTURE_RAMPART) || (s.structureType === STRUCTURE_WALL)));
        }
    });
    
    return (damagedWalls.length > 0);
}