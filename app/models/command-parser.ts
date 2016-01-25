import {Game} from '../models/game';

import {BaseCommand} from '../commands/base-command';
import {core_commands} from '../commands/core-commands';

// custom commands are passed in from the back-end.
declare var commands:Array<BaseCommand>;

/**
 * Command Parser class. Handles registration of available commands and parsing
 * user input.
 */
export class CommandParser {

  /**
   * A reference to the Game object
   */
  game: Game;

  /**
   * A hash map of all the verbs used by the registered commands
   */
  available_verbs: { [key:string]:string; } = {};

  /**
   * A hash map containing all the registered commands, keyed by command machine name
   */
  available_commands: { [key:string]:BaseCommand; } = {};

  constructor(game) {
    this.game = game;

    for(var i in core_commands) {
      this.register(core_commands[i]);
    }

    // register custom commands
    for (var i in commands) {
      var cmd = new BaseCommand();
      cmd.name = commands[i].name;
      cmd.verbs = commands[i].verbs;
      cmd.run = commands[i].run;
      this.register(cmd);
    }
  }

  /**
   * Adds a command to the list of registered commands
   * @param BaseCommand command The command object, a subclass of BaseCommand
   */
  register(command:BaseCommand) {
    // commands need a reference to the game object.
    command.game = this.game;

    // add to the list of verbs, used for parsing commands
    for (var i in command.verbs) {
      this.available_verbs[command.verbs[i]] = command.name;
    }
    // add to the list of all the command objects
    this.available_commands[command.name] = command;

  }

  /**
   * Parses a command into a verb and arguments, then runs the command
   * @param string input The input string from the user, e.g., "n", "get all", "give sword to marcus"
   */
  run(input:string) {

    input = input.trim();
    var space_pos = input.indexOf(' ');
    if (space_pos == -1) {
      // single word command
      var verb = input;
      var args = '';
    } else {
      // multiple word command
      var verb = input.slice(0, space_pos);
      var args = input.slice(space_pos).trim();
    }

    // look up the command in the list of available verbs
    if (this.available_verbs.hasOwnProperty(verb)) {
      var command = this.available_commands[this.available_verbs[verb]];
      try {
        var msg = command.run(verb, args);
        this.game.tick();
      } catch (ex) {
        var msg:string = ex.message;
      }

      return msg;
    } else {
      return "I don't know the command "+verb+"!";
    }

  }

}
