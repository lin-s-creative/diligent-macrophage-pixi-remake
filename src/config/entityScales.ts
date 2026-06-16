/**
 * Visual size multipliers per entity type.
 *
 * Designer-facing: tweak these numbers to make entities bigger or smaller.
 *   1.0  = base size (default)
 *   1.5  = 50% bigger
 *   0.75 = 25% smaller
 *
 * The rendered sprite, the hitbox (collision radius), and any transient
 * animations (hit-flash pulse, etc.) all scale together, so balance stays
 * consistent: a bigger entity is easier to hit, a smaller one harder.
 *
 * Affects:
 *   - src/entities/enemies.ts (createEnemy)
 *   - src/entities/boss.ts    (createBoss)
 *   - src/entities/player.ts  (createPlayer)
 */
export const ENEMY_VISUAL_SCALES = {
  coccus: 0.5,
  bacillus: 0.5,
  phage: 0.5,
  boss: 0.5
} as const;

export type ScalableEnemyKind = keyof typeof ENEMY_VISUAL_SCALES;

/** Visual + hitbox scale for the player macrophage. */
export const PLAYER_VISUAL_SCALE = 0.5;
