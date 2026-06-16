import {
  BONUS_TYPE_ROTATION_INTERVAL,
  COLORS,
  ENEMY_HOMING_SHOT_BASE_SPEED,
  HEIGHT,
  PLAYER_MOUSE_FOLLOW_SLOWDOWN,
  SHOT_COOLDOWN,
  TWO_PI,
  WEAPON_BUFF_DURATION,
  WIDTH
} from '../config/constants';
import { createBoss } from '../entities/boss';
import { advanceBonusType, createBonus } from '../entities/bonuses';
import { createBullet, createEnemyBullet, createEnemyHomingBullet } from '../entities/bullets';
import { createEnemy, markRewardGroupEnemy } from '../entities/enemies';
import { createParticle } from '../entities/particles';
import { redrawPlayer } from '../entities/player';
import { drawVesselSegment, randomBonusColor } from '../render/drawing';
import { updateParallaxBackground } from '../render/parallaxBackground';
import type { EnemyTimelineEvent } from '../config/levels';
import type { BossEntity, EnemyBulletEntity, EnemyEntity, EnemyKind, ResultTitle, WeaponBonusType, WeaponType } from '../types/entities';
import { updateHud } from '../ui/hud';
import { clamp, distanceSquared, getAabb, randomRange, rectsIntersect, removeFromArray } from '../utils/math';
import { destroyEntity } from '../utils/pixi';
import { vesselBottomAt, vesselTopAt } from '../world/vessel';
import { enemyPlacementTForIndex, enemySpawnXForIndex } from './enemyPlacement';
import type { GameState } from './GameState';
import { getBackground, getHud } from './GameState';

const REWARD_GROUP_SIZE = 4;
const REWARD_GROUP_FIRST_SPAWN_TIME = 10;
const REWARD_GROUP_INTERVAL = 18;
const REWARD_GROUP_TOP_TIER_SCORE = 6;
const HEAVY_WEAPON_COOLDOWN = SHOT_COOLDOWN * 2.35;
const DEBUG_HITBOXES = true;
const DEBUG_HITBOX_COLOR = 0x00ff00;
const REWARD_GROUP_FORMATION: ReadonlyArray<{ x: number; y: number }> = [
  { x: 0, y: -42 },
  { x: 58, y: 0 },
  { x: 0, y: 42 },
  { x: -58, y: 0 }
];

export interface GameLoopCallbacks {
  endGame: (title: ResultTitle) => void;
  togglePause: () => void;
}

export class GameLoop {
  constructor(
    private readonly state: GameState,
    private readonly callbacks: GameLoopCallbacks
  ) {}

  update(delta: number): void {
    this.updateGlobalInput();
    this.updateGame(delta);
  }

  private updateGlobalInput(): void {
    const pauseKeyDown = Boolean(this.state.input.Escape || this.state.input.KeyP);
    if (pauseKeyDown && !this.state.lastPauseKeyDown) this.callbacks.togglePause();
    this.state.lastPauseKeyDown = pauseKeyDown;
  }

  private updateGame(delta: number): void {
    if (this.state.currentScene !== 'game' || this.state.isPaused || this.state.gameEnded || !this.state.layers || !this.state.player) return;
    this.state.elapsedTime += delta / 60;
    this.updateWeaponBuff(delta);
    this.updateBackground(delta);
    this.updatePlayer(delta);
    this.updateShooting(delta);
    this.updateEnemies(delta);
    this.updateBullets(delta);
    this.updateEnemyBullets(delta);
    this.updateBonuses(delta);
    this.updateParticles(delta);
    this.handleCollisions();
    this.updateDebugHitboxes();
    this.refreshHud();
  }

  private refreshHud(): void {
    if (!this.state.player) return;
    updateHud(getHud(this.state), {
      player: this.state.player,
      score: this.state.score,
      currentWeapon: this.state.currentWeapon,
      weaponBuffTimer: this.state.weaponBuffTimer,
      level: this.state.selectedLevel
    });
  }

