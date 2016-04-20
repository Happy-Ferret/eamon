/**
 * JSON data that mocks what would come from the back-end API
 */
export var PLAYER: Object = {
  "name": "Princess Leia",
  "gender": "f",
  "hardiness": 50,
  "agility": 15,
  "charisma": 16,
  "gold": 200,
  "weapon_abilities": {
    "1": 5,
    "2": -10,
    "3": 20,
    "4": 10,
    "5": 0
  },
  "armor_expertise": 20,
  "inventory": [
    {
      "name": "Mace",
      "type": 2,
      "hands": 1,
      "weapon_type": 3,
      "weapon_odds": 10,
      "dice": 1,
      "sides": 4
    },
    {
      "name": "Trollsfire",
      "type": 3,
      "hands": 1,
      "weapon_type": 5,
      "weapon_odds": 25,
      "dice": 1,
      "sides": 10
    },
    {
      "name": "battle axe",
      "type": 2,
      "hands": 2,
      "weapon_type": 1,
      "weapon_odds": 25,
      "dice": 2,
      "sides": 6
    },
    {
      "name": "Chain mail",
      "type": 11,
      "armor_type": 0,
      "armor_class": 2,
      "armor_penalty": 20
    },
    {
      "name": "Shield",
      "type": 11,
      "armor_type": 1,
      "armor_class": 1,
      "armor_penalty": 5
    }
  ],
  "spl_blast": 60,
  "spl_heal": 50,
  "spl_power": 70,
  "spl_speed": 75
};
