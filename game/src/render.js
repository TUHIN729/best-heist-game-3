// The Midnight Gala — canvas renderer. Draws the museum, the gala crowd, the
// guards and their vision cones, the cameras, the lasers, the thief and the HUD.
import { FIELD, COLORS, LOOT, GUARD, CAMERA, LASER, ALARM, GETAWAY_SECONDS } from './config.js';
import { WALLS, EXIT, laserOn } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

function drawCone(ctx, x, y, angle, range, halfAngle, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawGuard(ctx, g, state) {
  const sees = g.sure > 0;
  drawCone(ctx, g.x, g.y, g.angle, GUARD.visionRange * (state.blend ? 0.45 : 1),
    GUARD.visionHalfAngle * (state.blend ? 0.7 : 1),
    sees ? COLORS.guardConeSeen : COLORS.guardCone);
  ctx.beginPath();
  ctx.arc(g.x, g.y, GUARD.radius, 0, Math.PI * 2);
  ctx.fillStyle = g.stagger > 0 ? '#5a5a6e' : COLORS.guard;
  ctx.fill();
  ctx.strokeStyle = '#d8c27a';
  ctx.lineWidth = 2;
  ctx.stroke();
  // facing tick + cap
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.angle) * (GUARD.radius + 6), g.y + Math.sin(g.angle) * (GUARD.radius + 6));
  ctx.strokeStyle = '#e8e2d0';
  ctx.lineWidth = 3;
  ctx.stroke();
  if (g.sure > 0) {
    ctx.fillStyle = '#ff5a4d';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - GUARD.radius - 8);
  }
}

function drawCamera(ctx, c, state) {
  const angle = c.angle ?? c.base;
  const off = state.emp > 0;
  if (!off) drawCone(ctx, c.x, c.y, angle, CAMERA.range, CAMERA.halfAngle, COLORS.cameraCone);
  ctx.beginPath();
  ctx.arc(c.x, c.y, 9, 0, Math.PI * 2);
  ctx.fillStyle = off ? '#555' : '#c22e2e';
  ctx.fill();
  ctx.strokeStyle = '#e8e2d0';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(c.x, c.y);
  ctx.lineTo(c.x + Math.cos(angle) * 16, c.y + Math.sin(angle) * 16);
  ctx.strokeStyle = '#e8e2d0';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawGuest(ctx, g) {
  ctx.beginPath();
  ctx.arc(g.x, g.y, 11, 0, Math.PI * 2);
  ctx.fillStyle = g.color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(240,230,210,0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // champagne glass glint
  ctx.beginPath();
  ctx.arc(g.x + 7, g.y - 6, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffe9a8';
  ctx.fill();
}

export function render(ctx, state, screen) {
  const W = FIELD.width;
  const H = FIELD.height;
  ctx.clearRect(0, 0, W, H);

  // --- floor: marble checker ---
  for (let y = 0; y < 9; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
      ctx.fillRect(x * 80, y * 80, 80, 80);
    }
  }
  // red carpet down the gala floor
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(560, 300, 160, 396);
  ctx.fillStyle = COLORS.carpetEdge;
  ctx.fillRect(556, 300, 4, 396);
  ctx.fillRect(720, 300, 4, 396);
  // vault floor
  ctx.fillStyle = COLORS.vaultFloor;
  ctx.fillRect(504, 24, 272, 156);

  // --- walls ---
  for (const w of WALLS) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 4);
  }
  // exit glow
  ctx.fillStyle = 'rgba(125, 220, 138, 0.25)';
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = COLORS.ok;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', 640, 690);

  // --- paintings (on the gallery walls) ---
  for (const art of state.paintings) {
    if (art.taken) continue;
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(art.x - 22, art.y - 16, 44, 32);
    ctx.fillStyle = '#3a2a4a';
    ctx.fillRect(art.x - 18, art.y - 12, 36, 24);
    ctx.fillStyle = '#e8d27a';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('◈', art.x, art.y + 4);
  }

  // --- the diamond pedestal ---
  if (!state.diamond.taken) {
    const pulse = 1 + 0.12 * Math.sin(state.time * 4);
    ctx.save();
    ctx.translate(LOOT.diamond.x, LOOT.diamond.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#8a6d1f';
    ctx.fillRect(-14, 6, 28, 8);
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(12, -2);
    ctx.lineTo(0, 8);
    ctx.lineTo(-12, -2);
    ctx.closePath();
    ctx.fillStyle = COLORS.diamond;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ STAR OF MERIDIAN ★', 640, 150);
  }

  // --- lasers ---
  for (const beam of LASER.beams) {
    const on = laserOn(beam, state.time);
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y);
    ctx.lineTo(beam.x2, beam.y);
    ctx.strokeStyle = on ? COLORS.laser : COLORS.laserOff;
    ctx.lineWidth = on ? 3 : 1.5;
    ctx.stroke();
    if (on) {
      ctx.beginPath();
      ctx.arc(beam.x1, beam.y, 4, 0, Math.PI * 2);
      ctx.arc(beam.x2, beam.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.laser;
      ctx.fill();
    }
  }
  ctx.fillStyle = COLORS.muted;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LASER GRID — time your crossing', 486, 292);

  // --- guests, cameras, guards ---
  for (const g of state.guests) drawGuest(ctx, g);
  for (const c of state.cameras) drawCamera(ctx, c, state);
  for (const g of state.guards) drawGuard(ctx, g, state);

  // --- smoke cloud ---
  if (state.smoke > 0) {
    ctx.fillStyle = 'rgba(200, 200, 210, 0.35)';
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, 90, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- the thief ---
  const p = state.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.thief;
  ctx.fill();
  ctx.strokeStyle = state.blend ? '#7ddc8a' : COLORS.thiefShirt;
  ctx.lineWidth = 2;
  ctx.stroke();
  // white shirt front + bow tie
  ctx.beginPath();
  ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.thiefShirt;
  ctx.fill();
  ctx.fillStyle = '#c22e2e';
  ctx.fillRect(p.x - 3, p.y - 2, 6, 3);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VESPER', p.x, p.y - 20);

  if (screen === SCREEN_PLAY) drawHud(ctx, state);
  if (screen === SCREEN_TITLE) drawTitle(ctx);
  if (screen === SCREEN_OVER) drawOver(ctx, state);
}

function drawHud(ctx, state) {
  // top bar
  ctx.fillStyle = 'rgba(10, 8, 16, 0.72)';
  ctx.fillRect(0, 0, FIELD.width, 40);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`LOOT  $${state.lootValue.toLocaleString()}`, 16, 26);
  // alarm meter
  const ax = 300;
  const aw = 260;
  ctx.fillStyle = '#3a2020';
  ctx.fillRect(ax, 12, aw, 16);
  ctx.fillStyle = state.alarm > 60 ? COLORS.alarm : COLORS.gold;
  ctx.fillRect(ax, 12, (aw * state.alarm) / ALARM.max, 16);
  ctx.strokeStyle = COLORS.text;
  ctx.lineWidth = 1;
  ctx.strokeRect(ax, 12, aw, 16);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`ALARM ${Math.round(state.alarm)}%`, ax + aw + 10, 26);
  // getaway timer
  if (state.getaway !== null) {
    ctx.fillStyle = state.getaway < 20 ? COLORS.alarm : COLORS.ok;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`GETAWAY ${Math.ceil(state.getaway)}s`, FIELD.width - 16, 27);
  } else {
    ctx.fillStyle = COLORS.muted;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Steal the Star to start the getaway', FIELD.width - 16, 26);
  }
  // tools + blend, bottom left
  ctx.textAlign = 'left';
  ctx.font = '13px sans-serif';
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(`[E] Smoke ×${state.smokeLeft}   [Q] EMP ×${state.empLeft}   [Shift] Walk slow = blend`, 16, FIELD.height - 14);
  if (state.blend) {
    ctx.fillStyle = COLORS.ok;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('● BLENDING IN — guards can barely see you', 16, FIELD.height - 36);
  }
  if (state.seen) {
    ctx.fillStyle = COLORS.alarm;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ SPOTTED!', FIELD.width / 2, 64);
  }
  if (state.messageTimer > 0 && state.message) {
    ctx.fillStyle = 'rgba(10, 8, 16, 0.8)';
    const mw = ctx.measureText(state.message).width + 28;
    ctx.fillRect(FIELD.width / 2 - mw / 2, 76, mw, 30);
    ctx.fillStyle = COLORS.text;
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, FIELD.width / 2, 96);
  }
}