  private updateDebugHitboxes(): void {
    const layer = this.state.layers?.hitboxDebugLayer;
    if (!layer) return;

    layer.clear();
    if (!DEBUG_HITBOXES) return;

    const drawEntityHitbox = (entity: Parameters<typeof getAabb>[0]): void => {
      if (!entity.hitRadius) return;
      const aabb = getAabb(entity);
      layer.lineStyle(2, DEBUG_HITBOX_COLOR, 1);
      layer.drawRect(aabb.x, aabb.y, aabb.width, aabb.height);
      layer.lineStyle(1, DEBUG_HITBOX_COLOR, 0.55);
      layer.drawCircle(entity.container.x, entity.container.y, entity.hitRadius);
    };

    if (this.state.player) drawEntityHitbox(this.state.player);
    this.state.enemies.forEach(drawEntityHitbox);
    if (this.state.boss) drawEntityHitbox(this.state.boss);
    this.state.enemyBullets.forEach(drawEntityHitbox);
    this.state.bullets.forEach(drawEntityHitbox);
    this.state.bonuses.forEach(drawEntityHitbox);
  }

  private updateWeaponBuff(delta: number): void {
    if (this.state.currentWeapon === 1) {
      this.state.weaponBuffTimer = 0;
      return;
    }

    this.state.weaponBuffTimer = Math.max(0, this.state.weaponBuffTimer - delta / 60);
    if (this.state.weaponBuffTimer <= 0) {
      this.state.currentWeapon = 1;
      this.state.weaponBuffTimer = 0;
    }
  }

  private updateBackground(delta: number): void {
    const background = getBackground(this.state);
    background.offset += this.state.selectedLevel.scrollSpeed * delta;
    if (background.parallax) updateParallaxBackground(background.parallax, background.offset);
    drawVesselSegment(background.graphics, background.offset, this.state.selectedLevel);
  }

