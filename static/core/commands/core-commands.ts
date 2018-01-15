import {BaseCommand} from "./base-command";
import {Game} from "../models/game";
import {Artifact} from "../models/artifact";
import {Monster} from "../models/monster";
import {RoomExit} from "../models/room";
import {CommandException} from "../utils/command.exception";

export let core_commands = [];

export class MoveCommand implements BaseCommand {
  name: string = "move";
  verbs: string[] = ["north", "n", "south", "s", "east", "e", "west", "w",
    "up", "u", "down", "d",
    "ne", "northeast", "se", "southeast", "sw", "southwest", "nw", "northwest"];
  directions: { [key: string]: string; } = {
    "north": "n",
    "northeast": "ne",
    "east": "e",
    "southeast": "se",
    "south": "s",
    "southwest": "sw",
    "west": "w",
    "northwest": "nw",
    "up": "u",
    "down": "d",
  };

  /**
   * Alters the display in the history window
   * @param {string} verb
   */
  history_display(verb) {
    // turn short words ("n") into long ("north")
    for (let d in this.directions) {
      if (this.directions[d] === verb) {
        return d;
      }
    }
    return verb;
  }

  run(verb, arg) {

    let game = Game.getInstance();

    // turn long words ("north") into short ("n")
    if (this.directions.hasOwnProperty(verb)) {
      verb = this.directions[verb];
    }

    let room_from = game.rooms.current_room;
    let exit = game.rooms.current_room.getExit(verb);
    let msg: string;
    if (exit === null) {
      throw new CommandException("You can't go that way!");
    }

    // hostile monsters prevent the player from moving
    if (game.in_battle) {
      throw new CommandException("You can't do that with unfriendlies about!");
    }

    // check if there is a door or gate blocking the way
    if (exit.door_id) {
      let door = game.artifacts.get(exit.door_id);

      // sometimes doors get moved or blown up, so check if the door is still there
      if (door.room_id === room_from.id) {

        // if it's a hidden or secret door, the exit is blocked even if the door's "open" flag is set.
        // show the normal "you can't go that way" message here, to avoid giving away secret door locations
        if (door.hidden) {
          throw new CommandException("You can't go that way!");
        }

        if (door.embedded) {
          door.reveal();
        }

        // try to unlock the door using a key the player is carrying
        if (!door.is_open && door.key_id && game.player.hasArtifact(door.key_id)) {
          let key = game.artifacts.get(door.key_id);
          game.history.write("You unlock the " + door.name + " using the " + key.name + ".");
          door.is_open = true;
        }

        if (!door.is_open) {
          throw new CommandException("The " + door.name + " blocks your way!");
        }

      }
    }

    // monsters never fight during the turn when a player moves to a new room.
    game.skip_battle_actions = true;

    if (game.triggerEvent("beforeMove", arg, game.rooms.current_room, exit)) {
      if (exit.room_to === RoomExit.EXIT) {
        // leaving the adventure
        game.history.write("You successfully ride off into the sunset!");
        game.exit();
        return;
      } else {
        let room_to = game.rooms.getRoomById(exit.room_to);
        if (room_to) {
          game.player.moveToRoom(room_to.id, true);

          game.triggerEvent("afterMove", arg, room_from, room_to);
        } else {
          // oops, broken connection
          console.error("Tried to move to non-existent room #" + exit.room_to);
          game.history.write("You can't go that way!");
        }
      }
    }
  }
}
core_commands.push(new MoveCommand());


