import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const THEMES = {
  paper: { bg: '#EEF0F2', page: '#F7F8F9', ink: '#121212', soft: '#5B6168', hair: '#D2D6DB', accent: '#A2231D', band: '#121212', bandInk: '#F7F8F9' },
  haunted: { bg: '#0E0D0C', page: '#1A1714', ink: '#EDE6D6', soft: '#A89F8E', hair: '#3A332B', accent: '#E8741A', band: '#E8741A', bandInk: '#0E0D0C' },
};

export const FONT_CSS = `
@font-face{font-family:'Flag';src:url(${staticFile('fonts/unifrakturcook-latin-700-normal.woff2')}) format('woff2');font-weight:700}
@font-face{font-family:'Caslon';src:url(${staticFile('fonts/libre-caslon-text-latin-400-normal.woff2')}) format('woff2');font-weight:400}
@font-face{font-family:'Caslon';src:url(${staticFile('fonts/libre-caslon-text-latin-700-normal.woff2')}) format('woff2');font-weight:700}
@font-face{font-family:'Caslon';src:url(${staticFile('fonts/libre-caslon-text-latin-400-italic.woff2')}) format('woff2');font-style:italic}
@font-face{font-family:'Franklin';src:url(${staticFile('fonts/libre-franklin-latin-400-normal.woff2')}) format('woff2');font-weight:400}
@font-face{font-family:'Franklin';src:url(${staticFile('fonts/libre-franklin-latin-700-normal.woff2')}) format('woff2');font-weight:700}
@font-face{font-family:'Franklin';src:url(${staticFile('fonts/libre-franklin-latin-800-normal.woff2')}) format('woff2');font-weight:800}
`;

export const F = { flag: 'Flag, serif', head: 'Caslon, Georgia, serif', sans: 'Franklin, Helvetica, sans-serif' };

// Какая строка звучит в кадре
export function useLine(timing) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  let idx = -1;
  timing.lines.forEach((l, i) => { if (t >= l.start - 0.05) idx = i; });
  const cur = timing.lines[idx];
  const local = cur ? t - cur.start : 0;
  return { t, idx, local, fps, frame };
}

export function pop(frame, fps, startSec, delay = 0) {
  return spring({ frame: frame - Math.round((startSec + delay) * fps), fps, config: { damping: 16, stiffness: 140, mass: 0.7 } });
}

export const Root = ({ theme, children, audio }) => (
  <AbsoluteFill style={{ background: theme.bg, color: theme.ink, fontFamily: F.head }}>
    <style>{FONT_CSS}</style>
    {children}
    {audio ? <Audio src={audio} /> : null}
  </AbsoluteFill>
);

// Крупная подпись под голос: в зоне, которую не закрывает интерфейс Instagram
export const Caption = ({ brief, timing, theme, top = 1250 }) => {
  const { idx, local, fps, frame } = useLine(timing);
  if (idx < 0) return null;
  const line = brief.lines[idx];
  const text = line.caption || line.say;
  const s = spring({ frame: frame - Math.round(timing.lines[idx].start * fps), fps, config: { damping: 18, stiffness: 180 } });
  return (
    <div style={{ position: 'absolute', left: 90, right: 150, top, display: 'flex', justifyContent: 'center' }}>
      <div style={{
        background: theme.band, color: theme.bandInk, fontFamily: F.sans, fontWeight: 800, fontSize: 56, lineHeight: 1.18,
        padding: '22px 34px', textAlign: 'center', letterSpacing: -0.5, transform: `translateY(${(1 - s) * 30}px)`, opacity: s,
        boxShadow: '0 10px 30px rgba(0,0,0,.18)', maxWidth: 840,
      }}>{text}</div>
    </div>
  );
};

