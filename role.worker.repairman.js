// Constants

const REPAIR_THRESHOLD = .9;  // 90%


//------------------------------------------------------
/// Logic for doing work
///
/// @param {Creep} creep **/

module.exports.doWork = function(creep) {
    
    var damagedStructures = creep.room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return (((s.hits / s.hitsMax) < REPAIR_THRESHOLD) && (s.structureType !== STRUCTURE_RAMPART) && (s.structureType !== STRUCTURE_WALL));
        }
    });
    
    damagedStructures.sort(function(a,b) {return a.hits/a.hitsMax - b.hits/b.hitsMax});
    
    // Repair the lowest HP structure
    
    if (damagedStructures.length > 0) {
        
        if (creep.repair(damagedStructures[0])) {
            
            creep.moveTo(damagedStructures[0], {reusePath: 10});
        }
        
    // Otherwise if there are no damaged structures then the repairman is no longer required so clear the job

    } else { 
     
        delete creep.memory.job;
    }
}


//------------------------------------------------------
/// Function to report if there is work to do for this job
///
/// @param {Room} room **/

module.exports.hasWork = function(room) {
    
    var damagedStructures = room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return (((s.hits / s.hitsMax) < REPAIR_THRESHOLD) && (s.structureType !== STRUCTURE_RAMPART) && (s.structureType !== STRUCTURE_WALL));
        }
    });
    
    return (damagedStructures.length > 0);
}