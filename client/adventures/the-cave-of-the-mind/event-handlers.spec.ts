/**
 * Unit tests for The Cave of the Mind
 */
import Game from "../../core/models/game";
import {Monster} from "../../core/models/monster";
import {Artifact} from "../../core/models/artifact";
import {initLiveGame} from "../../core/utils/testing";
import {event_handlers} from "./event-handlers";
import {custom_commands} from "./commands";

// SETUP

var game = new Game();

beforeAll(() => { global['game'] = game; });
afterAll(() => { delete global['game']; });

// to initialize the test, we need to load the whole game data.
// this requires that a real, live API is running.
beforeEach(() => {
  game.registerAdventureLogic(event_handlers, custom_commands);
  game.slug = 'the-cave-of-the-mind';
  return initLiveGame(game);
});

// TESTS

it("should have working event handlers", () => {
  expect(game.rooms.rooms.length).toBe(31);
  expect(game.artifacts.all.length).toBe(51 + 5); // includes player artifacts
  expect(game.effects.all.length).toBe(15);
  expect(game.monsters.all.length).toBe(14 + 1); // includes player

  expect(game.monsters.get(12).name).toBe("The Mind");
  expect(game.monsters.get(12).combat_verbs.length).toBe(3);

  // use the miner's pick
  game.player.moveToRoom(5);
  game.artifacts.get(19).reveal();
  game.triggerEvent("use", "", game.artifacts.get(7));
  expect(game.artifacts.get(19).room_id).toBeNull();
  expect(game.artifacts.get(18).room_id).toBe(5);

  // use the potion
  let p = game.artifacts.get(16);
  game.triggerEvent("use", "potion", p);
  expect(game.effects.get(10).seen).toBeTruthy();
  expect(game.won).toBeTruthy();

  // inscription
  game.mock_random_numbers = [1, 2, 3];
  expect(game.player.inventory.length).toBe(5);
  game.triggerEvent("beforeRead", "", game.artifacts.get(17));
  expect(game.player.inventory.length).toBe(2);
  expect(game.artifacts.get(52).room_id).toBe(1);
  expect(game.artifacts.get(53).room_id).toBe(2);
  expect(game.artifacts.get(54).room_id).toBe(3);

  // power spell effects
  game.triggerEvent("power", 20);
  expect(game.history.getLastOutput().text).toBe("You hear a loud sonic boom which echoes all around you!");
  game.mock_random_numbers = [16];
  game.triggerEvent("power", 51);
  expect(game.history.getLastOutput().text).toBe("You are being teleported...");
  expect(game.player.room_id).toBe(16);

  // uncomment the following for debugging
  // game.history.history.map(() => console.log(h); });

});