export class LookCommand implements BaseCommand {
  name: string = "look";
  verbs: string[] = ["look", "examine"];
  run(verb, arg) {
    let game = Game.getInstance();

    // look event. can be used to reveal secret doors, etc.
    game.triggerEvent("look", arg);

    if (game.rooms.current_room.is_dark && !game.artifacts.isLightSource()) {
      // can't look at anything if it's dark.
      return;
    }

    if (arg === "") {
      // if not looking at anything in particular, show the room description
      game.rooms.current_room.show_description();
    } else {
      // looking at a specific thing.

      let match = false;

      // see if there is a matching artifact. (don't reveal yet - or we would see the description twice)
      let a = game.artifacts.getLocalByName(arg, false);
      if (a) {
        match = true;

        // either reveal or show the description if already known about.
        // this prevents the description being shown twice when revealing.
        if (a.embedded) {
          a.reveal();
        } else {
          game.history.write(a.description);
        }

        // display quantity for food, drinks, and light sources
        if (a.type === Artifact.TYPE_EDIBLE || a.type === Artifact.TYPE_DRINKABLE) {
          let noun = a.type === Artifact.TYPE_EDIBLE ? "bite" : "swallow";
          if (a.quantity === 1) {
            verb = "is";
          } else {
            verb = "are";
            noun += "s";
          }
          game.history.write("There " + verb + " " + a.quantity + " " + noun + " remaining.");
        }
        if (a.type === Artifact.TYPE_LIGHT_SOURCE) {
          if (a.quantity >= 25 || a.quantity === -1) {
            game.history.write("It has a lot of fuel left.");
          } else if (a.quantity >= 10) {
            game.history.write("It has some fuel left.");
          } else if (a.quantity > 0) {
            game.history.write("It is low on fuel.");
          } else {
            game.history.write("It is out of fuel.");
          }
        }
      }

      // see if there is a matching monster.
      let m = game.monsters.getLocalByName(arg);
      if (m) {
        match = true;
        game.history.write(m.description);

        // display monster's inventory and status
        m.printInventory();
        m.showHealth();
      }

      // error message if nothing matched
      if (!match) {
        let common_stuff = ["wall", "door", "floor", "ceiling", "road", "path", "trail", "window"];
        if (common_stuff.indexOf(arg) !== -1) {
          game.history.write("You see nothing special.");
        } else if (arg === 'sign' && game.rooms.current_room.description.indexOf('sign') !== -1) {
          // generic sign which is not really readable. we can pretend.
          game.rooms.current_room.show_description();
        } else {
          throw new CommandException("I see no " + arg + " here!");
        }
      }

    }
  }
}
core_commands.push(new LookCommand());


export class SayCommand implements BaseCommand {
  name: string = "say";
  verbs: string[] = ["say"];
  run(verb, arg) {
    let game = Game.getInstance();

    if (arg !== "") {
      game.history.write("Ok... \"" + arg + "\"");

      // debugging mode
      if (arg === "bort") {
        game.history.write("You feel a sudden power, like you can see inside the Matrix.")
        game.data["bort"] = true;
      }

      game.triggerEvent("say", arg);
    } else {
      game.modal.show("Say what?", function(value) {
        game.command_parser.run("say " + value);
      });
    }
  }
}
core_commands.push(new SayCommand());


export class GetCommand implements BaseCommand {
  name: string = "get";
  verbs: string[] = ["get"];
  run(verb: string, arg: string) {

    let game = Game.getInstance();
    arg = arg.toLowerCase();
    let match = false;

    for (let a of game.artifacts.inRoom) {
      if (a.match(arg) || arg === "all") {
        match = true;
        if (arg === "all" && (a.get_all === false || a.embedded)) {
          continue;
        }

        if (game.triggerEvent("beforeGet", arg, a)) {

          // if it's a disguised monster, reveal it
          if (a.type === Artifact.TYPE_DISGUISED_MONSTER) {
            a.revealDisguisedMonster();
            continue;
          }

          // if it's an embedded artifact, reveal it
          if (a.embedded) {
            a.reveal();
          }

          // weights of >900 and -999 indicate items that can't be gotten.
          if (arg === "all" && (a.weight > 900 || a.weight === -999)) {
            continue;
          }
          if (a.weight > 900) {
            throw new CommandException("Don't be absurd.");
          }
          if (a.weight === -999) {
            throw new CommandException("You can't get that.");
          }
          if (a.type === Artifact.TYPE_BOUND_MONSTER) {
            throw new CommandException("You can't get that.");
          }

          if (game.player.weight_carried + a.weight <= game.player.maxWeight()) {
            game.player.pickUp(a);
            if (arg === "all") {
              game.history.write(a.name + " taken.", "no-space");
            } else {
              game.history.write("Got it.");
            }
            game.triggerEvent("afterGet", arg, a);

            // if in battle and player has no weapon ready, ready it
            if (game.in_battle && a.is_weapon && game.player.weapon_id === null) {
              if (a.hands === 1 || !game.player.isUsingShield()) {
                game.player.ready(a);
                game.history.write("Readied.");
              }
            }
          } else {
            game.history.write(a.name + " is too heavy.");
          }
        }
      }
    }

    // message if nothing was taken
    if (!match && arg !== "all") {
      throw new CommandException("I see no " + arg + " here!");
    }
  }
}
core_commands.push(new GetCommand());


