// Helper function to calculate cost for a bodyparts array

function sumBodypartsCost(parts) {
    
    var cost = 0;
    for (var bodypart of parts) {
        
        cost += BODYPART_COST[bodypart];
    }
    
    return cost;
}


//Initialize creep part specs

if (!Memory.creepSpecsInitialized) {
    
    Memory.creepSpecs = {};
    Memory.creepSpecs['expander'] = {};
    Memory.creepSpecs['expander'].base = {}
    Memory.creepSpecs['expander'].base.parts = [CLAIM, WORK, CARRY, MOVE, MOVE];
    Memory.creepSpecs['expander'].base.cost = sumBodypartsCost(Memory.creepSpecs['expander'].base.parts);
    Memory.creepSpecs['expander'].incr = {};
    Memory.creepSpecs['expander'].incr.parts = [WORK, CARRY, MOVE];
    Memory.creepSpecs['expander'].incr.cost = sumBodypartsCost(Memory.creepSpecs['expander'].incr.parts);
    Memory.creepSpecs['expander'].maxIncr = 1;
    Memory.creepSpecs['harvester'] = {};
    Memory.creepSpecs['harvester'].base = {};
    Memory.creepSpecs['harvester'].base.parts = [WORK, CARRY, MOVE];
    Memory.creepSpecs['harvester'].base.cost = sumBodypartsCost(Memory.creepSpecs['harvester'].base.parts);
    Memory.creepSpecs['harvester'].incr = {};
    Memory.creepSpecs['harvester'].incr.parts = [WORK, WORK, MOVE];
    Memory.creepSpecs['harvester'].incr.cost = sumBodypartsCost(Memory.creepSpecs['harvester'].incr.parts);
    Memory.creepSpecs['harvester'].maxIncr = 2;
    Memory.creepSpecs['remoteHarvester'] = {};
    Memory.creepSpecs['remoteHarvester'].base = {};
    Memory.creepSpecs['remoteHarvester'].base.parts = [WORK, CARRY, MOVE];
    Memory.creepSpecs['remoteHarvester'].base.cost = sumBodypartsCost(Memory.creepSpecs['remoteHarvester'].base.parts);
    Memory.creepSpecs['remoteHarvester'].incr = {};
    Memory.creepSpecs['remoteHarvester'].incr.parts = [WORK, CARRY, MOVE];
    Memory.creepSpecs['remoteHarvester'].incr.cost = sumBodypartsCost(Memory.creepSpecs['remoteHarvester'].incr.parts);
    Memory.creepSpecs['remoteHarvester'].maxIncr = 10;
    Memory.creepSpecs['reserver'] = {};
    Memory.creepSpecs['reserver'].base = {};
    Memory.creepSpecs['reserver'].base.parts = [CLAIM, MOVE];
    Memory.creepSpecs['reserver'].base.cost = sumBodypartsCost(Memory.creepSpecs['reserver'].base.parts);
    Memory.creepSpecs['reserver'].incr = {};
    Memory.creepSpecs['reserver'].maxIncr = 0;
    Memory.creepSpecs['scout'] = {};
    Memory.creepSpecs['scout'].base = {};
    Memory.creepSpecs['scout'].base.parts = [MOVE, MOVE, MOVE];
    Memory.creepSpecs['scout'].base.cost = sumBodypartsCost(Memory.creepSpecs['scout'].base.parts);
    Memory.creepSpecs['scout'].incr = {};
    Memory.creepSpecs['scout'].maxIncr = 0;
    Memory.creepSpecs['transport'] = {};
    Memory.creepSpecs['transport'].base = {};
    Memory.creepSpecs['transport'].base.parts = [CARRY, CARRY, MOVE];
    Memory.creepSpecs['transport'].base.cost = sumBodypartsCost(Memory.creepSpecs['transport'].base.parts);
    Memory.creepSpecs['transport'].incr = {};
    Memory.creepSpecs['transport'].incr.parts = [CARRY, CARRY, MOVE];
    Memory.creepSpecs['transport'].incr.cost = sumBodypartsCost(Memory.creepSpecs['transport'].incr.parts);
    Memory.creepSpecs['transport'].maxIncr = 10;
    Memory.creepSpecs['worker'] = {};
    Memory.creepSpecs['worker'].base = {};
    Memory.creepSpecs['worker'].base.parts = [WORK, CARRY, MOVE];
    Memory.creepSpecs['worker'].base.cost = sumBodypartsCost(Memory.creepSpecs['worker'].base.parts);
    Memory.creepSpecs['worker'].incr = {};
    Memory.creepSpecs['worker'].incr.parts = [WORK, CARRY, MOVE];
    Memory.creepSpecs['worker'].incr.cost = sumBodypartsCost(Memory.creepSpecs['worker'].incr.parts);
    Memory.creepSpecs['worker'].maxIncr = 10;
    Memory.creepSpecsInitialized = true;
}

