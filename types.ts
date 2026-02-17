
export enum GameState {
  LOBBY = 'LOBBY',
  MATCHMAKING = 'MATCHMAKING',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER'
}

export enum AttackType {
  PROJECTILE = 'PROJECTILE',
  SPREAD = 'SPREAD',
  MELEE = 'MELEE'
}

export interface Brawler {
  id: string;
  name: string;
  type: string;
  hp: number;
  maxHp: number;
  speed: number;
  attackType: AttackType;
  damage: number;
  range: number;
  reloadSpeed: number;
  color: string;
  description: string;
  superAbility: string;
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Vector2;
  radius: number;
  color: string;
}

export interface Player extends Entity {
  brawler: Brawler;
  hp: number;
  ammo: number;
  superCharge: number;
  targetPos: Vector2;
  velocity: Vector2;
  facing: number; // Angle in radians
  team: 'blue' | 'red';
  isBot: boolean;
  isDead: boolean;
  respawnTimer: number;
  kills: number;
}

export interface Projectile extends Entity {
  ownerId: string;
  velocity: Vector2;
  damage: number;
  team: 'blue' | 'red';
  rangeLeft: number;
}

export interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
}
