import {Game} from "../../core/models/game";
import {Artifact} from "../../core/models/artifact";
import {Monster} from "../../core/models/monster";
import {RoomExit} from "../../core/models/room";
import {Room} from "../../core/models/room";
import {ReadCommand, OpenCommand} from "../../core/commands/core-commands";

export var event_handlers = {

  "start": function(arg: string) {
    let game = Game.getInstance();

    // add your custom game start code here
    game.data['combo'] = (32 + game.diceRoll(1, 10)) + '-' + (20 + game.diceRoll(1, 8)) + '-' + (30 + game.diceRoll(1, 8));
    game.data['drinking contest active'] = false;
    game.data['locate active'] = false;
    game.data["protection spell text"] = false;
    // game.data["worm text"] = false;

  },

  "endTurn2": function() {
    let game = Game.getInstance();
    if (game.player.room_id === 42 && game.monsters.get(31).isHere() && !game.data["protection spell text"]) {
      game.effects.print(3);
      game.data["protection spell text"] = true;
    }

    // worm text moved to the monster description.
    // if (game.player.room_id === 51 && !game.data["protection spell text"]) {
    //   game.effects.print(7, "special2");
    //   game.effects.print(8, "special2");
    //   game.data["worm text"] = true;
    // }

  },

  "beforeSpell": function(spell_name: string) {
    let game = Game.getInstance();
    if (game.player.room_id === 7) {
      game.effects.print(10);
      return false;
    }
    return true;
  },

  "give": function(arg: string, artifact: Artifact, recipient: Monster) {
    let game = Game.getInstance();
    console.log(artifact, recipient);

    if (recipient.id === 6 && artifact.id === 8) {
      // lamp to piano player
      game.effects.print(37);
    } else if (recipient.id === 32 && artifact.id === 13) {
      // amulet to hokas
      game.effects.print(13);
      game.effects.print(14);
      game.data['locate active'] = true;
    }
    return true;
  },

  "say": function(phrase: string) {
    let game = Game.getInstance();
    if ((phrase === 'gronk' || phrase === 'grunt') && game.monsters.get(6).isHere()) {
      game.effects.print(43);
    }
  },

  "seeRoom": function() {
    let game = Game.getInstance();
    // brawl effect shown after room, so it appears before monster desc
    if (game.rooms.current_room.id === 40 && game.monsters.get(25).isHere()) {
      game.effects.print(11);
    }
  },

  "use": function(arg: string, artifact: Artifact) {
    let game = Game.getInstance();
    switch (artifact.name) {
      case 'peanuts':
        game.effects.print(2);
        game.player.moveToRoom(36, true);
        break;
    }
  },

  // every adventure should have a "power" event handler.
  // 'power' event handler takes a 1d100 dice roll as an argument.
  // this event handler only runs if the spell was successful.
  "power": function(roll) {
    let game = Game.getInstance();
    if (game.monsters.get(25).isHere()) {
      game.effects.print(12);
      game.monsters.get(25).room_id = null;
      game.artifacts.get(13).moveToRoom();
      return;
    }
    game.history.write("POWER TODO!")
  },

}; // end event handlers


// declare any functions used by event handlers and custom commands