export class RemoveCommand implements BaseCommand {
  name: string = "remove";
  verbs: string[] = ["remove"];
  run(verb: string, arg: string) {

    let game = Game.getInstance();
    let match = false;

    // check if we're removing something from a container
    let regex_result = /(.+) from (.*)/.exec(arg);
    if (regex_result !== null) {
      let item_name: string = regex_result[1];
      let container_name: string = regex_result[2];

      // catch user mischief
      let m: Monster = game.monsters.getLocalByName(container_name);
      if (m) {
        throw new CommandException("I can't remove something from " + container_name + "!");
      }

      // look for a container artifact and see if we can remove the item from it
      let container: Artifact = game.artifacts.getLocalByName(container_name);
      if (container) {
        if (container.type === Artifact.TYPE_CONTAINER) {
          if (container.is_open) {
            let item: Artifact = container.getContainedArtifact(item_name);
            if (item) {
              if (game.triggerEvent("beforeRemoveFromContainer", arg, item, container)) {
                match = true;
                if (!item.seen) {
                  game.history.write(item.description);
                  item.seen = true;
                }
                game.history.write(item.name + " removed from " + container.name + ".");
                item.removeFromContainer();
                game.triggerEvent("afterRemoveFromContainer", arg, item, container);
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
        throw new CommandException("I see no " + container_name + " here!");
      }

    } else {

      let artifact = game.player.findInInventory(arg);
      if (artifact) {
        if (artifact.is_worn) {
          if (game.triggerEvent("beforeRemoveWearable", arg, artifact)) {
            game.player.remove(artifact);
            game.history.write("You take off the " + artifact.name + ".");
            game.triggerEvent("afterRemoveWearable", arg, artifact);
          }
        } else {
          throw new CommandException("You aren't wearing it!");
        }
      } else {
        throw new CommandException("You aren't carrying a " + arg + "!");
      }

    }

  }
}
core_commands.push(new RemoveCommand());


export class PutCommand implements BaseCommand {
  name: string = "put";
  verbs: string[] = ["put"];
  run(verb: string, arg: string) {

    let game = Game.getInstance();
    let match = false;

    // check if we're putting something into a container
    let regex_result = /(.+) in(to)? (.*)/.exec(arg);
    if (regex_result !== null) {
      let item_name: string = regex_result[1];
      let container_name: string = regex_result[3];

      // catch user mischief
      let m: Monster = game.monsters.getLocalByName(item_name);
      if (m) {
        throw new CommandException("I can't put " + m.name + " into something!");
      }
      m = game.monsters.getLocalByName(container_name);
      if (m) {
        throw new CommandException("I can't put something into " + m.name + "!");
      }

      let item: Artifact = game.artifacts.getLocalByName(item_name);
      if (!item) {
        throw new CommandException("I see no " + item_name + " here!");
      }
      let container: Artifact = game.artifacts.getLocalByName(container_name);
      if (!container) {
        throw new CommandException("I see no " + container_name + " here!");
      }
      // the "specialPut" event handler is used for logic when putting something into an artifact that
      // is not a typical container, e.g., putting lamp oil into a lamp
      if (game.triggerEvent('specialPut', arg, item, container)) {
        // if it's a disguised monster, reveal it
        if (item.type === Artifact.TYPE_DISGUISED_MONSTER) {
          item.revealDisguisedMonster();
          return;
        }
        if (container.type === Artifact.TYPE_DISGUISED_MONSTER) {
          container.revealDisguisedMonster();
          return;
        }
        // make sure it's something we can put into things
        // (if you need to put larger items into containers for the game logic, use the "specialPut" event handler)
        if (item.weight > 900) {
          throw new CommandException("Don't be absurd.");
        }
        if (item.weight === -999 || item.type === Artifact.TYPE_BOUND_MONSTER) {
          throw new CommandException("You can't do that.");
        }
        // check capacity of container
        if (item.weight > container.getRemainingCapacity()) {
          throw new CommandException("It won't fit!");
        }
        if (container.type === Artifact.TYPE_CONTAINER) {
          if (container.is_open) {
            if (game.triggerEvent("beforePut", arg, item, container)) {
              game.history.write("Done.");
              match = true;
              item.putIntoContainer(container);
              game.triggerEvent("afterPut", arg, item, container);
            }
          } else {
            throw new CommandException("Try opening the " + container_name + " first.");
          }
        } else {
          throw new CommandException("I can't put things into the " + container_name + "!");
        }
      }
    } else {
      throw new CommandException("Try putting (SOMETHING) into (SOMETHING ELSE).");
    }

  }
}
core_commands.push(new PutCommand());


export class DropCommand implements BaseCommand {
  name: string = "drop";
  verbs: string[] = ["drop"];
  run(verb: string, arg: string) {

    let game = Game.getInstance();
    arg = arg.toLowerCase();

    let match = false;

    let inventory = game.player.inventory;
    for (let i in inventory) {
      if (inventory[i].match(arg) || arg === "all") {
        // "drop all" doesn't drop items the player is wearing
        if (arg === "all" && inventory[i].is_worn) {
          continue;
        }
        match = true;
        if (game.triggerEvent("drop", arg, inventory[i])) {
          game.player.drop(inventory[i]);
          game.history.write(inventory[i].name + " dropped.", "no-space");
        }
      }
    }

    // message if nothing was dropped
    if (!match && arg !== "all") {
      throw new CommandException("You aren't carrying a " + arg + "!");
    }
  }
}
core_commands.push(new DropCommand());


export class ReadyCommand implements BaseCommand {
  name: string = "ready";
  verbs: string[] = ["ready"];
  run(verb, arg) {

    let game = Game.getInstance();
    let old_wpn = game.player.weapon;
    let wpn = game.player.findInInventory(arg);
    if (wpn) {
      if (game.triggerEvent("ready", arg, old_wpn, wpn)) {
        if (wpn.type === Artifact.TYPE_WEARABLE) {
          // for armor/shields, "ready" is the same as "wear"
          game.command_parser.run("wear " + wpn.name, false);
        } else {
          if (!wpn.is_weapon) {
            throw new CommandException("That is not a weapon!");
          }
          if (wpn.hands === 2 && game.player.isUsingShield()) {
            throw new CommandException("That is a two-handed weapon. Try removing your shield first.");
          } else {
            game.player.ready(wpn);
            game.history.write(wpn.name + " readied.");
          }
        }
      }
    } else {
      throw new CommandException("You aren't carrying a " + arg + "!");
    }
  }
}
core_commands.push(new ReadyCommand());


export class WearCommand implements BaseCommand {
  name: string = "wear";
  verbs: string[] = ["wear"];
  run(verb: string, arg: string) {

    let game = Game.getInstance();
    let artifact = game.player.findInInventory(arg);
    if (game.triggerEvent('wear', arg, artifact)) {
      if (artifact) {
        if (artifact.type === Artifact.TYPE_WEARABLE) {
          if (artifact.is_worn) {
            throw new CommandException("You're already wearing it!");
          }
          if (artifact.armor_type === Artifact.ARMOR_TYPE_ARMOR && game.player.isWearingArmor()) {
            throw new CommandException("Try removing your other armor first.");
          }
          if (artifact.armor_type === Artifact.ARMOR_TYPE_SHIELD && game.player.isUsingShield()) {
            throw new CommandException("Try removing your other shield first.");
          }
          if (artifact.armor_type === Artifact.ARMOR_TYPE_SHIELD && game.player.weapon && game.player.weapon.hands === 2) {
            throw new CommandException("You are using a two-handed weapon. You can only use a shield with a one-handed weapon.");
          }
          game.player.wear(artifact);
          game.history.write("You put on the " + artifact.name + ".");
        } else {
          throw new CommandException("You can't wear that!");
        }
      } else {
        throw new CommandException("You aren't carrying a " + arg + "!");
      }
    }
  }
}
core_commands.push(new WearCommand());


export class FleeCommand implements BaseCommand {
  name: string = "flee";
  verbs: string[] = ["flee"];
  run(verb, arg) {
    let game = Game.getInstance();

    if (!game.in_battle) {
      throw new CommandException("Calm down. There is no danger here.");
    }

    if (game.triggerEvent("flee") !== false) {
      let room_to = game.player.chooseRandomExit();
      if (!room_to) {
        throw new CommandException("There is nowhere to flee to!");
      }
      // if the player tried to flee a certain way, go that way instead
      // of using the random exit.
      if (arg !== "") {
        game.history.write("Attempting to flee to the " + arg + "...");
        let exit = game.rooms.current_room.getExit(arg);
        if (exit === null) {
          throw new CommandException("You can't go that way!");
        } else if (!exit.isOpen()) {
          throw new CommandException("The way is blocked!");
        } else {
          room_to = game.rooms.getRoomById(exit.room_to);
        }
      }

      game.player.moveToRoom(room_to.id);
      game.skip_battle_actions = true;

    }

  }
}
core_commands.push(new FleeCommand());


export class DrinkCommand implements BaseCommand {
  name: string = "drink";
  verbs: string[] = ["drink"];
  run(verb, arg) {
    let game = Game.getInstance();
    let item = game.artifacts.getLocalByName(arg);
    if (game.triggerEvent("drink", item) !== false) {
      if (item) {
        if (item.type === Artifact.TYPE_DRINKABLE) {
          if (item.quantity > 0) {
            game.history.write("You drink the " + item.name + ".");
            item.use();
          } else {
            throw new CommandException("There's none left!");
          }
        } else {
          throw new CommandException("You can't drink that!");
        }
      }
    }
  }
}
core_commands.push(new DrinkCommand());


export class EatCommand implements BaseCommand {
  name: string = "eat";
  verbs: string[] = ["eat"];
  run(verb, arg) {
    let game = Game.getInstance();
    let item = game.artifacts.getLocalByName(arg);
    if (item) {
      if (item.type === Artifact.TYPE_EDIBLE) {
        if (item.quantity > 0) {
          game.history.write("You eat the " + item.name + ".");
          item.use();
        } else {
          throw new CommandException("There's none left!");
        }
      } else {
        throw new CommandException("You can't eat that!");
      }
    }
  }
}
core_commands.push(new EatCommand());


export class UseCommand implements BaseCommand {
  name: string = "use";
  verbs: string[] = ["use"];
  run(verb, arg) {
    let game = Game.getInstance();
    let item = game.artifacts.getByName(arg);
    if (item) {
      if (item.quantity === null || item.quantity > 0) {
        item.use();
      } else {
        throw new CommandException("There's none left!");
      }
    } else {
      throw new CommandException("You aren't carrying it!");
    }

  }
}
core_commands.push(new UseCommand());


export class AttackCommand implements BaseCommand {
  name: string = "attack";
  verbs: string[] = ["attack"];
  run(verb, arg) {
    let game = Game.getInstance();

    if (!game.player.weapon_id) {
      throw new CommandException("You don't have a weapon ready!");
    }

    let monster_target = game.monsters.getLocalByName(arg);
    let artifact_target = game.artifacts.getLocalByName(arg);
    if (monster_target) {

      if (game.triggerEvent('attackMonster', arg, monster_target)) {

        // halve the target's friendliness and reset target's reaction.
        // this will allow friendly/neutral monsters to fight back if you anger them.
        monster_target.hurtFeelings();

        game.player.attack(monster_target);
      }

    } else if (artifact_target) {
      // attacking an artifact

      if (game.triggerEvent('attackArtifact', arg, artifact_target)) {

        // if it's a disguised monster, reveal it
        if (artifact_target.type === Artifact.TYPE_DISGUISED_MONSTER) {
          artifact_target.revealDisguisedMonster();
          return;
        }

        let damage_done = artifact_target.injure(game.player.rollAttackDamage());
        if (damage_done === 0) {
          game.history.write("Nothing happens.");
        } else if (damage_done === -1) {
          throw new CommandException("Why would you attack a " + arg + "?");
        }
      }

    } else {
      throw new CommandException("Attack whom?");
    }

  }
}
core_commands.push(new AttackCommand());


export class LightCommand implements BaseCommand {
  name: string = "light";
  verbs: string[] = ["light"];
  run(verb, arg) {
    let game = Game.getInstance();
    let artifact = game.artifacts.getLocalByName(arg);

    if (game.triggerEvent('light', arg, artifact) !== false ) {

      if (artifact) {
        if (artifact.type === Artifact.TYPE_LIGHT_SOURCE) {
          if (artifact.is_lit) {
            artifact.is_lit = false;
            game.history.write("You put out the " + artifact.name + ".");
          } else {
            if (artifact.quantity > 0 || artifact.quantity === -1) {
              artifact.is_lit = true;
              game.history.write("You light the " + artifact.name + ".");
            } else {
              game.history.write("It's out of fuel!");
            }
          }
        } else {
          throw new CommandException("That isn't a light source!");
        }
      } else {
        throw new CommandException("You aren't carrying a " + arg + "!");
      }
    }

  }
}
core_commands.push(new LightCommand());


export class ReadCommand implements BaseCommand {
  name: string = "read";
  verbs: string[] = ["read"];
  markings_read: boolean = false;
  run(verb, arg) {
    let game = Game.getInstance();
    this.markings_read = false;

    // can't read anything if it's dark
    if (game.rooms.current_room.is_dark && !game.artifacts.isLightSource()) {
      game.history.write("You can't read in the dark!");
      return;
    }

    // see if we're reading an artifact that has markings
    let a = game.artifacts.getLocalByName(arg);
    if (a !== null) {

      game.triggerEvent("beforeRead", arg, a, this);

      // "readable" type artifacts have built-in markings logic
      // (this is the new version, which displays one marking per use of the "read" command.)
      // NOTE: This is not implemented on most adventures yet.
      if (a.markings) {
        game.history.write("It reads: \"" + a.markings[a.markings_index] + "\"");
        this.markings_read = true;
        a.markings_index++;
        if (a.markings_index >= a.markings.length) {
          a.markings_index = 0;
        }
      }

      // markings logic from EDX - uses the effect system to print a bunch of effects in series.
      // (This prints them all at once. It doesn't page through them on multiple "read" calls.)
      if (a.effect_id) {
        for (let i = 0; i < a.num_effects; i++) {
          game.effects.print(a.effect_id + i);
        }
        this.markings_read = true;
      } else {
        // readable artifact with no effects. just show description. common in some older adventures.
        if (a.type === Artifact.TYPE_READABLE) {
          a.showDescription();
          this.markings_read = true;
        }
      }

      // also call the event handler to allow reading custom markings on other artifact types
      // (or doing special things when reading something)
      game.triggerEvent("read", arg, a, this);
    }

    // otherwise, nothing happens
    if (!this.markings_read) {
      if (a) {
        game.history.write(a.name + " has no markings to read!");
      } else if (arg === 'wall' || arg === 'door' || arg === 'floor' || arg === 'ceiling') {
        game.history.write("There are no markings to read!");
      } else if (arg === 'sign' && game.rooms.current_room.description.indexOf('sign') !== -1) {
        // generic sign which is not really readable. we can pretend.
        game.rooms.current_room.show_description();
      } else {
        game.history.write("There is no " + arg + " here!");
      }
    }
  }
}
core_commands.push(new ReadCommand());


export class OpenCommand implements BaseCommand {
  name: string = "open";
  verbs: string[] = ["open"];
  opened_something: boolean = false;
  run(verb, arg) {
    let game = Game.getInstance();
    let a = game.artifacts.getLocalByName(arg);
    if (a !== null) {
      if (game.triggerEvent("beforeOpen", arg, a, this)) {
        if (a.type === Artifact.TYPE_DISGUISED_MONSTER) {
          // if it's a disguised monster, reveal it

          a.revealDisguisedMonster();
          this.opened_something = true;

        } else if (a.type === Artifact.TYPE_CONTAINER || a.type === Artifact.TYPE_DOOR) {
          // normal container or door/gate

          if (!a.is_open) {
            // not open. try to open it.
            if (a.key_id === -1) {
              game.history.write("It won't open.");
            } else if (a.key_id === 0 && a.hardiness) {
              game.history.write("You'll have to force it open.");
            } else if (a.key_id > 0) {
              if (game.player.hasArtifact(a.key_id)) {
                let key = game.artifacts.get(a.key_id);
                game.history.write("You unlock it using the " + key.name + ".");
                a.is_open = true;

                if (a.type === Artifact.TYPE_CONTAINER) {
                  a.printContents();
                }

              } else {
                throw new CommandException("It's locked and you don't have the key!");
              }
            } else {
              game.history.write(a.name + " opened.");
              a.is_open = true;

              if (a.type === Artifact.TYPE_CONTAINER) {
                a.printContents();
              }

            }
            this.opened_something = true;
          } else {
            throw new CommandException("It's already open!");
          }
        } else if (a.type === Artifact.TYPE_READABLE || a.type === Artifact.TYPE_EDIBLE || a.type === Artifact.TYPE_DRINKABLE) {
          if (!a.is_open) {
            game.history.write(a.name + " opened.");
            a.is_open = true;
            this.opened_something = true;
          } else {
            throw new CommandException("It's already open!");
          }
        }

        // other effects are custom to the adventure
        game.triggerEvent("open", arg, a, this);

        // otherwise, nothing happens
        if (!this.opened_something) {
          if (arg === "door") {
            game.history.write("The door will open when you pass through it.");
          } else {
            game.history.write("I don't know how to open that!");
          }
        }
      }
    }
  }
}
core_commands.push(new OpenCommand());


export class CloseCommand implements BaseCommand {
  name: string = "close";
  verbs: string[] = ["close"];
  closed_something: boolean = false;
  run(verb, arg) {
    let game = Game.getInstance();
    let a = game.artifacts.getLocalByName(arg, false);  // not revealing embedded artifacts automatically
    if (a !== null) {
      // don't reveal secret passages with this command
      if (a.hidden) {
        throw new CommandException("I don't follow you.");
      }

      // if it's an embedded artifact that is not a hidden secret passage, reveal it
      if (a.embedded) {
        a.reveal();
      }

      if (game.triggerEvent('close', arg, a)) {
        if (a.type === Artifact.TYPE_READABLE || a.type === Artifact.TYPE_EDIBLE || a.type === Artifact.TYPE_DRINKABLE || a.key_id === -1) {
          throw new CommandException("You don't need to.");
        } else if (a.type === Artifact.TYPE_CONTAINER || a.type === Artifact.TYPE_DOOR) {
          if (!a.is_open) {
            throw new CommandException("It's not open.");
          } else if (a.is_broken) {
            throw new CommandException("You broke it.");
          } else {
            a.is_open = false;
            game.history.write(a.name + " closed.");
            this.closed_something = true;
          }
        }
      }
    }

    // otherwise, nothing happens
    if (!this.closed_something) {
      throw new CommandException("It's not here.");
    }
  }
}
core_commands.push(new CloseCommand());


export class GiveCommand implements BaseCommand {
  name: string = "give";
  verbs: string[] = ["give"];
  run(verb: string, arg: string) {

    let game: Game = Game.getInstance();
    let match = false;

    let regex_result = /(.+) to (.*)/.exec(arg);
    if (regex_result === null) {
      throw new CommandException("Try giving (something) to (someone).");
    }

    let item_name: string = regex_result[1];
    let monster_name: string = regex_result[2];

    let recipient = game.monsters.getByName(monster_name);
    if (!recipient || recipient.room_id !== game.rooms.current_room.id) {
      throw new CommandException(monster_name + " is not here!");
    }

    let gold_amount = Number(item_name);
    if (!isNaN(gold_amount)) {
      // giving money

      if (gold_amount > game.player.gold) {
        throw new CommandException("You only have " + game.player.gold + " gold pieces!");
      }

      // TODO: show confirmation dialog to player

      if (game.triggerEvent("giveGold", arg, gold_amount, recipient)) {
        game.player.gold -= gold_amount;
        game.history.write(recipient.name + " takes the money...");
        if (recipient.reaction === Monster.RX_NEUTRAL && gold_amount >= 5000) {
          game.history.write(recipient.name + " agrees to join your cause.");
          recipient.reaction = Monster.RX_FRIEND;
        }
      }

    } else {

      // giving item
      let item = game.player.findInInventory(item_name);
      if (!item) {
        throw new CommandException("You're not carrying it!");
      }

      if (game.triggerEvent("give", arg, item, recipient)) {

        if (item.is_worn) {
          game.player.remove(item);
        }
        item.monster_id = recipient.id;
        if ((item.type === Artifact.TYPE_EDIBLE || item.type === Artifact.TYPE_DRINKABLE) && item.is_healing) {
          let v: string = item.type === Artifact.TYPE_EDIBLE ? "eats" : "drinks";
          game.history.write(recipient.name + " " + v + " the " + item.name + " and hands it back.");
          item.use();
          item.monster_id = game.player.id;
        } else {
          recipient.updateInventory();
          game.history.write(recipient.name + " takes the " + item.name + ".");
        }
        game.player.updateInventory();

        // if you give a weapon to a monster who doesn't have one, they will ready it
        if (item.is_weapon && recipient.weapon_id === null) {
          game.history.write(recipient.name + " readies the " + item.name + ".");
          recipient.ready(item);
        }
      }
    }
  }
}
core_commands.push(new GiveCommand());


export class TakeCommand implements BaseCommand {
  name: string = "take";
  verbs: string[] = ["take", "request"];
  run(verb: string, arg: string) {

    let game: Game = Game.getInstance();
    let match = false;

    let regex_result = /(.+) from (.*)/.exec(arg);
    if (regex_result === null) {
      throw new CommandException("Try taking (something) from (someone).");
    }

    let item_name: string = regex_result[1];
    let monster_name: string = regex_result[2];

    let monster = game.monsters.getByName(monster_name);
    if (!monster || monster.room_id !== game.rooms.current_room.id) {
      throw new CommandException(monster_name + " is not here!");
    }

    let item = monster.findInInventory(item_name);
    if (!item) {
      throw new CommandException(monster.name + " doesn't have it!");
    }

    if (game.triggerEvent("take", arg, item, monster)) {

      item.monster_id = game.player.id;
      let ready_weapon_id = monster.weapon_id;
      monster.updateInventory();
      game.history.write(monster.name + " gives you the " + item.name + ".");
      if (item.id === ready_weapon_id) {
        // took NPC's ready weapon. NPC should ready another weapon if they have one
        monster.weapon = null;
        monster.readyBestWeapon();
        if (monster.weapon_id) {
          game.history.write(monster.name + " readies the " + monster.weapon.name + ".");
        }
      }
      game.player.updateInventory();

    }

  }
}
core_commands.push(new TakeCommand());


export class FreeCommand implements BaseCommand {
  name: string = "free";
  verbs: string[] = ["free", "release"];
  run(verb: string, arg: string) {

    let game: Game = Game.getInstance();
    let monster: Monster = null;
    let message: string = "";

    let a = game.artifacts.getLocalByName(arg);
    if (a !== null) {
      if (a.type !== Artifact.TYPE_BOUND_MONSTER) {
        throw new CommandException("You can't free that!");
      }
      // some adventures use guard_id of 0 to indicate no guard
      if (a.guard_id !== null && a.guard_id !== 0) {
        let guard = game.monsters.get(a.guard_id);
        if (guard.isHere()) {
          throw new CommandException(guard.name + " won't let you!");
        }
      }
      if (a.key_id) {
        if (game.player.hasArtifact(a.key_id)) {
          let key = game.artifacts.get(a.key_id);
          message = "You free it using the " + key.name + ".";
        } else {
          throw new CommandException("It's locked and you don't have the key!");
        }
      } else {
        message = "Freed.";
      }
      if (game.triggerEvent("free", arg, a)) {
        game.history.write(message);
        a.freeBoundMonster();
      }
    } else {
      throw new CommandException("I don't see any " + arg + "!");
    }

  }
}
core_commands.push(new FreeCommand());


export class PowerCommand implements BaseCommand {
  name: string = "power";
  verbs: string[] = ["power"];
  run(verb, arg) {
    let game = Game.getInstance();

    if (game.player.spellCast(verb)) {
      //  this spell has no effect except what is defined in the adventure
      let roll = game.diceRoll(1, 100);
      game.triggerEvent("power", roll);
    }
  }
}
core_commands.push(new PowerCommand());


export class HealCommand implements BaseCommand {
  name: string = "heal";
  verbs: string[] = ["heal"];
  run(verb, arg) {
    let game = Game.getInstance();

    game.triggerEvent("heal", arg);

    let target = null;

    // determine the target
    if (arg !== "") {
      // heal a monster
      target = game.monsters.getLocalByName(arg);
      if (!target) {
        throw new CommandException("No one here by that name.");
      }
    } else {
      // heal the player
      target = game.player;
    }

    if (game.player.spellCast(verb)) {

      let heal_amount = game.diceRoll(2, 6);
      if (target.id == game.player.id) {
        game.history.write("Some of your wounds seem to clear up.");
      } else {
        game.history.write("Some of " + target.name + "'s wounds seem to clear up.");
      }
      target.heal(heal_amount);
    }
  }
}
core_commands.push(new HealCommand());


export class BlastCommand implements BaseCommand {
  name: string = "blast";
  verbs: string[] = ["blast"];
  run(verb, arg) {
    let game = Game.getInstance();

    if (game.player.spellCast(verb)) {

      let monster_target = game.monsters.getLocalByName(arg);
      let artifact_target = game.artifacts.getLocalByName(arg);
      let damage = game.diceRoll(2, 5);
      if (monster_target) {
        if (game.triggerEvent("blast", arg, monster_target)) {
          game.history.write(game.player.name + " casts a blast spell at " + monster_target.name);
          game.history.write("--a direct hit!", "success no-space");
          monster_target.injure(damage, true);
          monster_target.hurtFeelings();
        }
      } else if (artifact_target) {
        if (game.triggerEvent('attackArtifact', arg, artifact_target)) {
          let damage_done = artifact_target.injure(damage, "blast");
          if (damage_done === 0) {
            game.history.write("Nothing happens.");
          } else if (damage_done === -1) {
            throw new CommandException("Why would you blast a " + arg + "?");
          }
        }
      } else {
        throw new CommandException("Blast whom?");
      }
    }
  }
}
core_commands.push(new BlastCommand());


export class SpeedCommand implements BaseCommand {
  name: string = "speed";
  verbs: string[] = ["speed"];
  run(verb, arg) {
    let game = Game.getInstance();

    if (game.player.spellCast(verb)) {
      game.triggerEvent("speed", arg);
      // double player's agility
      game.history.write("You can feel the new agility flowing through you!", "success");
      if (game.player.speed_time === 0) {
        game.player.speed_multiplier = 2;
      }
      game.player.speed_time += 10 + game.diceRoll(1, 10);
    }
  }
}
core_commands.push(new SpeedCommand());


// a cheat command used for debugging. say "goto" and the room number (e.g., "goto 5")
export class GotoCommand implements BaseCommand {
  name: string = "goto";
  verbs: string[] = ["xgoto"];
  run(verb, arg) {
    let game = Game.getInstance();
    if (!game.data['bort']) {
      throw new CommandException("I don't know the command '" + verb + "'!")
    }
    let room_to = game.rooms.getRoomById(parseInt(arg));
    if (!room_to) {
      throw new CommandException("There is no room " + arg);
    }
    game.skip_battle_actions = true;
    game.player.moveToRoom(room_to.id);
  }
}
core_commands.push(new GotoCommand());

// a cheat command used for debugging. opens the javascript debugger
export class DebuggerCommand implements BaseCommand {
  name: string = "debugger";
  verbs: string[] = ["xdebugger"];
  run(verb, arg) {
    let game = Game.getInstance();
    if (!game.data['bort']) {
      throw new CommandException("I don't know the command '" + verb + "'!")
    }
    debugger;
  }
}
core_commands.push(new DebuggerCommand());

// a cheat command used for debugging. gets an artifact no matter where it is
export class AccioCommand implements BaseCommand {
  name: string = "accio";
  verbs: string[] = ["xaccio"];
  run(verb, arg) {
    let game = Game.getInstance();
    if (!game.data['bort']) {
      throw new CommandException("I don't know the command '" + verb + "'!")
    }
    let a = game.artifacts.getByName(arg);
    if (a) {
      if (!a.seen)
        a.showDescription();
      a.moveToInventory();
      game.player.updateInventory();
    }
  }
}
core_commands.push(new AccioCommand());
