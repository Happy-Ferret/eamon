import {Game} from "../../core/models/game";
import {Artifact} from "../../core/models/artifact";
import {Monster} from "../../core/models/monster";
import {RoomExit} from "../../core/models/room";
import {Room} from "../../core/models/room";
import {ReadCommand, OpenCommand} from "../../core/commands/core-commands";

export var event_handlers = {

  "start": function(arg: string) {
    let game = Game.getInstance();

    game.data['gold stolen'] = 0;

    // custom attack messages
    game.monsters.get(5).combat_verbs = ["bites at", "leaps at"];
    game.monsters.get(17).combat_verbs = ["shoots a fireball at", "swings at", "casts a spell at"];

  },

  "drop": function(arg: string, artifact: Artifact): boolean {
    if (artifact.id === 20) {
      Game.getInstance().history.write("You can't pry the golden sword from your hand!");
      return false;
    }
    return true;
  },

  "endTurn": function() {
    let game = Game.getInstance();

    // bandit
    if (!game.in_battle && game.player.gold > 0 && game.monsters.get(13).room_id !== null && game.data['gold stolen'] === 0) {
      let roll = game.diceRoll(1, 10);
      if (roll === 10) {
        game.effects.print(2);
        game.data['gold stolen'] = game.player.gold;
        game.artifacts.get(21).value = game.player.gold;
        game.artifacts.get(21).moveToRoom(32);
        game.player.gold = 0;
      }
    }

  },

  "flee": function() {
    let game = Game.getInstance();
    if (game.monsters.get(1).isHere() && game.diceRoll(1, 25) > game.player.agility) {
      game.history.write("Your exit was blocked!");
      return false;
    }
    return true;
  },

  "afterGet": function(arg, artifact) {
    let game = Game.getInstance();
    // special message when the player finds the treasure
    if (artifact && artifact.id == 20) {
      game.history.write("As you touch the sword, your hand feels warm. You are forced to drop any ready weapon you have and use the golden sword!", "special");
      game.player.ready(artifact);
    }
    return true;
  },

  "give": function(arg: string, artifact: Artifact, monster: Monster) {
    let game = Game.getInstance();
    // cursed sword
    if (artifact.id === 20) {
      game.history.write("You can't pry the golden sword from your hand!");
      return false;
    }
    return true;
  },

  "light": function(arg: string, artifact: Artifact) {
    let game = Game.getInstance();
    if (artifact !== null) {
      // dyn-o-mite!
      if (artifact.id === 10) {
        if (artifact.monster_id === Monster.PLAYER) {
          game.history.write("Better put it down first!");
        } else {
          if (game.artifacts.get(11).isHere() || game.artifacts.get(12).isHere()) {
            game.history.write("* * B O O M * *", "special");
            game.history.write("The explosion blew a hole in the doorway that was bricked up.");
            artifact.destroy();
            game.artifacts.get(11).destroy();
            game.artifacts.get(12).destroy();
          } else {
            game.history.write("Save that for when you need it.");
          }
        }
        return false; // skip the regular "light source" lighting routine
      }
    }
    return true;
  },

  "afterMove": function(arg: string, room_from: Room, room_to: Room) {
    let game = Game.getInstance();
    // cave in
    if (room_to.id === 5 && game.effects.get(1).seen === false) {
      game.effects.print(1);
    }
  },

  "beforePut": function(arg: string, artifact: Artifact, container: Artifact) {
    let game = Game.getInstance();
    if (artifact.id === 20) {
      Game.getInstance().history.write("You can't pry the golden sword from your hand!");
      return false;
    }
    return true;
  },

  "ready": function(arg: string, old_wpn: Artifact, new_wpn: Artifact) {
    let game = Game.getInstance();
    // cursed sword
    if (old_wpn.id === 20) {
      game.history.write("You can't pry the golden sword from your hand!");
      return false;
    }
    return true;
  },

  "say": function(arg) {
    let game = Game.getInstance();
    if (arg === 'anderhauf' && game.artifacts.get(17).isHere()) {
      game.history.write("As you say the word, you feel the sword vibrate and... vanish!", "special");
      game.artifacts.get(17).destroy();
    }
    if (arg === 'gilgamesh' && game.artifacts.get(20).isHere()) {
      game.history.write("The sword leaps from your hand and begins to bend and stretch. As you watch in horror, it transforms into a huge demon!", "special");
      game.artifacts.get(20).destroy();
      game.monsters.get(15).moveToRoom();
    }
    if (arg === 'eamon' && game.player.room_id === 52) {
      game.history.write("You hear a rumbling noise, and find yourself teleported...", "special");
      let rm = game.diceRoll(1, 7) + 10;
      game.player.moveToRoom(rm);
    }
  },

  "see_artifact": function(artifact: Artifact): void {
    let game = Game.getInstance();
    if (artifact.id === 26) {
      game.artifacts.get(36).reveal();
    }
  },

  "use": function(arg: string, artifact: Artifact) {
    let game = Game.getInstance();
    if (artifact.isHere()) {
      switch (artifact.name) {
        case 'bottle':
          game.history.write("Try lighting it.");
          break;
      }
    }
  },

  // every adventure should have a "power" event handler.
  // 'power' event handler takes a 1d100 dice roll as an argument.
  // this event handler only runs if the spell was successful.
  "power": function(roll) {
    let game = Game.getInstance();
    if (roll <= 50) {
      game.history.write("You hear a loud sonic boom which echoes all around you!");
    } else if (roll <= 75) {
      // teleport to random room
      game.history.write("You are being teleported...");
      let room = game.rooms.getRandom();
      game.player.moveToRoom(room.id);
      game.skip_battle_actions = true;
    } else {
      game.history.write("All your wounds are healed!");
      game.player.heal(1000);
    }
  },

}; // end event handlers


// declare any functions used by event handlers and custom commands