  private updatePlayer(delta: number): void {
    const player = this.state.player;
    if (!player) return;

    let dx = 0;
    let dy = 0;
    const startX = player.container.x;
    const startY = player.container.y;
    if (this.state.input.ArrowLeft || this.state.input.KeyA) dx -= 1;
    if (this.state.input.ArrowRight || this.state.input.KeyD) dx += 1;
    if (this.state.input.ArrowUp || this.state.input.KeyW) dy -= 1;
    if (this.state.input.ArrowDown || this.state.input.KeyS) dy += 1;

    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy) || 1;
      dx /= length;
      dy /= length;
      player.container.x += dx * player.speed * delta;
      player.container.y += dy * player.speed * delta;
    } else if (this.state.pointer.active) {
      const slowdown = Math.max(1, PLAYER_MOUSE_FOLLOW_SLOWDOWN);
      const followFactor = 1 / slowdown;
      const nextX = player.container.x + (this.state.pointer.x - player.container.x) * followFactor;
      const nextY = player.container.y + (this.state.pointer.y - player.container.y) * followFactor;

      player.container.x = nextX;
      player.container.y = nextY;
    }

    const background = getBackground(this.state);
    const xForBounds = player.container.x + background.offset;
    const top = vesselTopAt(xForBounds, this.state.selectedLevel) + player.hitRadius + 12;
    const bottom = vesselBottomAt(xForBounds, this.state.selectedLevel) - player.hitRadius - 12;
    player.container.x = clamp(player.container.x, player.hitRadius + 10, WIDTH - player.hitRadius - 16);
    player.container.y = clamp(player.container.y, top, bottom);

    const movedRight = player.container.x > startX;
    const moved = player.container.x !== startX || player.container.y !== startY;
    player.amoebaTimer -= delta / 60;
    if (player.amoebaTimer <= 0) {
      player.amoebaTimer = 0.2;
      player.amoebaSeed += 0.55;
      redrawPlayer(player, moved && movedRight ? 1 : 0);
    }

    if (player.invulnerableTimer > 0) {
      player.invulnerableTimer -= delta / 60;
      player.blinkTimer += delta / 60;
      player.container.alpha = Math.sin(player.blinkTimer * 38) > 0 ? 0.5 : 1;
      if (player.invulnerableTimer <= 0) {
        player.container.alpha = 1;
      }
    }
  }

  private damagePlayer(amount = 1): void {
    const player = this.state.player;
    if (!player || player.invulnerableTimer > 0 || this.state.gameEnded) return;
    player.health = Math.max(0, player.health - amount);
    player.invulnerableTimer = 1;
    player.blinkTimer = 0;
    this.createParticles(player.container.x, player.container.y, COLORS.playerEdge, 5);
    this.refreshHud();
    if (player.health <= 0) {
      this.callbacks.endGame('ИГРА ОКОНЧЕНА');
    }
  }

  private updateShooting(delta: number): void {
    this.state.shotTimer = Math.max(0, this.state.shotTimer - delta / 60);
    if (this.state.input.Space || this.state.input.KeyZ) this.shoot();
  }

  private shoot(): void {
    const player = this.state.player;
    if (!player || this.state.shotTimer > 0 || !this.state.layers) return;
    this.state.shotTimer = this.state.currentWeapon === 5 ? HEAVY_WEAPON_COOLDOWN : SHOT_COOLDOWN;
    const x = player.container.x + player.hitRadius + 8;
    const y = player.container.y;

    if (this.state.currentWeapon === 1) {
      this.addPlayerBullet(1, x, y, 0);
    } else if (this.state.currentWeapon === 2) {
      this.addPlayerBullet(2, x, y, -Math.PI / 12);
      this.addPlayerBullet(2, x, y, 0);
      this.addPlayerBullet(2, x, y, Math.PI / 12);
    } else if (this.state.currentWeapon === 3) {
      this.addPlayerBullet(3, x, y, 0);
    } else if (this.state.currentWeapon === 4) {
      this.addPlayerBullet(4, x, y - 6, 0);
      this.addPlayerBullet(4, player.container.x - player.hitRadius - 8, y + 6, Math.PI);
    } else {
      this.addPlayerBullet(5, x + 4, y, 0);
    }
  }

  private addPlayerBullet(type: WeaponType, x: number, y: number, angle = 0): void {
    if (!this.state.layers) return;
    const bullet = createBullet(type, x, y, angle);
    this.state.layers.projectileLayer.addChild(bullet.container);
    this.state.bullets.push(bullet);
  }

  private addEnemyBullet(x: number, y: number, targetX: number, targetY: number, speed = 3.6, radius = 8): void {
    if (!this.state.layers) return;
    const bullet = createEnemyBullet(x, y, targetX, targetY, speed, radius);
    this.state.layers.projectileLayer.addChild(bullet.container);
    this.state.enemyBullets.push(bullet);
  }

  private addEnemyHomingBullet(x: number, y: number, targetX: number, targetY: number, speed = ENEMY_HOMING_SHOT_BASE_SPEED): void {
    if (!this.state.layers) return;
    const bullet = createEnemyHomingBullet(x, y, targetX, targetY, speed);
    this.state.layers.projectileLayer.addChild(bullet.container);
    this.state.enemyBullets.push(bullet);
  }

  private updateBullets(delta: number): void {
    for (let i = this.state.bullets.length - 1; i >= 0; i--) {
      const bullet = this.state.bullets[i];
      bullet.life -= delta / 60;

      if (bullet.weaponType === 3) {
        const target = this.findNearestThreat(bullet.container.x, bullet.container.y);
        if (target) {
          const desired = Math.atan2(target.container.y - bullet.container.y, target.container.x - bullet.container.x);
          let current = Math.atan2(bullet.vy, bullet.vx);
          let diff = desired - current;
          while (diff > Math.PI) diff -= TWO_PI;
          while (diff < -Math.PI) diff += TWO_PI;
          current += clamp(diff, -bullet.turnSpeed * delta, bullet.turnSpeed * delta);
          bullet.vx = Math.cos(current) * bullet.speed;
          bullet.vy = Math.sin(current) * bullet.speed;
          bullet.container.rotation = current;
        }
      }

      bullet.container.x += bullet.vx * delta;
      bullet.container.y += bullet.vy * delta;

      if (bullet.life <= 0 || bullet.container.x > WIDTH + 80 || bullet.container.x < -80 || bullet.container.y < -80 || bullet.container.y > HEIGHT + 80) {
        destroyEntity(bullet);
        this.state.bullets.splice(i, 1);
      }
    }
  }

  private findNearestThreat(x: number, y: number): EnemyEntity | BossEntity | EnemyBulletEntity | null {
    let best: EnemyEntity | BossEntity | EnemyBulletEntity | null = null;
    let bestDist = Infinity;
    const targets: Array<EnemyEntity | BossEntity | EnemyBulletEntity> = this.state.boss ? [...this.state.enemies, this.state.boss] : [...this.state.enemies];
    targets.push(...this.state.enemyBullets.filter((bullet) => bullet.bulletType === 'homing'));
    targets.forEach((target) => {
      if (!target || ('hp' in target && target.hp <= 0)) return;
      const dist = distanceSquared(x, y, target.container.x, target.container.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = target;
      }
    });
    return best;
  }

  private updateEnemies(delta: number): void {
    const level = this.state.selectedLevel;
    const scriptedAutoSuppressed = this.updateEnemyTimeline();
    const autoWavesAllowed = !level.enemyTimeline.enabled || level.enemyTimeline.autoWavesEnabled;
    this.state.waveTimer -= delta / 60;
    this.state.rewardGroupTimer -= delta / 60;
    if (!this.state.bossSpawned && autoWavesAllowed && !scriptedAutoSuppressed && this.state.waveTimer <= 0) {
      this.state.waveTimer = level.waveInterval;
      this.spawnWave();
    }

    if (!this.state.bossSpawned && this.state.rewardGroupTimer <= 0 && this.state.elapsedTime < level.bossAppearTime - 8) {
      this.state.rewardGroupTimer = REWARD_GROUP_INTERVAL;
      this.spawnRewardGroup();
    }

    if (!this.state.bossSpawned && this.state.elapsedTime >= level.bossAppearTime) {
      this.spawnBoss();
    }

    const background = getBackground(this.state);
    for (let i = this.state.enemies.length - 1; i >= 0; i--) {
      const enemy = this.state.enemies[i];
      enemy.wobble += 0.04 * delta;
      enemy.container.x -= enemy.speed * delta;
      enemy.container.y += Math.sin(enemy.wobble) * 0.55 * delta;
      enemy.container.rotation = Math.sin(enemy.wobble * 0.6) * 0.08;

      const top = vesselTopAt(enemy.container.x + background.offset, level) + enemy.hitRadius + 8;
      const bottom = vesselBottomAt(enemy.container.x + background.offset, level) - enemy.hitRadius - 8;
      enemy.container.y = clamp(enemy.container.y, top, bottom);

      if (enemy.kind === 'phage') {
        enemy.shootTimer -= delta / 60;
        enemy.homingShootTimer -= delta / 60;
        if (enemy.shootTimer <= 0 && this.state.player) {
          enemy.shootTimer = level.phageShootInterval;
          this.addEnemyBullet(enemy.container.x - 22, enemy.container.y + 8, this.state.player.container.x, this.state.player.container.y, 3.4 + level.id * 0.12, 7);
        }
        if (enemy.homingShootTimer <= 0 && this.state.player && enemy.container.x < WIDTH - 32) {
          enemy.homingShootTimer = level.phageHomingShootInterval;
          this.addEnemyHomingBullet(
            enemy.container.x - 24,
            enemy.container.y - 8,
            this.state.player.container.x,
            this.state.player.container.y,
            ENEMY_HOMING_SHOT_BASE_SPEED + level.id * 0.12
          );
        }
      }

      if (enemy.container.x < -90) {
        this.failRewardGroup(enemy);
        destroyEntity(enemy);
        this.state.enemies.splice(i, 1);
      }
    }

    this.updateBoss(delta);
  }

  private updateEnemyTimeline(): boolean {
    const timeline = this.state.selectedLevel.enemyTimeline;
    if (!timeline.enabled || this.state.bossSpawned) return false;

    let suppressAuto = false;
    timeline.events.forEach((event) => {
      const eventEnd = event.time + Math.max(0.1, event.duration);
      if (event.suppressAuto && this.state.elapsedTime >= event.time && this.state.elapsedTime <= eventEnd) suppressAuto = true;
      if (this.state.executedTimelineEventIds.has(event.id) || this.state.elapsedTime < event.time) return;
      this.state.executedTimelineEventIds.add(event.id);
      this.spawnTimelineEvent(event);
    });

    return suppressAuto;
  }

  private spawnWave(): void {
    if (!this.state.layers) return;
    const level = this.state.selectedLevel;
    const amount = Math.floor(randomRange(level.waveSize[0], level.waveSize[1]));
    for (let i = 0; i < amount; i++) {
      this.spawnEnemyAtIndex(this.pickEnemyFromLevelMix(), i, amount, 'scattered', [0.1, 0.9]);
    }
  }

  private spawnTimelineEvent(event: EnemyTimelineEvent): void {
    if (event.kind === 'reward') {
      this.spawnRewardGroup(event);
      return;
    }
    if (event.kind === 'suppressAuto' || event.count <= 0) return;

    for (let i = 0; i < event.count; i++) {
      this.spawnEnemyAtIndex(this.pickEnemyFromTimelineEvent(event), i, event.count, event.formation, event.yRange, event.duration, event.id);
    }
  }

  private pickEnemyFromLevelMix(): EnemyKind {
    const level = this.state.selectedLevel;
    const progress = clamp(this.state.elapsedTime / level.bossAppearTime, 0, 1);
    const roll = Math.random();
    const coccusChance = level.enemyMix.coccusStart + (level.enemyMix.coccusEnd - level.enemyMix.coccusStart) * progress;
    const bacillusChance = level.enemyMix.bacillusStart + (level.enemyMix.bacillusEnd - level.enemyMix.bacillusStart) * progress;
    if (roll < coccusChance) return 'coccus';
    if (roll < coccusChance + bacillusChance) return 'bacillus';
    return 'phage';
  }

  private pickEnemyFromTimelineEvent(event: EnemyTimelineEvent): EnemyKind {
    if (event.enemyType === 'mixed') return this.pickEnemyFromLevelMix();
    return event.enemyType;
  }

  private spawnEnemyAtIndex(type: EnemyKind, index: number, total: number, formation: EnemyTimelineEvent['formation'], yRange: readonly [number, number], duration = 0, seed = `auto-${Math.floor(this.state.elapsedTime)}`): void {
    if (!this.state.layers) return;
    const level = this.state.selectedLevel;
    const x = enemySpawnXForIndex(index, duration, seed);
    const top = vesselTopAt(x, level) + 48;
    const bottom = vesselBottomAt(x, level) - 48;
    const yT = enemyPlacementTForIndex(index, total, formation, yRange, seed);
    const y = top + (bottom - top) * yT;
    const enemy = createEnemy(type, x, y);
    enemy.speed *= level.enemySpeedMultiplier;
    enemy.hp += level.enemyHpBonus;
    enemy.maxHp += level.enemyHpBonus;
    enemy.value += level.id - 1;
    this.state.layers.entityLayer.addChild(enemy.container);
    this.state.enemies.push(enemy);
  }

  private spawnRewardGroup(event?: EnemyTimelineEvent): void {
    const layers = this.state.layers;
    if (!layers) return;
    const level = this.state.selectedLevel;
    const groupId = this.state.nextRewardGroupId++;
    const anchorX = WIDTH + 128;
    const minY = vesselTopAt(anchorX, level) + 96;
    const maxY = vesselBottomAt(anchorX, level) - 96;
    const yRange = event?.yRange;
    const anchorY = yRange ? minY + (maxY - minY) * clamp((yRange[0] + yRange[1]) / 2, 0, 1) : clamp(HEIGHT / 2, minY, maxY);
    this.state.rewardGroups.set(groupId, { id: groupId, remaining: REWARD_GROUP_SIZE, failed: false });

    REWARD_GROUP_FORMATION.forEach((offset) => {
      const x = anchorX + offset.x;
      const top = vesselTopAt(x, level) + 56;
      const bottom = vesselBottomAt(x, level) - 56;
      const y = clamp(anchorY + offset.y, top, bottom);
      const enemy = createEnemy('coccus', x, y);
      enemy.speed = 1.75 * level.enemySpeedMultiplier;
      enemy.hp += level.enemyHpBonus;
      enemy.maxHp += level.enemyHpBonus;
      enemy.value += level.id;
      markRewardGroupEnemy(enemy, groupId);
      layers.entityLayer.addChild(enemy.container);
      this.state.enemies.push(enemy);
    });
  }

  private spawnBoss(): void {
    if (!this.state.layers) return;
    const level = this.state.selectedLevel;
    const boss = createBoss();
    boss.hp = level.bossHp;
    boss.maxHp = level.bossHp;
    boss.value = level.bossValue;
    boss.shootTimer = level.bossShootInterval;
    boss.homingShootTimer = Math.min(3.8, level.bossHomingShootInterval);
    this.state.boss = boss;
    this.state.bossSpawned = true;
    this.state.layers.entityLayer.addChild(boss.container);
  }

  private updateBoss(delta: number): void {
    const boss = this.state.boss;
    if (!boss) return;
    const level = this.state.selectedLevel;
    const background = getBackground(this.state);
    boss.phase += delta / 60;
    if (!boss.entered) {
      boss.container.x -= 1.45 * delta;
      if (boss.container.x <= WIDTH - 138) boss.entered = true;
    } else {
      boss.container.x = WIDTH - 138 + Math.sin(boss.phase * 0.9) * 22;
      boss.container.y = HEIGHT / 2 + Math.sin(boss.phase * 1.35) * 112;
      const top = vesselTopAt(boss.container.x + background.offset, level) + boss.hitRadius;
      const bottom = vesselBottomAt(boss.container.x + background.offset, level) - boss.hitRadius;
      boss.container.y = clamp(boss.container.y, top, bottom);

      boss.shootTimer -= delta / 60;
      boss.homingShootTimer -= delta / 60;
      if (boss.shootTimer <= 0 && this.state.player) {
        boss.shootTimer = level.bossShootInterval;
        const base = Math.atan2(this.state.player.container.y - boss.container.y, this.state.player.container.x - boss.container.x);
        [-0.34, -0.17, 0, 0.17, 0.34].forEach((spread) => {
          const targetX = boss.container.x + Math.cos(base + spread) * 100;
          const targetY = boss.container.y + Math.sin(base + spread) * 100;
          this.addEnemyBullet(boss.container.x - 72, boss.container.y, targetX, targetY, 3.1 + level.id * 0.1, 9);
        });
      }
      if (boss.homingShootTimer <= 0 && this.state.player) {
        boss.homingShootTimer = level.bossHomingShootInterval;
        this.addEnemyHomingBullet(
          boss.container.x - 82,
          boss.container.y,
          this.state.player.container.x,
          this.state.player.container.y,
          ENEMY_HOMING_SHOT_BASE_SPEED + level.id * 0.16
        );
      }
    }
  }

  private updateEnemyBullets(delta: number): void {
    for (let i = this.state.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.state.enemyBullets[i];
      bullet.life -= delta / 60;

      if (bullet.bulletType === 'homing' && this.state.player) {
        const desired = Math.atan2(this.state.player.container.y - bullet.container.y, this.state.player.container.x - bullet.container.x);
        let current = Math.atan2(bullet.vy, bullet.vx);
        let diff = desired - current;
        while (diff > Math.PI) diff -= TWO_PI;
        while (diff < -Math.PI) diff += TWO_PI;
        current += clamp(diff, -bullet.turnSpeed * delta, bullet.turnSpeed * delta);
        bullet.vx = Math.cos(current) * bullet.speed;
        bullet.vy = Math.sin(current) * bullet.speed;
        bullet.container.rotation = current;
      }

      bullet.container.x += bullet.vx * delta;
      bullet.container.y += bullet.vy * delta;
      if (bullet.life <= 0 || bullet.container.x < -80 || bullet.container.x > WIDTH + 80 || bullet.container.y < -80 || bullet.container.y > HEIGHT + 80) {
        destroyEntity(bullet);
        this.state.enemyBullets.splice(i, 1);
      }
    }
  }

  private updateBonuses(delta: number): void {
    for (let i = this.state.bonuses.length - 1; i >= 0; i--) {
      const bonus = this.state.bonuses[i];
      bonus.wobble += 0.08 * delta;
      bonus.rotationTimer -= delta / 60;
      while (bonus.rotationTimer <= 0 && bonus.availableTypes.length > 1) {
        bonus.rotationTimer += BONUS_TYPE_ROTATION_INTERVAL;
        advanceBonusType(bonus);
      }
      bonus.container.x += bonus.vx * delta;
      bonus.container.y += Math.sin(bonus.wobble) * 0.35 * delta;
      bonus.container.rotation += 0.035 * delta;
      if (bonus.container.x < -50) {
        destroyEntity(bonus);
        this.state.bonuses.splice(i, 1);
      }
    }
  }

  private updateParticles(delta: number): void {
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const particle = this.state.particles[i];
      particle.life -= delta / 60;
      particle.container.x += particle.vx * delta;
      particle.container.y += particle.vy * delta;
      particle.container.alpha = clamp(particle.life / particle.maxLife, 0, 1);
      particle.container.scale.set(0.75 + particle.container.alpha * 0.45);
      if (particle.life <= 0) {
        destroyEntity(particle);
        this.state.particles.splice(i, 1);
      }
    }
  }

  private handleCollisions(): void {
    for (let i = this.state.bullets.length - 1; i >= 0; i--) {
      const bullet = this.state.bullets[i];
      let consumed = false;

      for (let j = this.state.enemyBullets.length - 1; j >= 0 && !consumed; j--) {
        const enemyBullet = this.state.enemyBullets[j];
        if (enemyBullet.bulletType !== 'homing') continue;
        if (rectsIntersect(getAabb(bullet), getAabb(enemyBullet))) {
          this.hitEnemyBullet(enemyBullet, bullet.damage);
          this.createParticles(bullet.container.x, bullet.container.y, randomBonusColor(bullet.weaponType), 4);
          destroyEntity(bullet);
          this.state.bullets.splice(i, 1);
          consumed = true;
        }
      }

      for (let j = this.state.enemies.length - 1; j >= 0 && !consumed; j--) {
        const enemy = this.state.enemies[j];
        if (rectsIntersect(getAabb(bullet), getAabb(enemy))) {
          this.hitEnemy(enemy, bullet.damage);
          this.createParticles(bullet.container.x, bullet.container.y, randomBonusColor(bullet.weaponType));
          destroyEntity(bullet);
          this.state.bullets.splice(i, 1);
          consumed = true;
        }
      }

      if (!consumed && this.state.boss && rectsIntersect(getAabb(bullet), getAabb(this.state.boss))) {
        this.hitBoss(bullet.damage);
        this.createParticles(bullet.container.x, bullet.container.y, COLORS.boss, 5);
        destroyEntity(bullet);
        this.state.bullets.splice(i, 1);
      }
    }

    const player = this.state.player;
    if (!player || this.state.gameEnded) return;
    const playerAabb = getAabb(player);

    for (let i = this.state.enemies.length - 1; i >= 0; i--) {
      const enemy = this.state.enemies[i];
      if (rectsIntersect(playerAabb, getAabb(enemy))) {
        this.failRewardGroup(enemy);
        this.createParticles(enemy.container.x, enemy.container.y, 0xffb6a8, 5);
        destroyEntity(enemy);
        this.state.enemies.splice(i, 1);
        this.damagePlayer(1);
      }
    }

    if (this.state.boss && rectsIntersect(playerAabb, getAabb(this.state.boss))) {
      this.damagePlayer(1);
    }

    for (let i = this.state.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.state.enemyBullets[i];
      if (rectsIntersect(playerAabb, getAabb(bullet))) {
        this.createParticles(bullet.container.x, bullet.container.y, bullet.bulletType === 'homing' ? COLORS.enemyHomingShot : COLORS.enemyShot, bullet.bulletType === 'homing' ? 6 : 4);
        destroyEntity(bullet);
        this.state.enemyBullets.splice(i, 1);
        this.damagePlayer(1);
      }
    }

    for (let i = this.state.bonuses.length - 1; i >= 0; i--) {
      const bonus = this.state.bonuses[i];
      if (rectsIntersect(playerAabb, getAabb(bonus))) {
        this.collectWeaponBonus(bonus.type);
        this.createParticles(bonus.container.x, bonus.container.y, randomBonusColor(bonus.type), 5);
        destroyEntity(bonus);
        this.state.bonuses.splice(i, 1);
        this.refreshHud();
      }
    }
  }

  private hitEnemy(enemy: EnemyEntity, damage: number): void {
    enemy.hp -= damage;
    enemy.container.scale.set(enemy.baseScale * 1.08);
    window.setTimeout(() => {
      if (enemy.container && enemy.container.parent) enemy.container.scale.set(enemy.baseScale);
    }, 70);

    if (enemy.hp <= 0) {
      this.state.score += enemy.value;
      this.resolveRewardGroupKill(enemy);
      this.createParticles(enemy.container.x, enemy.container.y, enemy.kind === 'coccus' ? COLORS.coccus : enemy.kind === 'bacillus' ? COLORS.bacillus : COLORS.phage, 5);
      removeFromArray(this.state.enemies, enemy);
      destroyEntity(enemy);
      this.refreshHud();
    }
  }

  private hitEnemyBullet(enemyBullet: EnemyBulletEntity, damage: number): void {
    enemyBullet.hp -= damage;
    enemyBullet.container.scale.set(1.12);
    window.setTimeout(() => {
      if (enemyBullet.container && enemyBullet.container.parent) enemyBullet.container.scale.set(1);
    }, 70);

    if (enemyBullet.hp <= 0) {
      this.createParticles(enemyBullet.container.x, enemyBullet.container.y, COLORS.enemyHomingShot, 7);
      removeFromArray(this.state.enemyBullets, enemyBullet);
      destroyEntity(enemyBullet);
      this.state.score += 1;
      this.refreshHud();
    }
  }

  private hitBoss(damage: number): void {
    const boss = this.state.boss;
    if (!boss) return;
    boss.hp -= damage;
    boss.container.scale.set(boss.baseScale * 1.035);
    window.setTimeout(() => {
      if (this.state.boss && this.state.boss.container && this.state.boss.container.parent) this.state.boss.container.scale.set(boss.baseScale);
    }, 70);

    if (boss.hp <= 0) {
      this.state.score += boss.value;
      this.createParticles(boss.container.x, boss.container.y, COLORS.boss, 18);
      destroyEntity(boss);
      this.state.boss = null;
      this.refreshHud();
      this.callbacks.endGame('ПОБЕДА');
    }
  }

  private failRewardGroup(enemy: EnemyEntity): void {
    if (enemy.rewardGroupId === undefined) return;
    const group = this.state.rewardGroups.get(enemy.rewardGroupId);
    if (!group) return;
    group.failed = true;
    group.remaining = Math.max(0, group.remaining - 1);
    if (group.remaining <= 0) this.state.rewardGroups.delete(group.id);
  }

  private resolveRewardGroupKill(enemy: EnemyEntity): void {
    if (enemy.rewardGroupId === undefined) return;
    const group = this.state.rewardGroups.get(enemy.rewardGroupId);
    if (!group) return;
    group.remaining = Math.max(0, group.remaining - 1);
    if (group.remaining > 0) return;

    this.state.rewardGroups.delete(group.id);
    if (!group.failed) this.spawnEarnedWeaponBonus(enemy.container.x, enemy.container.y);
  }

  private spawnEarnedWeaponBonus(x: number, y: number): void {
    if (!this.state.layers) return;
    const availableTypes = this.getAvailableBonusWeaponTypes();
    const bonus = createBonus(availableTypes, x, y);
    bonus.vx = -0.8;
    this.state.layers.entityLayer.addChild(bonus.container);
    this.state.bonuses.push(bonus);
  }

  private getAvailableBonusWeaponTypes(): readonly WeaponBonusType[] {
    return this.state.selectedLevel.availableWeaponBonuses;
  }

  private collectWeaponBonus(type: WeaponBonusType): void {
    const availableTypes = this.getAvailableBonusWeaponTypes();
    const safeType = availableTypes.includes(type) ? type : availableTypes[0] ?? 2;
    this.state.currentWeapon = safeType;
    this.state.weaponBuffTimer += WEAPON_BUFF_DURATION;
    this.state.score += Math.max(0, safeType - 2);
  }

  private createParticles(x: number, y: number, color: number, count = Math.floor(randomRange(3, 6))): void {
    if (!this.state.layers) return;
    for (let i = 0; i < count; i++) {
      const particle = createParticle(x, y, color);
      this.state.layers.particleLayer.addChild(particle.container);
      this.state.particles.push(particle);
    }
  }
}
