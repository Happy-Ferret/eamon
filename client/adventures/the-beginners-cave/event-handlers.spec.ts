/**
 * Unit tests for The Beginner's Cave
 */
import Game from "../../core/models/game";
import {initLiveGame} from "../../core/utils/testing";
import {event_handlers} from "./event-handlers";
import {custom_commands} from "./commands";

var game = new Game();

beforeAll(() => { global['game'] = game; });
afterAll(() => { delete global['game']; });

// to initialize the test, we need to load the whole game data.
// this requires that a real, live API is running.
beforeEach(() => {
  game.registerAdventureLogic(event_handlers, custom_commands);
  game.slug = 'the-beginners-cave';
  return initLiveGame(game);
});

it("should have working event handlers", () => {
  expect(game.rooms.rooms.length).toBe(26);
  expect(game.artifacts.all.length).toBe(24 + 5); // includes player artifacts
  expect(game.effects.all.length).toBe(12);
  expect(game.monsters.all.length).toBe(9); // includes player


  // ready weapon
  expect(game.player.weapon_id).toBe(27);
  game.command_parser.run("ready firebrand");
  expect(game.player.weapon_id).toBe(26);
  let tr = game.artifacts.get(10);
  tr.moveToRoom();
  game.player.pickUp(tr);
  game.command_parser.run("ready trollsfire");
  expect(game.player.weapon_id).toBe(10);
  game.command_parser.run("trollsfire");
  expect(tr.is_lit).toBeTruthy();
  expect(tr.inventory_message).toBe("glowing");
  game.command_parser.run("ready firebrand");
  expect(tr.is_lit).toBeFalsy();
  expect(tr.inventory_message).toBe("");

  // some tests of the core game engine - put here because this is a basic adventure with stuff we can try
  game.command_parser.run("open door");
  expect(game.history.getOutput().text).toBe("I don't see a door here!");
  game.command_parser.run("open spaceship");
  expect(game.history.getOutput().text).toBe("I don't see a spaceship here!");
  game.player.moveToRoom(15);
  game.command_parser.run("OPEN WALL");  // uppercase to test case insensitivity
  expect(game.history.getOutput().text).toBe(game.artifacts.get(14).description);
  game.player.moveToRoom(25);
  game.monsters.get(8).destroy(); // get pirate out of the way
  game.command_parser.run('e');
  game.command_parser.run("look boat");
  expect(game.history.getOutput().text).toBe(game.artifacts.get(24).description);
  game.command_parser.run("open boat");
  expect(game.history.getOutput().text).toBe("That's not something you can open.");
  game.command_parser.run("open jewels");
  expect(game.history.getOutput().text).toBe("That's not something you can open.");

  // console.log(game.history.history);
});
