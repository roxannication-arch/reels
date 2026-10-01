import React from 'react';
import { AbsoluteFill, interpolate, Easing } from 'remotion';
import { Root, Caption, Masthead, MiniPage, EndCard, useLine, pop, F, THEMES } from './common.jsx';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

// 1. FRONT PAGE: шапка газеты, под каждую строку выезжает новая заметка
const FrontPage = ({ brief, timing, theme }) => {
  const { idx, frame, fps, t } = useLine(timing);
  const zoom = interpolate(t, [0, timing.duration], [1.02, 1.1]);
  const cards = brief.lines.map((l, i) => ({ ...l, i })).filter((l) => l.head);
  const shown = cards.filter((c) => c.i <= idx).slice(-4);
  return (
    <>
      <AbsoluteFill style={{ padding: '120px 70px 0', transform: `scale(${zoom})`, transformOrigin: '50% 20%' }}>
        <Masthead brief={brief} theme={theme} size={118} />
        <div style={{ marginTop: 34 }}>
          {shown.map((c) => {
            const s = pop(frame, fps, timing.lines[c.i].start);
            return (
              <div key={c.i} style={{ borderBottom: `1px solid ${theme.hair}`, padding: '22px 0', opacity: s, transform: `translateX(${(1 - s) * -60}px)` }}>
                {c.kicker && <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 22, letterSpacing: 3, textTransform: 'uppercase', color: theme.accent }}>{c.kicker}</div>}
                <div style={{ fontFamily: F.head, fontWeight: 700, fontSize: 66, lineHeight: 1.08, marginTop: 6 }}>{c.head}</div>
                {c.body && <div style={{ fontSize: 34, color: theme.soft, marginTop: 10, lineHeight: 1.3 }}>{c.body}</div>}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Caption brief={brief} timing={timing} theme={theme} top={1300} />
    </>
  );
};

// 2. PRINTER: лист медленно выходит из щели принтера
const Printer = ({ brief, timing, theme }) => {
  const { t } = useLine(timing);
  const total = timing.lines[timing.lines.length - 1].end;
  const out = interpolate(t, [0.3, total], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const jitter = Math.sin(t * 40) * (out < 1 ? 1.2 : 0);
  return (
    <>
      <AbsoluteFill>
        <div style={{ position: 'absolute', top: 300, left: 0, right: 0, height: 1400, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 160 + jitter, top: -720 + out * 790 }}>
            <MiniPage brief={brief} theme={theme} width={760} />
          </div>
        </div>
        <div style={{ position: 'absolute', top: 160, left: 110, right: 110, height: 150, background: theme.ink === '#121212' ? '#2A2D31' : '#000', borderRadius: 26, boxShadow: '0 20px 40px rgba(0,0,0,.35)' }}>
          <div style={{ position: 'absolute', bottom: 22, left: 40, right: 40, height: 10, background: '#000', borderRadius: 5 }} />
          <div style={{ position: 'absolute', top: 30, right: 50, width: 16, height: 16, borderRadius: 8, background: out < 1 ? '#4ADE80' : '#666' }} />
          <div style={{ position: 'absolute', top: 24, left: 50, fontFamily: F.sans, fontSize: 22, letterSpacing: 4, color: '#9AA0A6' }}>06:30 · PRINTING</div>
        </div>
      </AbsoluteFill>
      <Caption brief={brief} timing={timing} theme={theme} top={1420} />
    </>
  );
};

// 3. LOCK SCREEN: уведомления копятся, потом исчезают, и на экране остаётся газета
const LockScreen = ({ brief, timing, theme }) => {
  const { t, frame, fps } = useLine(timing);
  const notifs = brief.notifs || ['Slack · 14 new messages', 'Mail · Invoice overdue', 'Instagram · 37 new requests', 'News · Markets slide at open', 'Calendar · 3 conflicts today', 'WhatsApp · Mom: call me'];
  const clearAt = timing.lines[Math.min(brief.clearAt ?? 2, timing.lines.length - 1)].start;
  const cleared = interpolate(t, [clearAt, clearAt + 0.6], [0, 1], clamp);
  return (
    <>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 720, height: 1480, borderRadius: 90, background: '#000', padding: 22, boxShadow: '0 40px 90px rgba(0,0,0,.35)', marginTop: -220 }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 70, overflow: 'hidden', position: 'relative', background: '#111' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: cleared, display: 'flex', justifyContent: 'center', paddingTop: 300, transform: 'scale(0.86)', transformOrigin: '50% 0' }}>
              <MiniPage brief={brief} theme={THEMES.paper} width={760} />
            </div>
            <div style={{ position: 'absolute', top: 90, width: '100%', textAlign: 'center', color: '#fff', fontFamily: F.sans }}>
              <div style={{ fontSize: 30, fontWeight: 700 }}>{brief.lockDate || 'Friday, October 2'}</div>
              <div style={{ fontSize: 150, fontWeight: 700, lineHeight: 1 }}>6:30</div>
            </div>
            <div style={{ position: 'absolute', top: 360, left: 30, right: 30 }}>
              {notifs.map((n, i) => {
                const s = pop(frame, fps, 0.2, i * 0.22);
                return <div key={i} style={{ background: 'rgba(255,255,255,.88)', borderRadius: 26, padding: '22px 26px', marginBottom: 14, fontFamily: F.sans, fontSize: 26, color: '#111', opacity: s * (1 - cleared), transform: `translateY(${(1 - s) * -40 - cleared * 300}px)` }}>{n}</div>;
              })}
            </div>
          </div>
        </div>
      </AbsoluteFill>
      <Caption brief={brief} timing={timing} theme={theme} top={1560} />
    </>
  );
};

