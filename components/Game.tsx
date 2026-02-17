
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  GameState, Player, Projectile, Brawler, Wall, Vector2, AttackType
} from '../types';
import {
  MAP_WIDTH, MAP_HEIGHT, PLAYER_RADIUS, PROJECTILE_RADIUS, MAX_AMMO,
  AMMO_RELOAD_TIME, SUPER_CHARGE_PER_HIT, RESPAWN_TIME, DEFAULT_BRAWLERS
} from '../constants';

interface GameProps {
  playerBrawler: Brawler;
  onGameOver: (winner: 'blue' | 'red') => void;
}

const Game: React.FC<GameProps> = ({ playerBrawler, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  const playersRef = useRef<Player[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const wallsRef = useRef<Wall[]>([
    { x: 400, y: 300, w: 100, h: 400 },
    { x: 1500, y: 800, w: 100, h: 400 },
    { x: 900, y: 600, w: 200, h: 200 },
    { x: 400, y: 1000, w: 400, h: 100 },
    { x: 1200, y: 400, w: 400, h: 100 },
  ]);
  
  const mousePos = useRef<Vector2>({ x: 0, y: 0 });
  const keysDown = useRef<Set<string>>(new Set());
  const lastShotTime = useRef<number>(0);
  const [uiPlayer, setUiPlayer] = useState<Player | null>(null);

  // Joysticks State
  const [leftJoy, setLeftJoy] = useState<{ active: boolean, base: Vector2, current: Vector2 }>({ active: false, base: { x: 0, y: 0 }, current: { x: 0, y: 0 } });
  const [rightJoy, setRightJoy] = useState<{ active: boolean, base: Vector2, current: Vector2 }>({ active: false, base: { x: 0, y: 0 }, current: { x: 0, y: 0 } });
  const leftJoyRef = useRef(leftJoy);
  const rightJoyRef = useRef(rightJoy);

  useEffect(() => { leftJoyRef.current = leftJoy; }, [leftJoy]);
  useEffect(() => { rightJoyRef.current = rightJoy; }, [rightJoy]);

  useEffect(() => {
    const bots: Player[] = [
      { id: 'bot1', pos: { x: MAP_WIDTH - 200, y: 200 }, radius: PLAYER_RADIUS, color: '#ff4444', brawler: DEFAULT_BRAWLERS[1], hp: DEFAULT_BRAWLERS[1].hp, ammo: MAX_AMMO, superCharge: 0, targetPos: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, facing: 0, team: 'red', isBot: true, isDead: false, respawnTimer: 0, kills: 0 },
      { id: 'bot2', pos: { x: MAP_WIDTH - 200, y: MAP_HEIGHT - 200 }, radius: PLAYER_RADIUS, color: '#ff6666', brawler: DEFAULT_BRAWLERS[2], hp: DEFAULT_BRAWLERS[2].hp, ammo: MAX_AMMO, superCharge: 0, targetPos: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, facing: 0, team: 'red', isBot: true, isDead: false, respawnTimer: 0, kills: 0 },
      { id: 'bot3', pos: { x: MAP_WIDTH / 2, y: 100 }, radius: PLAYER_RADIUS, color: '#ff8888', brawler: DEFAULT_BRAWLERS[0], hp: DEFAULT_BRAWLERS[0].hp, ammo: MAX_AMMO, superCharge: 0, targetPos: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, facing: 0, team: 'red', isBot: true, isDead: false, respawnTimer: 0, kills: 0 }
    ];

    const localPlayer: Player = {
      id: 'local', pos: { x: 200, y: MAP_HEIGHT / 2 }, radius: PLAYER_RADIUS, color: playerBrawler.color, brawler: playerBrawler, hp: playerBrawler.hp, ammo: MAX_AMMO, superCharge: 0, targetPos: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, facing: 0, team: 'blue', isBot: false, isDead: false, respawnTimer: 0, kills: 0
    };

    playersRef.current = [localPlayer, ...bots];
    setUiPlayer(localPlayer);
  }, [playerBrawler]);

  const shoot = (p: Player, targetAngle: number) => {
    if (p.isDead || p.ammo < 1) return;
    const b = p.brawler;
    const now = Date.now();
    if (now - lastShotTime.current < 250 && !p.isBot) return;

    p.ammo -= 1;
    if (!p.isBot) lastShotTime.current = now;

    const fire = (angle: number, dmg: number, rad: number, spd: number) => {
      projectilesRef.current.push({
        id: `proj-${Date.now()}-${Math.random()}`,
        ownerId: p.id, pos: { ...p.pos }, radius: rad, color: b.color,
        velocity: { x: Math.cos(angle) * spd, y: Math.sin(angle) * spd },
        damage: dmg, team: p.team, rangeLeft: b.range
      });
    };

    if (b.attackType === AttackType.SPREAD) {
      for (let i = 0; i < 5; i++) fire(targetAngle - 0.25 + 0.125 * i, b.damage / 2, PROJECTILE_RADIUS, 12);
    } else if (b.attackType === AttackType.PROJECTILE) {
      fire(targetAngle, b.damage, PROJECTILE_RADIUS * 1.5, 15);
    } else {
      fire(targetAngle, b.damage, PROJECTILE_RADIUS * 4, 18);
    }
  };

  const update = useCallback(() => {
    const players = playersRef.current;
    const projectiles = projectilesRef.current;
    const walls = wallsRef.current;
    const local = players.find(p => p.id === 'local');

    if (local?.isDead) {
      onGameOver('red');
      return;
    }

    players.forEach(p => {
      if (p.isDead) return;

      if (!p.isBot) {
        p.velocity = { x: 0, y: 0 };
        // Keyboard controls
        if (keysDown.current.has('w')) p.velocity.y = -p.brawler.speed;
        if (keysDown.current.has('s')) p.velocity.y = p.brawler.speed;
        if (keysDown.current.has('a')) p.velocity.x = -p.brawler.speed;
        if (keysDown.current.has('d')) p.velocity.x = p.brawler.speed;

        // Joystick controls
        if (leftJoyRef.current.active) {
          const dx = leftJoyRef.current.current.x - leftJoyRef.current.base.x;
          const dy = leftJoyRef.current.current.y - leftJoyRef.current.base.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 5) {
            p.velocity.x = (dx / dist) * p.brawler.speed;
            p.velocity.y = (dy / dist) * p.brawler.speed;
          }
        }

        // Aiming
        const canvas = canvasRef.current;
        if (canvas) {
          if (rightJoyRef.current.active) {
            const dx = rightJoyRef.current.current.x - rightJoyRef.current.base.x;
            const dy = rightJoyRef.current.current.y - rightJoyRef.current.base.y;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) p.facing = Math.atan2(dy, dx);
          } else {
            const rect = canvas.getBoundingClientRect();
            const viewX = Math.max(0, Math.min(MAP_WIDTH - canvas.width, local.pos.x - canvas.width / 2));
            const viewY = Math.max(0, Math.min(MAP_HEIGHT - canvas.height, local.pos.y - canvas.height / 2));
            const worldMouseX = mousePos.current.x + viewX;
            const worldMouseY = mousePos.current.y + viewY;
            p.facing = Math.atan2(worldMouseY - p.pos.y, worldMouseX - p.pos.x);
          }
        }
      } else {
        // Advanced Bot AI
        const target = players.find(other => other.team !== p.team && !other.isDead);
        if (target) {
          const dx = target.pos.x - p.pos.x;
          const dy = target.pos.y - p.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          p.facing = Math.atan2(dy, dx);
          
          if (dist > p.brawler.range * 0.7) {
             p.velocity = { x: (dx / dist) * p.brawler.speed, y: (dy / dist) * p.brawler.speed };
          } else if (dist < p.brawler.range * 0.4) {
             p.velocity = { x: (-dx / dist) * p.brawler.speed, y: (-dy / dist) * p.brawler.speed };
          } else {
             p.velocity = { x: Math.sin(Date.now() / 500) * 2, y: Math.cos(Date.now() / 500) * 2 };
             if (Math.random() < 0.03) shoot(p, p.facing);
          }
        }
      }

      // Walls/Map Bounds Collision
      const nx = p.pos.x + p.velocity.x;
      const ny = p.pos.y + p.velocity.y;
      let cx = false, cy = false;
      walls.forEach(w => {
        if (nx + p.radius > w.x && nx - p.radius < w.x + w.w && p.pos.y + p.radius > w.y && p.pos.y - p.radius < w.y + w.h) cx = true;
        if (p.pos.x + p.radius > w.x && p.pos.x - p.radius < w.x + w.w && ny + p.radius > w.y && ny - p.radius < w.y + w.h) cy = true;
      });
      if (!cx) p.pos.x = Math.max(p.radius, Math.min(MAP_WIDTH - p.radius, nx));
      if (!cy) p.pos.y = Math.max(p.radius, Math.min(MAP_HEIGHT - p.radius, ny));
      if (p.ammo < MAX_AMMO) p.ammo = Math.min(MAX_AMMO, p.ammo + 16 / AMMO_RELOAD_TIME);
    });

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i];
      proj.pos.x += proj.velocity.x;
      proj.pos.y += proj.velocity.y;
      proj.rangeLeft -= Math.sqrt(proj.velocity.x**2 + proj.velocity.y**2);

      let hit = false;
      walls.forEach(w => { if (proj.pos.x > w.x && proj.pos.x < w.x + w.w && proj.pos.y > w.y && proj.pos.y < w.y + w.h) hit = true; });
      players.forEach(p => {
        if (!p.isDead && p.team !== proj.team) {
          const d = Math.sqrt((p.pos.x - proj.pos.x)**2 + (p.pos.y - proj.pos.y)**2);
          if (d < p.radius + proj.radius) {
            p.hp -= proj.damage;
            hit = true;
            const owner = players.find(o => o.id === proj.ownerId);
            if (owner) owner.superCharge = Math.min(100, owner.superCharge + SUPER_CHARGE_PER_HIT);
            if (p.hp <= 0) { p.isDead = true; if (owner) owner.kills++; }
          }
        }
      });
      if (hit || proj.rangeLeft <= 0) projectiles.splice(i, 1);
    }

    if (local) setUiPlayer({ ...local });
    draw();
    requestRef.current = requestAnimationFrame(update);
  }, [onGameOver]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const local = playersRef.current.find(p => p.id === 'local');
    if (!ctx || !local) return;

    const vx = Math.max(0, Math.min(MAP_WIDTH - canvas.width, local.pos.x - canvas.width / 2));
    const vy = Math.max(0, Math.min(MAP_HEIGHT - canvas.height, local.pos.y - canvas.height / 2));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-vx, -vy);

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < MAP_WIDTH; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, MAP_HEIGHT); ctx.stroke(); }
    for (let y = 0; y < MAP_HEIGHT; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(MAP_WIDTH, y); ctx.stroke(); }

    wallsRef.current.forEach(w => {
      ctx.fillStyle = '#1e293b'; ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 4; ctx.strokeRect(w.x, w.y, w.w, w.h);
    });

    projectilesRef.current.forEach(proj => {
      ctx.fillStyle = proj.color; ctx.beginPath(); ctx.arc(proj.pos.x, proj.pos.y, proj.radius, 0, Math.PI*2); ctx.fill();
    });

    playersRef.current.forEach(p => {
      if (p.isDead) return;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI*2); ctx.fill();
      
      // Aiming Guide
      ctx.strokeStyle = p.team === 'blue' ? '#3b82f644' : '#ef444444';
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(p.pos.x, p.pos.y);
      ctx.lineTo(p.pos.x + Math.cos(p.facing) * p.brawler.range, p.pos.y + Math.sin(p.facing) * p.brawler.range);
      ctx.stroke();
      ctx.setLineDash([]);

      const bw = 60, bh = 6;
      ctx.fillStyle = '#0008'; ctx.fillRect(p.pos.x - bw/2, p.pos.y - p.radius - 15, bw, bh);
      ctx.fillStyle = p.team === 'blue' ? '#22c55e' : '#ef4444'; ctx.fillRect(p.pos.x - bw/2, p.pos.y - p.radius - 15, bw * (p.hp / p.brawler.maxHp), bh);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText(p.brawler.name, p.pos.x, p.pos.y - p.radius - 20);
    });

    ctx.restore();
  };

  useEffect(() => {
    const kd = (e: KeyboardEvent) => keysDown.current.add(e.key.toLowerCase());
    const ku = (e: KeyboardEvent) => keysDown.current.delete(e.key.toLowerCase());
    const mm = (e: MouseEvent) => { mousePos.current = { x: e.clientX, y: e.clientY }; };
    const md = () => { const l = playersRef.current.find(p => p.id === 'local'); if (l) shoot(l, l.facing); };

    const ts = (e: TouchEvent) => {
      Array.from(e.changedTouches).forEach(t => {
        if (t.clientX < window.innerWidth / 2) setLeftJoy({ active: true, base: { x: t.clientX, y: t.clientY }, current: { x: t.clientX, y: t.clientY } });
        else setRightJoy({ active: true, base: { x: t.clientX, y: t.clientY }, current: { x: t.clientX, y: t.clientY } });
      });
    };
    const tm = (e: TouchEvent) => {
      Array.from(e.changedTouches).forEach(t => {
        if (t.clientX < window.innerWidth / 2) setLeftJoy(prev => ({ ...prev, current: { x: t.clientX, y: t.clientY } }));
        else setRightJoy(prev => ({ ...prev, current: { x: t.clientX, y: t.clientY } }));
      });
    };
    const te = (e: TouchEvent) => {
      Array.from(e.changedTouches).forEach(t => {
        if (t.clientX < window.innerWidth / 2) setLeftJoy({ active: false, base: { x: 0, y: 0 }, current: { x: 0, y: 0 } });
        else {
          const l = playersRef.current.find(p => p.id === 'local');
          if (l) shoot(l, l.facing);
          setRightJoy({ active: false, base: { x: 0, y: 0 }, current: { x: 0, y: 0 } });
        }
      });
    };

    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    window.addEventListener('mousemove', mm); window.addEventListener('mousedown', md);
    window.addEventListener('touchstart', ts); window.addEventListener('touchmove', tm); window.addEventListener('touchend', te);

    const rs = () => { if (canvasRef.current) { canvasRef.current.width = window.innerWidth; canvasRef.current.height = window.innerHeight; } };
    window.addEventListener('resize', rs); rs();
    requestRef.current = requestAnimationFrame(update);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      window.removeEventListener('mousemove', mm); window.removeEventListener('mousedown', md);
      window.removeEventListener('touchstart', ts); window.removeEventListener('touchmove', tm); window.removeEventListener('touchend', te);
    };
  }, [update]);

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden touch-none">
      <canvas ref={canvasRef} />
      
      {/* HUD */}
      <div className="absolute top-4 left-4 flex gap-4 pointer-events-none select-none">
        <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full" style={{ backgroundColor: playerBrawler.color }}></div>
          <div>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-green-500" style={{ width: `${((uiPlayer?.hp || 0) / playerBrawler.hp) * 100}%` }}></div>
            </div>
            <p className="text-[10px] text-white font-bold mt-1">KILLS: {uiPlayer?.kills || 0}</p>
          </div>
        </div>
        <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 flex gap-1">
          {[...Array(MAX_AMMO)].map((_, i) => (
            <div key={i} className={`w-6 h-1.5 rounded-full ${i < Math.floor(uiPlayer?.ammo || 0) ? 'bg-orange-500' : 'bg-slate-800'}`}></div>
          ))}
        </div>
      </div>

      {/* Joysticks Visuals */}
      {leftJoy.active && (
        <div className="absolute pointer-events-none" style={{ left: leftJoy.base.x - 40, top: leftJoy.base.y - 40 }}>
           <div className="w-20 h-20 rounded-full border-2 border-white/20 bg-white/5 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white/30" style={{ transform: `translate(${Math.max(-30, Math.min(30, leftJoy.current.x - leftJoy.base.x))}px, ${Math.max(-30, Math.min(30, leftJoy.current.y - leftJoy.base.y))}px)` }}></div>
           </div>
        </div>
      )}

      {rightJoy.active && (
        <div className="absolute pointer-events-none" style={{ left: rightJoy.base.x - 40, top: rightJoy.base.y - 40 }}>
           <div className="w-20 h-20 rounded-full border-2 border-blue-500/20 bg-blue-500/5 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-blue-500/30" style={{ transform: `translate(${Math.max(-30, Math.min(30, rightJoy.current.x - rightJoy.base.x))}px, ${Math.max(-30, Math.min(30, rightJoy.current.y - rightJoy.base.y))}px)` }}></div>
           </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 pointer-events-none">
         <div className="w-16 h-16 rounded-full border-4 border-yellow-500/30 flex items-center justify-center bg-black/20">
            <div className="absolute bottom-0 left-0 w-full bg-yellow-500/20" style={{ height: `${uiPlayer?.superCharge || 0}%` }}></div>
            <i className={`fas fa-bolt text-2xl ${uiPlayer?.superCharge === 100 ? 'text-yellow-400 animate-pulse' : 'text-slate-700'}`}></i>
         </div>
      </div>
    </div>
  );
};

export default Game;
