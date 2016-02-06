import {BaseCommand} from './base-command';
import {Game} from '../models/game';
import {Artifact} from '../models/artifact';
import {Monster} from '../models/monster';
import {RoomExit} from '../models/room';
import {CommandException} from '../utils/command.exception';

export var core_commands = [];

export class MoveCommand implements BaseCommand {
  name: string = 'move';
  verbs: string[] = ['north', 'n', 'south', 's', 'east', 'e', 'west', 'w', 'up', 'u', 'down', 'd'];

  run(verb, arg) {

    var game = Game.getInstance();

    // TODO: turn "north" into "n"
    var exit = game.rooms.current_room.getExit(verb);
    var msg:string;
    if (exit === null) {
      throw new CommandException("You can't go that way!");
    } else if (exit.isLocked()) {
      throw new CommandException("The door is locked and you don't have the key!");
    } else {

      // hostile monsters prevent the player from moving
      if (game.in_battle) {
        throw new CommandException("You can't do that with unfriendlies about!");
      }

      // if a key was used, tell the player which key they used.
      if (exit.key_id) {
        var key = game.artifacts.get(exit.key_id);
        game.history.write("You unlock the door using the " + key.name + ".");
      }

      var room_to = game.rooms.getRoomById(exit.room_to);
      game.history.write("Entering " + room_to.name);
      game.monsters.player.moveToRoom(room_to.id);

      // move friendly monsters
      for (var i in game.monsters.visible) {
        if (game.monsters.visible[i].reaction == Monster.RX_FRIEND) {
          game.monsters.visible[i].moveToRoom(room_to.id);
        }
      }
      game.skip_battle_actions = true;
    }
  }
}
core_commands.push(new MoveCommand());


export class LookCommand implements BaseCommand {
  name: string = 'look';
  verbs: string[] = ['look','examine'];
  run(verb, arg) {
    var game = Game.getInstance();

    // look event. can be used to reveal secret doors, etc.
    game.triggerEvent('look', arg);

    if (game.rooms.current_room.is_dark && !game.artifacts.isLightSource()) {
      // can't look at anything if it's dark.
      return;
    }

    if (arg == '') {
      // if not looking at anything in particular, show the room description
      game.history.write(game.rooms.current_room.description);
    } else {
      // looking at a specific thing.

      var match = false;

      // see if there is a matching artifact.
      for (var i in game.artifacts.all) {
        var a = game.artifacts.all[i];
        if (a.name == arg && a.room_id == game.rooms.current_room.id) {
          match = true;
          // if it's an embedded artifact, reveal it
          if (a.embedded) {
            a.embedded = false;
          }
          game.history.write(a.description);
        }
      }
      // see if there is a matching monster.
      for (var i in game.monsters.all) {
        match = true;
        var m = game.monsters.all[i];
        if (m.name == arg && m.room_id == game.rooms.current_room.id) {
          game.history.write(m.description);
        }
      }

      // error message if nothing matched
      if (!match) {
        throw new CommandException("I see no " + arg + " here!");
      }

    }
  }
}
core_commands.push(new LookCommand());


export class SayCommand implements BaseCommand {
  name: string = 'say';
  verbs: string[] = ['say'];
  run(verb, arg) {
    var game = Game.getInstance();

    game.history.write('Ok... "'+arg+'"')
    game.triggerEvent('say', arg);

  }
}
core_commands.push(new SayCommand());