// Initialize room memory

for (var name in Game.rooms) {
    
    var room = Game.rooms[name];
    
    var spawn = room.find(FIND_MY_STRUCTURES, {
        filter: (s) => {
            return (s.structureType == STRUCTURE_SPAWN);
        }
    })[0];
    
    // Source memory
    
    if (!room.memory.source && spawn) {
        
        room.memory.source = {};
        
        for (var source of room.find(FIND_SOURCES)) {
            
            // Count number of empty spaces around each source
            
            var n = 0;
            
            for (var x = -1; x <= 1; ++x) { 
                
                for (var y = -1; y <= 1; ++y) {
                    
                    if (x==0 && y==0) continue
                    if (Game.map.getTerrainAt((source.pos.x + x), (source.pos.y + y), room.name) !== 'wall') ++n;
                }
            }
            
            room.memory.source[source.id] = {};
            room.memory.source[source.id].numFreespaces = n;
            
            // Find best location for source containers and place roads and containers
            
            if (spawn) {
                
                var sourcePath = source.pos.findPathTo(spawn, {ignoreCreeps: true});
                var sourceContainerPos = sourcePath[0]
                
                for (var i=1; i < sourcePath.length; i++) {
                    
                    room.createConstructionSite(sourcePath[i].x, sourcePath[i].y, STRUCTURE_ROAD);
                }
                
                room.memory.source[source.id].container = {};
                room.memory.source[source.id].container.x = sourceContainerPos.x;
                room.memory.source[source.id].container.y = sourceContainerPos.y;
                room.memory.source[source.id].path = sourcePath;
                
                //room.memory.source[source.id].path = Room.serializePath(sourcePath);
                room.createConstructionSite(sourceContainerPos.x, sourceContainerPos.y, STRUCTURE_CONTAINER);
            }
        }
        
        // Place roads and containers for the controller
        
        if (spawn) {
            
            var controllerPath = room.findPath(spawn.pos, room.controller.pos, {ignoreCreeps: true});
            var controllerContainerPos = controllerPath[(controllerPath.length-4)];
            
            for (var i=0; i<(controllerPath.length-4); i++) {
                
                room.createConstructionSite(controllerPath[i].x, controllerPath[i].y, STRUCTURE_ROAD);
            }
            
            if (!room.memory.controller) {
                
                room.memory.controller = {};
                room.memory.controller.container = {};
                room.memory.controller.container.x = controllerContainerPos.x;
                room.memory.controller.container.y = controllerContainerPos.y;
                room.memory.controller.path = controllerPath;
                //room.memory.controller.path = Room.serializePath(controllerPath);
                room.createConstructionSite(controllerContainerPos.x, controllerContainerPos.y, STRUCTURE_CONTAINER);
            }
        }
        
        // Find adjacent rooms
        
        if (!room.memory.adjacentRooms) {
            
            room.memory.adjacentRooms = {};
            
            var exits = Game.map.describeExits(room.name)
            for (var r in exits) {
                
                if (exits[r] != undefined) {
                    
                    room.memory.adjacentRooms[exits[r]] = {};
                    room.memory.adjacentRooms[exits[r]].dir = r;
                    room.memory.adjacentRooms[exits[r]].scouted = false;
                    room.memory.adjacentRooms[exits[r]].enableRemoteMining = false;
                }
            }
        }
    }
}