function drawTitle(ctx) {
  ctx.fillStyle = 'rgba(8, 6, 14, 0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 58px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE MIDNIGHT GALA', FIELD.width / 2, 240);
  ctx.fillStyle = COLORS.text;
  ctx.font = '20px Georgia, serif';
  ctx.fillText('A museum heist in evening dress', FIELD.width / 2, 282);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = COLORS.muted;
  ctx.fillText('Steal the Star of Meridian, pocket the paintings, and slip out the exit', FIELD.width / 2, 330);
  ctx.fillText('before the getaway driver leaves. Blend into the crowd — walk slow near guests.', FIELD.width / 2, 356);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('WASD / Arrows — move    Shift — walk slow (blend)    E — smoke    Q — EMP', FIELD.width / 2, 420);
  ctx.fillStyle = COLORS.gold;
  ctx.fillText('Press ENTER to begin', FIELD.width / 2, 470);
}

function drawOver(ctx, state) {
  ctx.fillStyle = 'rgba(8, 6, 14, 0.82)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const won = state.status === 'won';
  ctx.fillStyle = won ? COLORS.ok : COLORS.alarm;
  ctx.font = 'bold 52px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(won ? 'CLEAN GETAWAY!' : 'CAUGHT!', FIELD.width / 2, 250);
  ctx.fillStyle = COLORS.text;
  ctx.font = '20px sans-serif';
  if (won) {
    const bonus = state.getaway !== null ? Math.round(state.getaway) * 20 : 0;
    ctx.fillText(`Loot $${state.lootValue.toLocaleString()}  +  time bonus $${bonus.toLocaleString()}`, FIELD.width / 2, 300);
    ctx.fillText(`Total take: $${(state.lootValue + bonus).toLocaleString()}`, FIELD.width / 2, 336);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '16px sans-serif';
    ctx.fillText('Vesper vanishes into the night. The gala never knew what hit it.', FIELD.width / 2, 380);
  } else {
    ctx.fillText(state.reason, FIELD.width / 2, 300);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '16px sans-serif';
    ctx.fillText(`Loot kept: $${state.lootValue.toLocaleString()}`, FIELD.width / 2, 340);
  }
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('Press R to play again', FIELD.width / 2, 440);
}