export class GetCommand implements BaseCommand {
  name: string = 'get';
  verbs: string[] = ['get'];
  run(verb:string, arg:string) {

    var game = Game.getInstance();
    arg = arg.toLowerCase();
    var match = false;

    for (var i in game.artifacts.visible) {
      var a = game.artifacts.visible[i];
      if (arg == a.name.toLowerCase() || arg == 'all') {
        match = true;
        if (game.triggerEvent('beforeGet', a)) {
          if (game.monsters.player.weight_carried + a.weight <= game.monsters.player.maxWeight()) {
            game.monsters.player.pickUp(a);
            if (arg == 'all') {
              game.history.write(a.name + ' taken.');
            } else {
              game.history.write('Got it.');
            }
            game.triggerEvent('afterGet', a)

            // if in battle and player has no weapon ready, ready it
            if (game.in_battle && a.is_weapon && game.monsters.player.weapon_id == null) {
              game.monsters.player.ready(a);
              Game.getInstance().history.write("Readied.");
            }
          } else {
            game.history.write(a.name + ' is too heavy.');
          }
        }
      }
    }

    // message if nothing was taken
    if (!match && arg != 'all') {
      throw new CommandException("I see no " + arg + " here!")
    }
  }
}
core_commands.push(new GetCommand());


export class RemoveCommand implements BaseCommand {
  name: string = 'remove';
  verbs: string[] = ['remove'];
  run(verb:string, arg:string) {

    var game:Game = Game.getInstance();
    var match = false;

    // check if we're removing something from a container
    var regex_result = /(.+) from (.*)/.exec(arg);
    if (regex_result !== null) {
      var item_name:string = regex_result[1];
      var container_name:string = regex_result[2];

      // catch user mischief
      var m:Monster = game.monsters.getByName(container_name);
      if (m) {
        throw new CommandException("I can't remove something from " + container_name + "!");
      }

      // look for a container artifact and see if we can remove the item from it
      var container:Artifact = game.artifacts.getByName(container_name);
      if (container && container.isHere()) {
        if (container.is_container) {
          if (container.is_open) {
            var item:Artifact = container.getContainedArtifact(item_name);
            if (item) {
              if (game.triggerEvent('beforeRemove', item)) {
                game.history.write(item.name + ' removed from ' + container.name + '.');
                match = true;
                item.removeFromContainer();
                game.triggerEvent('afterRemove', item)
              }
            } else {
              throw new CommandException("There is no " + item_name + " inside the " + container_name + "!");
            }
          } else {
            throw new CommandException("Try opening the " + container_name + " first.");
          }
        } else {
          throw new CommandException("I can't remove things from the " + container_name + "!");
        }
      } else {
        throw new CommandException("I see no " + container_name + " here!")
      }

    } else {

      var artifact = game.monsters.player.findInInventory(arg);
      if (artifact) {
        if (artifact.is_worn) {
          game.monsters.player.remove(artifact);
          game.history.write("You take off the " + artifact.name + ".")
        } else {
          throw new CommandException("You aren't wearing it!")
        }
      } else {
        throw new CommandException("You aren't carrying a " + arg + "!")
      }

    }

  }
}
core_commands.push(new RemoveCommand());


export class DropCommand implements BaseCommand {
  name: string = 'drop';
  verbs: string[] = ['drop'];
  run(verb, arg) {

    var game = Game.getInstance();

    var match = false;

    var inventory = game.monsters.player.inventory;
    for (var i in inventory) {
      match = true;
      if (arg == inventory[i].name || arg == 'all') {
        game.monsters.player.drop(inventory[i]);
        game.history.write(inventory[i].name + " dropped.")
      }
    }

    // message if nothing was dropped
    if (!match && arg != 'all') {
      throw new CommandException("You aren't carrying a " + arg + "!")
    }
  }
}
core_commands.push(new DropCommand());


export class ReadyCommand implements BaseCommand {
  name: string = 'ready';
  verbs: string[] = ['ready'];
  run(verb, arg) {

    var game = Game.getInstance();
    var wpn = game.monsters.player.findInInventory(arg);
    if (wpn) {
      game.monsters.player.ready(wpn);
      game.history.write(wpn.name + " readied.")
    } else {
      throw new CommandException("You aren't carrying a " + arg + "!")
    }
  }
}
core_commands.push(new ReadyCommand());


