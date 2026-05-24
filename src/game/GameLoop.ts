 import { BOSS_APPEAR_TIME, BG_SCROLL_SPEED, COLORS, HEIGHT, PLAYER_RADIUS, SHOT_COOLDOWN, TWO_PI, WAVE_INTERVAL, WIDTH } from '../config/constants';
import { createBoss } from '../entities/boss';
import { createBonus } from '../entities/bonuses';
import { createBullet, createEnemyBullet } from '../entities/bullets';
import { createEnemy } from '../entities/enemies';
import { createParticle } from '../entities/particles';
import { redrawPlayer } from '../entities/player';
import { drawVesselSegment, randomBonusColor, randomWeaponType } from '../render/drawing';
import type { BossEntity, EnemyEntity, EnemyKind, ResultTitle } from '../types/entities';
import { updateHud } from '../ui/hud';
import { clamp, distanceSquared, getAabb, randomRange, rectsIntersect, removeFromArray } from '../utils/math';
import { destroyEntity } from '../utils/pixi';
import { vesselBottomAt, vesselTopAt } from '../world/vessel';
import type { GameState } from './GameState';
import { getBackground, getHud } from './GameState';

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
    this.updateBackground(delta);
    this.updatePlayer(delta);
    this.updateShooting(delta);
    this.updateEnemies(delta);
    this.updateBullets(delta);
    this.updateEnemyBullets(delta);
    this.updateBonuses(delta);
    this.updateParticles(delta);
    this.handleCollisions();
    this.refreshHud();
  }

  private refreshHud(): void {
    if (!this.state.player) return;
    updateHud(getHud(this.state), {
      player: this.state.player,
      score: this.state.score,
      currentWeapon: this.state.currentWeapon
    });
  }

  private updateBackground(delta: number): void {
    const background = getBackground(this.state);
    background.offset += BG_SCROLL_SPEED * delta;
    drawVesselSegment(background.graphics, background.offset);
  }

  private updatePlayer(delta: number): void {
    const player = this.state.player;
    if (!player) return;

    let dx = 0;
    let dy = 0;
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
    }

    const background = getBackground(this.state);
    const xForBounds = player.container.x + background.offset;
    const top = vesselTopAt(xForBounds) + PLAYER_RADIUS + 12;
    const bottom = vesselBottomAt(xForBounds) - PLAYER_RADIUS - 12;
    player.container.x = clamp(player.container.x, PLAYER_RADIUS + 10, WIDTH - PLAYER_RADIUS - 16);
    player.container.y = clamp(player.container.y, top, bottom);

    player.amoebaTimer -= delta / 60;
    if (player.amoebaTimer <= 0) {
      player.amoebaTimer = 0.2;
      player.amoebaSeed += 0.55;
      redrawPlayer(player, dx > 0 ? 1 : 0);
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
    this.state.shotTimer = SHOT_COOLDOWN;
    const x = player.container.x + PLAYER_RADIUS + 8;
    const y = player.container.y;

    if (this.state.currentWeapon === 1) {
      this.addPlayerBullet(1, x, y, 0);
    } else if (this.state.currentWeapon === 2) {
      this.addPlayerBullet(2, x, y, -Math.PI / 12);
      this.addPlayerBullet(2, x, y, 0);
      this.addPlayerBullet(2, x, y, Math.PI / 12);
    } else {
      this.addPlayerBullet(3, x, y, 0);
    }
  }

  private addPlayerBullet(type: 1 | 2 | 3, x: number, y: number, angle = 0): void {
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

  private updateBullets(delta: number): void {
    for (let i = this.state.bullets.length - 1; i >= 0; i--) {
      const bullet = this.state.bullets[i];
      bullet.life -= delta / 60;

      if (bullet.weaponType === 3) {
        const target = this.findNearestEnemy(bullet.container.x, bullet.container.y);
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

  private findNearestEnemy(x: number, y: number): EnemyEntity | BossEntity | null {
    let best: EnemyEntity | BossEntity | null = null;
    let bestDist = Infinity;
    const targets: Array<EnemyEntity | BossEntity> = this.state.boss ? [...this.state.enemies, this.state.boss] : [...this.state.enemies];
    targets.forEach((enemy) => {
      if (!enemy || enemy.hp <= 0) return;
      const dist = distanceSquared(x, y, enemy.container.x, enemy.container.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = enemy;
      }
    });
    return best;
  }

  private updateEnemies(delta: number): void {
    this.state.waveTimer -= delta / 60;
    if (!this.state.bossSpawned && this.state.waveTimer <= 0) {
      this.state.waveTimer = WAVE_INTERVAL;
      this.spawnWave();
    }

    if (!this.state.bossSpawned && this.state.elapsedTime >= BOSS_APPEAR_TIME) {
      this.spawnBoss();
    }

    const background = getBackground(this.state);
    for (let i = this.state.enemies.length - 1; i >= 0; i--) {
      const enemy = this.state.enemies[i];
      enemy.wobble += 0.04 * delta;
      enemy.container.x -= enemy.speed * delta;
      enemy.container.y += Math.sin(enemy.wobble) * 0.55 * delta;
      enemy.container.rotation = Math.sin(enemy.wobble * 0.6) * 0.08;

      const top = vesselTopAt(enemy.container.x + background.offset) + enemy.hitRadius + 8;
      const bottom = vesselBottomAt(enemy.container.x + background.offset) - enemy.hitRadius - 8;
      enemy.container.y = clamp(enemy.container.y, top, bottom);

      if (enemy.kind === 'phage') {
        enemy.shootTimer -= delta / 60;
        if (enemy.shootTimer <= 0 && this.state.player) {
          enemy.shootTimer = 1.5;
          this.addEnemyBullet(enemy.container.x - 22, enemy.container.y + 8, this.state.player.container.x, this.state.player.container.y, 3.4, 7);
        }
      }

      if (enemy.container.x < -90) {
        destroyEntity(enemy);
        this.state.enemies.splice(i, 1);
      }
    }

    this.updateBoss(delta);
  }

  private spawnWave(): void {
    if (!this.state.layers) return;
    const amount = Math.floor(randomRange(2, 5));
    for (let i = 0; i < amount; i++) {
      const progress = clamp(this.state.elapsedTime / 55, 0, 1);
      const roll = Math.random();
      let type: EnemyKind = 'coccus';
      if (roll < 0.55 - progress * 0.22) type = 'coccus';
      else if (roll < 0.86 - progress * 0.08) type = 'bacillus';
      else type = 'phage';

      const x = WIDTH + 40 + i * randomRange(34, 76);
      const y = randomRange(vesselTopAt(x) + 48, vesselBottomAt(x) - 48);
      const enemy = createEnemy(type, x, y);
      this.state.layers.entityLayer.addChild(enemy.container);
      this.state.enemies.push(enemy);
    }
  }

  private spawnBoss(): void {
    if (!this.state.layers) return;
    const boss = createBoss();
    this.state.boss = boss;
    this.state.bossSpawned = true;
    this.state.layers.entityLayer.addChild(boss.container);
  }

  private updateBoss(delta: number): void {
    const boss = this.state.boss;
    if (!boss) return;
    const background = getBackground(this.state);
    boss.phase += delta / 60;
    if (!boss.entered) {
      boss.container.x -= 1.45 * delta;
      if (boss.container.x <= WIDTH - 138) boss.entered = true;
    } else {
      boss.container.x = WIDTH - 138 + Math.sin(boss.phase * 0.9) * 22;
      boss.container.y = HEIGHT / 2 + Math.sin(boss.phase * 1.35) * 112;
      const top = vesselTopAt(boss.container.x + background.offset) + boss.hitRadius;
      const bottom = vesselBottomAt(boss.container.x + background.offset) - boss.hitRadius;
      boss.container.y = clamp(boss.container.y, top, bottom);

      boss.shootTimer -= delta / 60;
      if (boss.shootTimer <= 0 && this.state.player) {
        boss.shootTimer = 1.2;
        const base = Math.atan2(this.state.player.container.y - boss.container.y, this.state.player.container.x - boss.container.x);
        [-0.34, -0.17, 0, 0.17, 0.34].forEach((spread) => {
          const targetX = boss.container.x + Math.cos(base + spread) * 100;
          const targetY = boss.container.y + Math.sin(base + spread) * 100;
          this.addEnemyBullet(boss.container.x - 72, boss.container.y, targetX, targetY, 3.1, 9);
        });
      }
    }
  }

  private updateEnemyBullets(delta: number): void {
    for (let i = this.state.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.state.enemyBullets[i];
      bullet.life -= delta / 60;
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

      for (let j = this.state.enemies.length - 1; j >= 0 && !consumed; j--) {
        const enemy = this.state.enemies[j];
        if (rectsIntersect(getAabb(bullet), getAabb(enemy))) {
          this.hitEnemy(enemy, bullet.damage);
          this.createParticles(bullet.container.x, bullet.container.y, bullet.weaponType === 1 ? COLORS.redWeapon : bullet.weaponType === 2 ? COLORS.blueWeapon : COLORS.yellowWeapon);
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
        this.createParticles(bullet.container.x, bullet.container.y, COLORS.enemyShot, 4);
        destroyEntity(bullet);
        this.state.enemyBullets.splice(i, 1);
        this.damagePlayer(1);
      }
    }

    for (let i = this.state.bonuses.length - 1; i >= 0; i--) {
      const bonus = this.state.bonuses[i];
      if (rectsIntersect(playerAabb, getAabb(bonus))) {
        this.state.currentWeapon = bonus.type;
        this.createParticles(bonus.container.x, bonus.container.y, randomBonusColor(bonus.type), 5);
        destroyEntity(bonus);
        this.state.bonuses.splice(i, 1);
        this.refreshHud();
      }
    }
  }

  private hitEnemy(enemy: EnemyEntity, damage: number): void {
    enemy.hp -= damage;
    enemy.container.scale.set(1.08);
    window.setTimeout(() => {
      if (enemy.container && enemy.container.parent) enemy.container.scale.set(1);
    }, 70);

    if (enemy.hp <= 0) {
      this.state.score += enemy.value;
      this.maybeDropBonus(enemy.container.x, enemy.container.y);
      this.createParticles(enemy.container.x, enemy.container.y, enemy.kind === 'coccus' ? COLORS.coccus : enemy.kind === 'bacillus' ? COLORS.bacillus : COLORS.phage, 5);
      removeFromArray(this.state.enemies, enemy);
      destroyEntity(enemy);
      this.refreshHud();
    }
  }

  private hitBoss(damage: number): void {
    const boss = this.state.boss;
    if (!boss) return;
    boss.hp -= damage;
    boss.container.scale.set(1.035);
    window.setTimeout(() => {
      if (this.state.boss && this.state.boss.container && this.state.boss.container.parent) this.state.boss.container.scale.set(1);
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

  private maybeDropBonus(x: number, y: number): void {
    if (Math.random() > 0.25 || !this.state.layers) return;
    const bonus = createBonus(randomWeaponType(), x, y);
    this.state.layers.entityLayer.addChild(bonus.container);
    this.state.bonuses.push(bonus);
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