export const Masthead = ({ brief, theme, size = 120, small }) => (
  <div style={{ textAlign: 'center' }}>
    {!small && <div style={{ fontFamily: F.sans, fontSize: 22, letterSpacing: 4, textTransform: 'uppercase', color: theme.soft, display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${theme.ink}`, paddingBottom: 10 }}>
      <span>{brief.edition || 'Morning Edition'}</span><span>{brief.city || 'Tulum'} · {brief.weather || '29°C · Clear'}</span>
    </div>}
    <div style={{ fontFamily: F.flag, fontSize: size, lineHeight: 1.05, margin: small ? '4px 0' : '18px 0 8px' }}>The {brief.name || 'Roksana'} Times</div>
    <div style={{ fontFamily: F.sans, fontSize: small ? 14 : 22, letterSpacing: 2, borderTop: `${small ? 1 : 3}px solid ${theme.ink}`, borderBottom: `1px solid ${theme.ink}`, padding: small ? '3px 0' : '8px 0', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
      <span>{brief.date || 'Friday, October 2, 2026'}</span><span>Printed for one reader</span>
    </div>
  </div>
);

const DEFAULT_PAGE = {
  waiting: [['Daniel Reyes', 'Signed proposal. Asked twice if Thursday works.'], ['Marta Lind', 'Two cover options. Wants one word: left or right.'], ['Mom', 'Sunday? Two days without an answer.']],
  payments: [['Received today', '$1,240'], ['Failed', '1']],
  diary: [['09:30', 'Call with the printer'], ['13:00', 'Lunch, no phone'], ['19:00', 'Dinner at Hartwood']],
};

// Мини-первая полоса для принтера, экрана блокировки и сравнения
export const MiniPage = ({ brief, theme, width = 760 }) => {
  const p = { ...DEFAULT_PAGE, ...(brief.page || {}) };
  const sec = (t) => <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 17, letterSpacing: 2, textTransform: 'uppercase', borderBottom: `1px solid ${theme.ink}`, paddingBottom: 4, margin: '16px 0 8px' }}>{t}</div>;
  return (
    <div style={{ width, background: theme.page, color: theme.ink, padding: '28px 32px 36px', boxShadow: '0 30px 70px rgba(0,0,0,.25)' }}>
      <Masthead brief={brief} theme={theme} size={64} small />
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 26 }}>
        <div>
          {sec('Waiting for a reply')}
          {p.waiting.map(([n, w], i) => <div key={i} style={{ marginBottom: 10 }}><div style={{ fontWeight: 700, fontSize: 21 }}>{n}</div><div style={{ fontSize: 17, color: theme.soft, lineHeight: 1.3 }}>{w}</div></div>)}
        </div>
        <div>
          {sec('Payments')}
          {p.payments.map(([a, b], i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, marginBottom: 6 }}><span>{a}</span><b style={{ fontFamily: F.sans }}>{b}</b></div>)}
          {sec('Diary')}
          {p.diary.map(([a, b], i) => <div key={i} style={{ fontSize: 17, marginBottom: 6 }}><b style={{ fontFamily: F.sans }}>{a}</b> {b}</div>)}
        </div>
      </div>
    </div>
  );
};

export const EndCard = ({ brief, timing, theme }) => {
  const { frame, fps } = useLine(timing);
  const start = timing.lines[timing.lines.length - 1].end + 0.1;
  const s = spring({ frame: frame - Math.round(start * fps), fps, config: { damping: 20 } });
  if (frame < start * fps) return null;
  return (
    <AbsoluteFill style={{ background: theme.bg, opacity: s, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontFamily: F.flag, fontSize: 150, color: theme.ink }}>Your Times</div>
      <div style={{ fontFamily: F.head, fontStyle: 'italic', fontSize: 46, color: theme.soft, marginTop: 6 }}>A newspaper with one reader</div>
      <div style={{ marginTop: 60, fontFamily: F.sans, fontWeight: 800, fontSize: 44, background: theme.band, color: theme.bandInk, padding: '18px 34px' }}>{brief.cta || 'Link in bio'}</div>
    </AbsoluteFill>
  );
};
