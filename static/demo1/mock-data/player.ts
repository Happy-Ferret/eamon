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
  "items": [
    {
      "name": "mace",
      "is_weapon": true,
      "weapon_type": 3,
      "weapon_odds": 10,
      "dice": 1,
      "sides": 4
    },
    {
      "name": "trollsfire",
      "is_weapon": true,
      "weapon_type": 5,
      "weapon_odds": 25,
      "dice": 1,
      "sides": 10
    },
    {
      "name": "chain mail",
      "is_wearable": true,
      "is_armor": true,
      "armor_class": 2
    },
    {
      "name": "shield",
      "is_wearable": true,
      "is_shield": true,
      "armor_class": 1
    }
  ],
  "spell_abilities": {
    "blast": 60,
    "heal": 50,
    "power": 70,
    "speed": 75
  }
};
