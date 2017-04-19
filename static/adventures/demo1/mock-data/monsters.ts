/**
 * JSON data that mocks what would come from the back-end API
 */
export var MONSTERS: Array<Object> = [
  {
    "id": 1,
    "name": "guard",
    "description": "You see a big guard wearing chainmail.",
    "room_id": 1,
    "hardiness": 40,
    "agility": 10,
    "courage": 100,
    "count": 1,
    "friendliness": "neutral",
    "friend_odds": 40,
    "combat_code": 1,
    "weapon_id": 4,
    "weapon_dice": 1,
    "weapon_sides": 5,
    "armor_class": 2
  },
  {
    "id": 2,
    "name": "king",
    "description": "You see the king. He has a crown and a purple robe.",
    "room_id": 3,
    "hardiness": 10,
    "agility": 10,
    "courage": 100,
    "count": 1,
    "friendliness": "neutral",
    "combat_code": -2,
    "armor_class": 0
  },
  {
    "id": 3,
    "name": "Alfred",
    "synonyms": "freddy",
    "description": "You see a fellow adventurer wearing plate mail and holding a sword. He says his name is Alfred.",
    "room_id": 1,
    "hardiness": 15,
    "agility": 12,
    "courage": 100,
    "count": 1,
    "friendliness": "friend",
    "combat_code": -1,
    "weapon_id": 8,
    "weapon_dice": 1,
    "weapon_sides": 8,
    "armor_class": 5
  },
  {
    "id": 4,
    "name": "thief",
    "synonyms": "bandit,bad guy",
    "description": "You see a thief who is looking for the treasure vault.",
    "room_id": 2,
    "hardiness": 12,
    "agility": 16,
    "courage": 25,
    "count": 1,
    "friendliness": "hostile",
    "combat_code": 0,
    "weapon_id": 0,
    "weapon_dice": 1,
    "weapon_sides": 6,
    "armor_class": 1
  },
  {
    "id": 5,
    "name": "kobold",
    "description": "You see three kobolds.",
    "room_id": 7,
    "count": 3,
    "hardiness": 5,
    "agility": 5,
    "courage": 100,
    "friendliness": "hostile",
    "combat_code": 0,
    "weapon_id": 19,
    "armor_class": 1
  }
];
