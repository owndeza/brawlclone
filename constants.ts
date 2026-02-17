
import { Brawler, AttackType } from './types';

export const MAP_WIDTH = 2000;
export const MAP_HEIGHT = 1500;
export const VIEW_WIDTH = 1200;
export const VIEW_HEIGHT = 800;
export const PLAYER_RADIUS = 30;
export const PROJECTILE_RADIUS = 8;
export const MAX_AMMO = 3;
export const AMMO_RELOAD_TIME = 1500; // ms
export const SUPER_CHARGE_PER_HIT = 20; // %
export const RESPAWN_TIME = 5000; // ms

export const DEFAULT_BRAWLERS: Brawler[] = [
  {
    id: 'shelly',
    name: 'Sparky',
    type: 'Fighter',
    hp: 3600,
    maxHp: 3600,
    speed: 4.5,
    attackType: AttackType.SPREAD,
    damage: 300,
    range: 350,
    reloadSpeed: 1.5,
    color: '#a855f7',
    description: 'A versatile brawler with a shotgun-style spread.',
    superAbility: 'Super Shell: A massive blast that pushes enemies back.'
  },
  {
    id: 'colt',
    name: 'Ranger',
    type: 'Sharpshooter',
    hp: 2800,
    maxHp: 2800,
    speed: 4.5,
    attackType: AttackType.PROJECTILE,
    damage: 450,
    range: 600,
    reloadSpeed: 1.6,
    color: '#ef4444',
    description: 'Long range precision specialist with high fire rate.',
    superAbility: 'Bullet Storm: A long stream of high-damage bullets.'
  },
  {
    id: 'primo',
    name: 'Titan',
    type: 'Tank',
    hp: 6000,
    maxHp: 6000,
    speed: 5.0,
    attackType: AttackType.MELEE,
    damage: 600,
    range: 150,
    reloadSpeed: 1.2,
    color: '#3b82f6',
    description: 'High health brawler who gets close and personal.',
    superAbility: 'Flying Elbow: Leaps into the air and crashes down on enemies.'
  }
];
