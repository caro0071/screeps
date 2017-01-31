//------------------------------------------------------
/// Main execute function
///
/// @param {Creep} creep **/

module.exports.execute = function(creep) {
    
    var spawn = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: (s) => {
            return (s.structureType == STRUCTURE_SPAWN);
        }
    });
    
    if (creep.pos.isNearTo(spawn)) {
        
        spawn.recycleCreep(creep);
        
    } else {
        
        creep.moveTo(spawn, {reusePath: 10});
    }
}
