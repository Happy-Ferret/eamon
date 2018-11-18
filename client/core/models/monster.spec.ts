import Game from "../models/game";
// import {initMockGame} from "../utils/testing";
import {Artifact} from "../models/artifact";
import {Monster} from "../models/monster";

describe("Monster", function() {

  // initialize the test with the full mock game data
  let game = Game.getInstance();
  beforeEach(() => {
    // initMockGame();
  });

  it("should know its carrying capacity", function() {
    expect(game.monsters.get(1).maxWeight()).toEqual(400);
    expect(game.monsters.get(2).maxWeight()).toEqual(100);
  });

  it("should match synonyms and partial names", function() {
    expect(game.monsters.get(3).match('alfred')).toBeTruthy(); // real name, but lowercase
    expect(game.monsters.get(3).match('al')).toBeTruthy(); // partial match
    expect(game.monsters.get(3).match('fred')).toBeTruthy(); // partial match
    expect(game.monsters.get(3).match('freddy')).toBeTruthy(); // alias
    expect(game.monsters.get(3).match('albert')).toBeFalsy(); // alias

    // a multi-word alias
    expect(game.monsters.get(4).match('bandit')).toBeTruthy(); // alias
    expect(game.monsters.get(4).match('bad guy')).toBeTruthy(); // alias

    // monster with no aliases
    let king = game.monsters.get(2);
    expect(king.match('king')).toBeTruthy();
    expect(king.match('grand duke')).toBeFalsy();
  });

  it("should know if it is in the same room as the player", function() {
    // expect(game.player.room_id).toEqual(1, "FAILURE TO SETUP FOR TEST: player should be in room 1 at test start");

    let guard = game.monsters.get(1);
    expect(guard.isHere()).toBeTruthy();

    let king = game.monsters.get(2);
    expect(king.isHere()).toBeFalsy();
    king.moveToRoom(1);
    expect(king.isHere()).toBeTruthy();
    // put things back the way they were so this test doesn't contaminate other tests
    // king.moveToRoom(3);
  });

  it("should decide if it wants to pick up a weapon", function () {
    let m = new Monster();

    // "special" combat code
    m.combat_code = Monster.COMBAT_CODE_SPECIAL;
    m.weapon_id = 0;
    expect(m.wantsToPickUpWeapon()).toBe(false);
    m.weapon_id = null;
    expect(m.wantsToPickUpWeapon()).toBe(true);
    m.weapon_id = 3;
    expect(m.wantsToPickUpWeapon()).toBe(false);
    m.weapon_id = -1;
    expect(m.wantsToPickUpWeapon()).toBe(true);

    // "normal" combat code
    m.combat_code = Monster.COMBAT_CODE_NORMAL;
    m.weapon_id = 0;
    expect(m.wantsToPickUpWeapon()).toBe(false);
    m.weapon_id = null;
    expect(m.wantsToPickUpWeapon()).toBe(true);
    m.weapon_id = 3;
    expect(m.wantsToPickUpWeapon()).toBe(false);
    m.weapon_id = -1;
    expect(m.wantsToPickUpWeapon()).toBe(true);

    // "weapon if available" combat code
    m.combat_code = Monster.COMBAT_CODE_WEAPON_IF_AVAILABLE;
    // if this type is using natural weapons, it will pick up a weapon if available
    m.weapon_id = 0;
    expect(m.wantsToPickUpWeapon()).toBe(true);
    m.weapon_id = null;
    expect(m.wantsToPickUpWeapon()).toBe(true);
    m.weapon_id = 3;
    expect(m.wantsToPickUpWeapon()).toBe(false);
    m.weapon_id = -1;
    expect(m.wantsToPickUpWeapon()).toBe(true);

  });

  it("should know how to pick up and ready a weapon", function () {
    let m = game.monsters.get(1);
    m.pickUpWeapon(game.artifacts.get(3));
    expect(m.hasArtifact(3)).toBe(true);
    expect(m.weapon_id).toBe(3);
    expect(game.history.getLastOutput().text).toBe("Guard picks up magic sword.");
  });

  it("should know how to ready its best weapon", function () {
    let m = game.monsters.get(1);
    m.weapon = null;
    m.weapon_id = null;
    m.readyBestWeapon();
    expect(m.weapon_id).toBe(4);
    expect(m.weapon.name).toBe('spear');
    game.artifacts.get(4).monster_id = null;  // no longer carrying spear
    m.updateInventory();
    expect(m.weapon_id).toBe(null);
    expect(m.weapon).toBe(null);
    m.readyBestWeapon();
    expect(m.weapon_id).toBe(null);
    expect(m.weapon).toBe(null);
  });


  it("should get its current weapon (single monster)", function () {
    let guard = game.monsters.get(1);
    let w = guard.getWeapon();
    expect(w.id).toBe(4);

    game.artifacts.get(4).monster_id = null;  // no longer carrying spear
    guard.updateInventory();
    w = game.monsters.get(1).getWeapon();
    expect(w).toBeNull();
    guard.readyBestWeapon();
    expect(w).toBeNull();

    // give him the spear back, and also the halberd
    guard.pickUpWeapon(game.artifacts.get(4));
    guard.pickUpWeapon(game.artifacts.get(16));
    guard.updateInventory();
    guard.readyBestWeapon();
    w = guard.getWeapon();
    expect(w.id).toBe(16);
  });

  it("should get its current weapon (group monster)", function () {
    let kobolds = game.monsters.get(5);
    kobolds.group_monster_index = 0;
    let w = kobolds.getWeapon();
    expect(w.id).toBe(21);  // these go in descending order
    kobolds.group_monster_index = 1;
    w = kobolds.getWeapon();
    expect(w.id).toBe(20);
    kobolds.group_monster_index = 2;
    w = kobolds.getWeapon();
    expect(w.id).toBe(19);

    // if one of the group drops a weapon
    kobolds.drop(game.artifacts.get(20));
    kobolds.group_monster_index = 0;
    w = kobolds.getWeapon();
    expect(w.id).toBe(21);
    kobolds.group_monster_index = 1;
    w = kobolds.getWeapon();
    expect(w).toBeNull();
    kobolds.group_monster_index = 2;
    w = kobolds.getWeapon();
    expect(w.id).toBe(19);

    // if one of the group dies
    kobolds.injure(100);
    expect(kobolds.count).toBe(2);
    expect(game.artifacts.get(21).room_id).toBe(kobolds.room_id); // should drop this weapon when one dies
    kobolds.group_monster_index = 0;
    w = kobolds.getWeapon();
    expect(w).toBeNull();
    kobolds.group_monster_index = 1;
    w = kobolds.getWeapon();
    expect(w.id).toBe(19);

  });

  it("should calculate its armor factor", function() {
    expect(game.player.getArmorFactor()).toBe(2);
    // with lower ae
    game.player.armor_expertise = 0;
    expect(game.player.getArmorFactor()).toBe(20);
    // try with ae too high
    game.player.armor_expertise = 99;
    expect(game.player.getArmorFactor()).toBe(0);
    // with a shield
    game.player.armor_expertise = 20;
    game.player.ready(game.artifacts.get(22)); // one handed weapon
    game.player.pickUp(game.artifacts.get(17));
    game.player.wear(game.artifacts.get(17));  // magic shield, penalty of 2
    expect(game.player.getArmorFactor()).toBe(2);
  });

  it("should know its attack odds", function() {
    let guard = game.monsters.get(1);
    let thief = game.monsters.get(4);

    // this value is getting changed somehow from the fixture data. set it back to 10
    game.artifacts.get(4).weapon_odds = 10;
    expect(guard.getToHitOdds(thief)).toBe(41);
    expect(thief.getToHitOdds(guard)).toBe(64);

    // halberd is -10% to hit
    thief.pickUpWeapon(game.artifacts.get(16));
    expect(thief.getToHitOdds(guard)).toBe(59);

    // test the upper limit to wpn odds
    game.artifacts.get(4).weapon_odds = 42; // capped to 30%
    expect(guard.getToHitOdds(thief)).toBe(51);

    // test the upper limit to agility
    guard.agility = 33; // capped to 30
    expect(guard.getToHitOdds(thief)).toBe(91);

    // test the upper limit to armor
    guard.armor_class = 10;  // capped to 7
    expect(guard.getToHitOdds(thief)).toBe(81);

    // player with battle axe (25% odds, 25% ability)
    expect(game.player.getToHitOdds(thief)).toBe(62.75);
    // player with club (10% odds, 30% ability)
    game.player.ready(game.artifacts.get(22));
    expect(game.player.getToHitOdds(thief)).toBe(56.5);
  });

  it("should move", function() {
    let alfred = game.monsters.get(3);
    let guard = game.monsters.get(1);
    expect(alfred.room_id).toBe(1);
    game.player.moveToRoom(2);
    expect(alfred.room_id).toBe(2);
    expect(guard.room_id).toBe(1);  // neutral; does not follow
    game.player.moveToRoom(3, false);
    expect(alfred.room_id).toBe(2);  // follow flag not set
  });

  it("should show its health status", function() {
    let alfred = game.monsters.get(3);
    alfred.damage = 5;
    alfred.showHealth();
    expect(game.history.getLastOutput().text).toBe("Alfred is hurting.");
    alfred.health_messages = ["is fine", "says he's ok", "is a bit banged up", "is bleeding a little", "screams in pain", "is barely conscious", "breathes his last"];
    alfred.showHealth();
    expect(game.history.getLastOutput().text).toBe("Alfred is a bit banged up");
    alfred.damage = 10;
    alfred.showHealth();
    expect(game.history.getLastOutput().text).toBe("Alfred screams in pain");
    alfred.damage = 14;
    alfred.showHealth();
    expect(game.history.getLastOutput().text).toBe("Alfred is barely conscious");
  });

});