// 4. VERSUS: сверху утро с лентой, снизу утро с газетой
const Versus = ({ brief, timing, theme }) => {
  const { t, frame, fps } = useLine(timing);
  const split = timing.lines[Math.min(brief.splitAt ?? 1, timing.lines.length - 1)].start;
  const s = pop(frame, fps, split);
  const items = brief.notifs || ['37 unread', 'Markets slide', '14 Slack pings', 'Invoice overdue', 'Group chat: 112', 'Breaking: …'];
  return (
    <>
      <AbsoluteFill>
        <div style={{ height: 760, background: '#1B1D20', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 120, left: 70, fontFamily: F.sans, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: '#9AA0A6' }}>{brief.topLabel || 'THEIR MORNING'}</div>
          {items.map((n, i) => {
            const y = ((t * 220 + i * 120) % 820) - 60;
            return <div key={i} style={{ position: 'absolute', left: 70 + (i % 2) * 380, top: 180 + y * 0.6, background: '#2C2F33', color: '#E6E6E6', padding: '16px 22px', borderRadius: 18, fontFamily: F.sans, fontSize: 28 }}>{n}</div>;
          })}
        </div>
        <div style={{ position: 'absolute', top: 760, left: 0, right: 0, bottom: 0, background: theme.bg, opacity: 0.3 + 0.7 * s }}>
          <div style={{ position: 'absolute', top: 50, left: 70, fontFamily: F.sans, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: theme.accent }}>{brief.bottomLabel || 'MY MORNING'}</div>
          <div style={{ position: 'absolute', top: 110, left: 160, transform: `scale(${0.8 + 0.1 * s}) rotate(-2deg)`, transformOrigin: '0 0' }}><MiniPage brief={brief} theme={theme} width={760} /></div>
        </div>
      </AbsoluteFill>
      <Caption brief={brief} timing={timing} theme={theme} top={1540} />
    </>
  );
};

// 5. HEADLINES: каждая строка это огромный газетный заголовок
const Headlines = ({ brief, timing, theme }) => {
  const { idx, frame, fps } = useLine(timing);
  const i = Math.max(0, idx);
  const line = brief.lines[i];
  const s = pop(frame, fps, timing.lines[i]?.start || 0);
  const rot = (i % 2 ? 1 : -1) * (1 - s) * 8;
  return (
    <AbsoluteFill style={{ padding: '140px 70px 0' }}>
      <Masthead brief={brief} theme={theme} size={110} />
      <div style={{ position: 'absolute', top: 470, bottom: 220, left: 70, right: 70, display: 'flex', flexDirection: 'column', justifyContent: 'center', transform: `scale(${0.85 + 0.15 * s}) rotate(${rot}deg)`, opacity: s }}>
        {line.kicker && <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 30, letterSpacing: 4, textTransform: 'uppercase', color: theme.accent, marginBottom: 18 }}>{line.kicker}</div>}
        <div style={{ fontFamily: F.head, fontWeight: 700, fontSize: line.head && line.head.length > 60 ? 96 : 120, lineHeight: 1.0, letterSpacing: -1 }}>{line.head || line.say}</div>
        {line.body && <div style={{ fontFamily: F.head, fontStyle: 'italic', fontSize: 38, color: theme.soft, marginTop: 26, lineHeight: 1.3 }}>{line.body}</div>}
      </div>
    </AbsoluteFill>
  );
};

const TEMPLATES = { frontpage: FrontPage, printer: Printer, lockscreen: LockScreen, versus: Versus, headlines: Headlines };

export const Reel = ({ brief, timing, audio }) => {
  const theme = THEMES[brief.theme] || THEMES.paper;
  const T = TEMPLATES[brief.template] || FrontPage;
  return (
    <Root theme={theme} audio={audio}>
      <T brief={brief} timing={timing} theme={theme} />
      <EndCard brief={brief} timing={timing} theme={theme} />
    </Root>
  );
};
