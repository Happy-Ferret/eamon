/**
 * Unit tests for The Black Castle of Nagog
 */
import {async, getTestBed} from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { CookieService, CookieModule } from 'ngx-cookie';

import {Game} from "../../core/models/game";
import {GameLoaderService} from "../../core/services/game-loader.service";
import {event_handlers} from "adventure/event-handlers";

import {
  TestBed, inject
} from '@angular/core/testing';
import {Monster} from "../../core/models/monster";

describe("The Black Castle of Nagog", function() {

  // to initialize the test, we need to load the whole game data.
  // this requires that a real, live API is running.
  let game = Game.getInstance();
  let gameLoaderService = null;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule, CookieModule.forRoot()],
      providers: [
        GameLoaderService, CookieService
      ]
    });
    gameLoaderService = getTestBed().get(GameLoaderService);
  }));

  it("should have working event handlers", async(() => {
    gameLoaderService.setupGameData(true).subscribe(
      data => {
        game.init(data);
        game.history.delay = 0; // bypasses the history setTimeout() calls which break the tests
        game.start();

        // two-sided secret door
        game.monsters.get(28).destroy(); // get rats out of the way
        game.player.moveToRoom(28);
        game.endTurn();
        game.command_parser.run("look brick wall");
        expect(game.artifacts.get(69).hidden).toBeFalsy("Didn't reveal side 1 of secret passage");
        expect(game.artifacts.get(70).hidden).toBeFalsy("Didn't reveal side 2 of secret passage");
        // also test regular open/close
        game.command_parser.run("close brick wall");
        expect(game.artifacts.get(69).is_open).toBeFalsy("Didn't close side 1 of secret passage");
        expect(game.artifacts.get(70).is_open).toBeFalsy("Didn't close side 2 of secret passage");
        game.command_parser.run("open brick wall");
        expect(game.artifacts.get(69).is_open).toBeTruthy("Didn't reopen side 1 of secret passage");
        expect(game.artifacts.get(70).is_open).toBeTruthy("Didn't reopen side 2 of secret passage");

        // bridge
        game.monsters.get(10).destroy(); // get harpy out of the way
        game.player.moveToRoom(64);
        game.artifacts.get(1).moveToInventory();
        game.player.updateInventory();
        game.command_parser.run('say morgar');
        // game.endTurn();
        expect(game.data['bridge']).toBeTruthy("bridge didn't appear");

        // rubies
        game.monsters.get(5).destroy(); // get gargoyle out of the way
        game.artifacts.get(14).moveToInventory();
        game.player.moveToRoom(65);
        game.artifacts.get(71).reveal();
        game.command_parser.run("put rubies into sculpture");
        expect(game.artifacts.get(71).is_open).toBeTruthy("sculpture secret door didn't open");

        // fun with demons
        game.artifacts.get(2).moveToInventory();
        game.player.updateInventory();
        game.player.moveToRoom(28); // vrock won't appear in room 64+; balor won't appear in room 29+
        game.mock_random_numbers = [1];
        game.tick();
        expect(game.data['vrock appeared']).toBeTruthy("vrock flag wasn't set");
        expect(game.monsters.get(29).isHere()).toBeTruthy("vrock should be in same room as player");
        game.monsters.get(29).destroy(); // get vrock out of the way
        game.mock_random_numbers = [1];
        game.tick();
        expect(game.data['balor appeared']).toBeTruthy("balor flag wasn't set");
        expect(game.monsters.get(30).isHere()).toBeTruthy("balor should be in same room as player");

        console.log(game.history.history);
      }
    );
  }));

});
