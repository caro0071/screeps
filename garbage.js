// Cleanup dead creeps

for (var name in Memory.creeps) {
    
    if (!Game.creeps[name]) {
        
        delete Memory.creeps[name];
    }
}


// Cleanup dead spawns

for (var name in Memory.spawns) {
    
    if (!Game.spawns[name]) {
        
        delete Memory.spawns[name];
    }
}


// Cleanup dead rooms

for (var name in Memory.rooms) {
    
    if((Game.rooms[name] == undefined) || !Game.rooms[name].controller.my) {
        
        delete Memory.rooms[name];
    }
}
