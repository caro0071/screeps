//------------------------------------------------------
/// Main execute function
///
/// @param {tower} tower **/

module.exports.execute = function(tower) {
    
    // Attack hostile creeps
    
    var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    
    if(closestHostile) {
        
        tower.attack(closestHostile);
        
    // Otherwise repair close structures
    
    } else {
        
        // Stop repairing when efficiency drops below 25%
        
        var maxAllowedRepairRange = .25/TOWER_FALLOFF*(TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE) + TOWER_OPTIMAL_RANGE;
        
        // Repair damaged non-wall/rampart structures first
        
        var repairStructures = tower.pos.findInRange(FIND_STRUCTURES, maxAllowedRepairRange, {
            filter: (s) => {
                return (s.hits < s.hitsMax) && (s.structureType != STRUCTURE_RAMPART) && (s.structureType != STRUCTURE_WALL);
            }
        });
        
        repairStructures.sort(function(a,b) {return a.hits/a.hitsMax - b.hits/b.hitsMax});
        
        // Otherwise repair walls/ramparts up to 100K
        
        if (!repairStructures[0]) {
            
            repairStructures = tower.pos.findInRange(FIND_STRUCTURES, maxAllowedRepairRange, {
                filter: (s) => {
                    return (s.hits < 100000) && ((s.structureType == STRUCTURE_RAMPART) || (s.structureType == STRUCTURE_WALL));
                }
            });
            
            repairStructures.sort(function(a,b) {return a.hits/a.hitsMax - b.hits/b.hitsMax});
        }
        
        if(repairStructures[0]) {
            
            tower.repair(repairStructures[0]);
       }
    }
}