export class WearCommand implements BaseCommand {
  name: string = 'wear';
  verbs: string[] = ['wear'];
  run(verb: string, arg: string) {

    var game = Game.getInstance();
    var artifact = game.monsters.player.findInInventory(arg);
    if (artifact) {
      if (artifact.is_wearable) {
        game.monsters.player.wear(artifact);
        game.history.write("You put on the " + artifact.name + ".")
      } else {
        throw new CommandException("You can't wear that!")
      }
    } else {
      throw new CommandException("You aren't carrying a " + arg + "!")
    }
  }
}
core_commands.push(new WearCommand());


export class FleeCommand implements BaseCommand {
  name: string = 'flee';
  verbs: string[] = ['flee'];
  run(verb, arg) {
    var game = Game.getInstance();

    if (!game.in_battle) {
      throw new CommandException("There is nothing to flee from!");
    }

    var room_to = game.monsters.player.chooseRandomExit();
    if (!room_to) {
      throw new CommandException("There is nowhere to flee to!");
    }
    game.history.write("Fleeing to " + room_to.name);
    game.monsters.player.moveToRoom(room_to.id);

    // TODO: check if other monsters follow
  }
}
core_commands.push(new FleeCommand());


export class DrinkCommand implements BaseCommand {
  name: string = 'drink';
  verbs: string[] = ['drink'];
  run(verb, arg) {
    var game = Game.getInstance();
    var item = game.monsters.player.findInInventory(arg);
    if (item) {
      if (item.is_drinkable) {
        if (item.quantity > 0) {
          game.history.write("You drink the " + item.name + ".");
          item.use();
        } else {
          throw new CommandException("There's none left!")
        }
      } else {
        throw new CommandException("You can't drink that!")
      }
    } else {
      throw new CommandException("You aren't carrying it!")
    }

  }
}
core_commands.push(new DrinkCommand());


export class EatCommand implements BaseCommand {
  name: string = 'eat';
  verbs: string[] = ['eat'];
  run(verb, arg) {
    var game = Game.getInstance();
    var item = game.monsters.player.findInInventory(arg);
    if (item) {
      if (item.is_edible) {
        if (item.quantity > 0) {
          game.history.write("You eat the " + item.name + ".");
          item.use();
        } else {
          throw new CommandException("There's none left!")
        }
      } else {
        throw new CommandException("You can't eat that!")
      }
    } else {
      throw new CommandException("You aren't carrying it!")
    }

  }
}
core_commands.push(new EatCommand());


export class AttackCommand implements BaseCommand {
  name: string = 'attack';
  verbs: string[] = ['attack','a'];
  run(verb, arg) {
    var game = Game.getInstance();

    if (!game.monsters.player.weapon_id) {
      throw new CommandException("You don't have a weapon ready!")
    }

    var target = game.monsters.getByName(arg);
    if (target && target.room_id == game.monsters.player.room_id) {

      // halve the target's friendliness and reset target's reaction.
      // this will allow friendly/neutral monsters to fight back if you anger them.
      target.hurtFeelings();

      game.monsters.player.attack(target);
    } else {
      throw new CommandException("Attack whom?")
    }

  }
}
core_commands.push(new AttackCommand());


export class LightCommand implements BaseCommand {
  name: string = 'light';
  verbs: string[] = ['light'];
  run(verb, arg) {
    var game = Game.getInstance();
    var artifact = game.monsters.player.findInInventory(arg);
    if (artifact) {
      if (artifact.is_light_source) {
        if (artifact.is_lit) {
          artifact.is_lit = false;
          game.history.write("You put out the " + artifact.name + ".");
        } else {
          if (artifact.quantity > 0) {
            artifact.is_lit = true;
            game.history.write("You light the " + artifact.name + ".");
          } else {
            game.history.write("It's out of fuel!");
          }
        }
      } else {
        throw new CommandException("That isn't a light source!")
      }
    } else {
      throw new CommandException("You aren't carrying a " + arg + "!")
    }

  }
}
core_commands.push(new LightCommand());


