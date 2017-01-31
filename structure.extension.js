//------------------------------------------------------
/// Place extensions and roads around them using a spiral search
/// Start at right side of spawn and spiral search clockwise for next extension location
/// Only places one extension per call in order to avoid placing roads beyond the outer extensions
/// @param {spawn} spawn **/

module.exports.place = function(spawn) {
    
    var pos = spawn.pos;
    var room = spawn.room;

    // Relative coordinates
    
    var x = 0;
    var y = 0;
    var dx = 0;
    var dy = -1;

    // Fill a grid of max size 11x11
    // (TODO: random number I picked probably needs to be smarter?)
    
    for (var i=0; i < 121; i++) {
        
        if (!((x === 0) && (y === 0)) && !(Game.map.getTerrainAt(pos) === "wall")) {
            
            //-----------------------            
            // Extension
            
            if ((i % 2) === 0) {
                
                // Make sure it isn't on a source path or controller path
                
                var match = 0;
                
                for (var source of room.find(FIND_SOURCES)) {
                    
                    var sourcePath = room.memory.source[source.id].path;
                    match = isPosInPath(sourcePath, pos);
                    if (match) break;
                }
                
                if (!match) {
                    
                    match = isPosInPath(room.memory.controller.path, pos);
                }
                
                if (!match) {
                    
                    // Place extension
                    
                    var rc = room.createConstructionSite(pos, STRUCTURE_EXTENSION);
                    
                    if ((rc == OK) || (rc == ERR_RCL_NOT_ENOUGH) || (rc == ERR_FULL)) break;
                }
            
            //-----------------------
            // Road
                
            } else {
                
                // Place road
                
                var rc = room.createConstructionSite(pos, STRUCTURE_ROAD);
            }
        }
        
        if ((x === y) || ((x < 0) && (x === -y)) || ((x > 0) && (x === 1-y))) {
            var temp = dx;
            dx = -dy;
            dy = temp;
        }
        
        x += dx;
        y += dy;
        pos.x += dx;
        pos.y += dy;
    }
}


//------------------------------------------------------
/// Check if position exists in path
///
/// @param {Creep} creep **/

function isPosInPath(path, pos) {
    
    var match = 0;

    for (var p in path) {
        
        if ((path[p].x === pos.x) && (path[p].y === pos.y)) {
            
            match = 1;
            break;
        }
    }
    
    return match;
}