export class ReadCommand implements BaseCommand {
  name: string = 'read';
  verbs: string[] = ['read'];
  run(verb, arg) {
    var game = Game.getInstance();
    var markings_read = false;

    // see if we're reading an artifact that has markings
    var a = game.artifacts.getByName(arg);
    if (a !== null && a.isHere() && a.markings) {
      game.history.write('It reads: "' + a.markings[a.markings_index] + '"');
      markings_read = true;
      a.markings_index++;
      if (a.markings_index >= a.markings.length) {
        a.markings_index = 0;
      }
    }

    // other effects are custom to the adventure
    var success = game.triggerEvent('read', arg);

    // otherwise, nothing happens
    if ((!success || success == undefined) && !markings_read) {
      game.history.write("There are no markings to read!");
    }
  }
}
core_commands.push(new ReadCommand());


export class OpenCommand implements BaseCommand {
  name: string = 'open';
  verbs: string[] = ['open'];
  run(verb, arg) {
    var game = Game.getInstance();

    var container_opened:boolean = false;
    var a = game.artifacts.getByName(arg);
    if (a !== null && a.isHere() && a.is_container) {
      if (!a.is_open) {
        // not open. open it.
        a.is_open = true;
        container_opened = true;
      } else {
        throw new CommandException("It's already open!")
      }
    }

    // other effects are custom to the adventure
    var success = game.triggerEvent('open', arg);

    // otherwise, nothing happens
    if ((!success || success == undefined) && !container_opened) {
      if (arg == 'door') {
        game.history.write("The door will open when you pass through it.");
      } else {
        game.history.write("I don't know how to open that!");
      }
    }
  }
}
core_commands.push(new OpenCommand());


export class PowerCommand implements BaseCommand {
  name: string = 'power';
  verbs: string[] = ['power'];
  run(verb, arg) {
    var game = Game.getInstance();

    if (game.monsters.player.spellCast(verb)) {
      //  this spell has no effect except what is defined in the adventure
      var roll = game.diceRoll(1, 100);
      game.triggerEvent('power', roll);
    }
  }
}
core_commands.push(new PowerCommand());


export class HealCommand implements BaseCommand {
  name: string = 'heal';
  verbs: string[] = ['heal'];
  run(verb, arg) {
    var game = Game.getInstance();

    if (game.monsters.player.spellCast(verb)) {
      var heal_amount = game.diceRoll(2, 6);
      game.triggerEvent('heal', arg);
      if (arg != '') {
        // heal a monster
        var m = game.monsters.getByName(arg);
        if (m.room_id = game.rooms.current_room.id) {
          game.history.write("Some of " + m + "'s wounds seem to clear up.")
          m.heal(heal_amount);

        } else {
          throw new CommandException("Heal whom?")
        }
      } else {
        // heal player
        game.history.write("Some of your wounds seem to clear up.");
        game.monsters.player.heal(heal_amount);
      }
    }
  }
}
core_commands.push(new HealCommand());


export class BlastCommand implements BaseCommand {
  name: string = 'blast';
  verbs: string[] = ['blast'];
  run(verb, arg) {
    var game = Game.getInstance();

    if (game.monsters.player.spellCast(verb)) {
      game.triggerEvent('blast', arg);
      // heal a monster
      var m = game.monsters.getByName(arg);
      if (m.room_id = game.rooms.current_room.id) {
        game.history.write("--a direct hit!", "success")
        var damage = game.diceRoll(2, 5);
        m.injure(damage);
        m.hurtFeelings();
      } else {
        throw new CommandException("Blast whom?")
      }
    }
  }
}
core_commands.push(new BlastCommand());


export class SpeedCommand implements BaseCommand {
  name: string = 'speed';
  verbs: string[] = ['speed'];
  run(verb, arg) {
    var game = Game.getInstance();

    if (game.monsters.player.spellCast(verb)) {
      game.triggerEvent('speed', arg);
      // double player's agility
      game.history.write("You can feel the new agility flowing through you!")
      if (game.monsters.player.speed_time == 0) {
        game.monsters.player.agility *= 2;
      }
      game.monsters.player.speed_time += 10 + game.diceRoll(1, 10);
    }
  }
}
core_commands.push(new SpeedCommand());
