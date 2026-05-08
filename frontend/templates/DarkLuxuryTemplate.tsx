'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TemplateProps } from './registry';
import type { TenantConfig } from '@/lib/tenant';

const CSS_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Josefin+Sans:wght@100;300;400&family=Great+Vibes&display=swap');

  #dl-root {
    --black: #080808;
    --near-black: #0d0d0d;
    --dark: #111111;
    --surface: #161616;
    --border: rgba(255,255,255,0.08);
    --white: #f5f2ee;
    --muted: rgba(245,242,238,0.45);
    --accent: #c9a96e;
    --accent-dim: rgba(201,169,110,0.15);
    background: var(--black);
    color: var(--white);
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    letter-spacing: 0.04em;
    overflow-x: hidden;
    cursor: none;
    min-height: 100vh;
  }

  #dl-root *::before, #dl-root *::after {
    box-sizing: border-box;
  }
  #dl-root * {
    box-sizing: border-box;
  }

  #dl-root ::-webkit-scrollbar { width: 3px; }
  #dl-root ::-webkit-scrollbar-track { background: var(--black); }
  #dl-root ::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 2px; }

  /* ── CURSOR ── */
  .dl-cursor-dot {
    position: fixed; z-index: 9999; pointer-events: none;
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--accent);
    transform: translate(-50%,-50%);
    transition: transform 0.1s, opacity 0.3s;
  }
  .dl-cursor-ring {
    position: fixed; z-index: 9998; pointer-events: none;
    width: 36px; height: 36px; border-radius: 50%;
    border: 1px solid rgba(201,169,110,0.5);
    transform: translate(-50%,-50%);
    transition: width 0.3s, height 0.3s, border-color 0.3s, opacity 0.3s;
  }
  #dl-root:has(a:hover) .dl-cursor-ring,
  #dl-root:has(button:hover) .dl-cursor-ring {
    width: 56px; height: 56px;
    border-color: var(--accent);
  }

  /* ── NAV styles moved to NAV_STYLES (rendered via portal) ── */

  /* ── SIDE INDICATOR ── */
  .dl-side-indicator {
    position: fixed; left: 32px; top: 50%; transform: translateY(-50%);
    z-index: 50; display: flex; flex-direction: column; gap: 10px;
  }
  .dl-side-dot {
    width: 1px; height: 20px; background: var(--border); transition: all 0.4s;
  }
  .dl-side-dot.active { height: 40px; background: var(--accent); }

  /* ── SCROLL LINE ── */
  .dl-scroll-down {
    position: fixed; bottom: 36px; left: 36px; z-index: 50;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .dl-scroll-line {
    width: 1px; height: 60px;
    background: linear-gradient(to bottom, transparent, var(--accent));
    animation: dlScrollPulse 2s ease-in-out infinite;
  }
  @keyframes dlScrollPulse {
    0%,100% { transform: scaleY(1); opacity:1; }
    50% { transform: scaleY(0.6); opacity:0.4; }
  }

  /* ── HERO ── */
  .dl-hero {
    height: 100vh; min-height: 700px; position: relative;
    display: flex; align-items: center; justify-content: center; overflow: hidden;
  }
  .dl-hero-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 40%, #1a1510 0%, #080808 70%);
  }
  .dl-hero-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(201,169,110,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,169,110,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
    animation: dlGridMove 20s linear infinite;
  }
  .dl-hero-grid-inner {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(201,169,110,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,169,110,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
    transform: rotateX(30deg) translateY(20%);
    transform-origin: top center;
  }
  @keyframes dlGridMove {
    0% { background-position: 0 0; }
    100% { background-position: 0 -60px; }
  }
  .dl-hero-orb {
    position: absolute; width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 70%);
    top: 50%; left: 50%; transform: translate(-50%, -60%);
    animation: dlOrbFloat 8s ease-in-out infinite;
  }
  @keyframes dlOrbFloat {
    0%,100% { transform: translate(-50%,-60%) scale(1); }
    50% { transform: translate(-50%,-55%) scale(1.08); }
  }
  .dl-hero-content {
    position: relative; z-index: 10; text-align: center; padding: 0 24px;
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
  }
  .dl-hero-eyebrow {
    font-size: 10px; letter-spacing: 0.45em; text-transform: uppercase;
    color: var(--accent); margin-bottom: 28px;
    opacity: 0; animation: dlFadeUp 0.8s 0.2s forwards;
  }
  .dl-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(52px, 8vw, 110px); font-weight: 300;
    line-height: 1; letter-spacing: -0.01em; color: var(--white);
    opacity: 0; animation: dlFadeUp 1s 0.4s forwards;
  }
  .dl-hero-title em {
    font-style: italic; color: transparent;
    -webkit-text-stroke: 1px rgba(245,242,238,0.5);
  }
  .dl-hero-subtitle {
    font-size: 10px; letter-spacing: 0.35em; text-transform: uppercase;
    color: var(--muted); margin-top: 24px; margin-bottom: 48px;
    opacity: 0; animation: dlFadeUp 0.8s 0.6s forwards;
  }
  .dl-hero-divider {
    width: 1px; height: 60px;
    background: linear-gradient(to bottom, var(--accent), transparent);
    margin: 0 auto 32px;
    opacity: 0; animation: dlFadeIn 1s 0.8s forwards;
  }
  .dl-hero-cta-group {
    display: flex; align-items: center; justify-content: center; gap: 24px;
    opacity: 0; animation: dlFadeUp 0.8s 1s forwards;
  }
  .dl-hero-signature {
    position: absolute; bottom: 48px; right: 56px;
    font-family: 'Great Vibes', cursive; font-size: 42px;
    color: rgba(245,242,238,0.2); pointer-events: none;
    opacity: 0; animation: dlFadeIn 1.5s 1.2s forwards;
  }

  /* ── BUTTONS ── */
  .dl-btn-primary {
    font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
    background: var(--accent); color: var(--black);
    padding: 16px 36px; border: none; cursor: none;
    transition: all 0.3s; text-decoration: none;
    display: inline-flex; align-items: center; gap: 10px;
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
  }
  .dl-btn-primary:hover { background: var(--white); }
  .dl-btn-primary svg { width: 10px; height: 10px; }

  .dl-btn-ghost {
    font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
    border: 1px solid var(--border); color: var(--muted);
    padding: 16px 36px; background: transparent; cursor: none;
    transition: all 0.3s; text-decoration: none;
    display: inline-flex; align-items: center;
    font-family: 'Josefin Sans', sans-serif;
  }
  .dl-btn-ghost:hover { border-color: var(--white); color: var(--white); }

  /* ── MARQUEE ── */
  .dl-marquee-wrap {
    border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    overflow: hidden; padding: 18px 0; background: var(--surface);
    width: 100%;
  }
  .dl-marquee-track {
    display: flex; gap: 64px;
    animation: dlMarquee 20s linear infinite; width: max-content;
  }
  @keyframes dlMarquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .dl-marquee-item {
    font-size: 9px; letter-spacing: 0.4em; text-transform: uppercase;
    color: var(--muted); white-space: nowrap;
    display: flex; align-items: center; gap: 32px;
  }
  .dl-marquee-item::after { content: '◆'; color: var(--accent); font-size: 6px; }

  /* ── SECTION COMMONS ── */
  .dl-section-label {
    font-size: 9px; letter-spacing: 0.5em; text-transform: uppercase;
    color: var(--accent); margin-bottom: 16px;
    display: flex; align-items: center; gap: 16px;
  }
  .dl-section-label::before {
    content: ''; display: block; width: 32px; height: 1px; background: var(--accent);
  }
  .dl-section-heading {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(36px, 5vw, 68px); font-weight: 300;
    line-height: 1.1; letter-spacing: -0.01em;
  }
  .dl-section-heading em { font-style: italic; color: rgba(245,242,238,0.5); }

  /* ── SERVICES ── */
  #dl-services {
    padding: 120px 0; background: var(--near-black);
  }
  .dl-services-header {
    max-width: 1200px; margin: 0 auto; padding: 0 80px 80px;
    display: flex; justify-content: space-between; align-items: flex-end;
  }
  .dl-services-intro {
    font-size: 14px; line-height: 1.8; color: var(--muted); max-width: 340px;
  }
  .dl-services-grid {
    max-width: 1200px; margin: 0 auto; padding: 0 80px;
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1px; background: var(--border);
  }
  .dl-service-card {
    background: var(--near-black); padding: 52px 44px;
    position: relative; overflow: hidden; transition: background 0.4s;
  }
  .dl-service-card::before {
    content: ''; position: absolute; bottom: 0; left: 0;
    width: 0; height: 2px; background: var(--accent);
    transition: width 0.5s cubic-bezier(0.23,1,0.32,1);
  }
  .dl-service-card:hover { background: var(--surface); }
  .dl-service-card:hover::before { width: 100%; }
  .dl-service-number {
    font-family: 'Cormorant Garamond', serif;
    font-size: 11px; letter-spacing: 0.3em; color: var(--accent); margin-bottom: 32px;
  }
  .dl-service-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 24px; font-weight: 400; line-height: 1.3; margin-bottom: 16px;
  }
  .dl-service-desc { font-size: 12px; line-height: 1.8; color: var(--muted); }
  .dl-service-arrow {
    position: absolute; bottom: 32px; right: 36px;
    width: 28px; height: 28px; border: 1px solid var(--border); border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transform: translateX(-10px); transition: all 0.3s;
  }
  .dl-service-card:hover .dl-service-arrow {
    opacity: 1; transform: translateX(0); border-color: var(--accent);
  }
  .dl-service-arrow svg { width: 10px; height: 10px; color: var(--accent); }

  /* ── PROCESS ── */
  #dl-proceso { padding: 120px 0; background: var(--black); overflow: hidden; }
  .dl-process-inner { max-width: 1200px; margin: 0 auto; padding: 0 80px; }
  .dl-process-header { text-align: center; margin-bottom: 80px; }
  .dl-process-tabs {
    display: flex; justify-content: center; gap: 4px;
    margin-bottom: 72px; flex-wrap: wrap;
  }
  .dl-tab-btn {
    font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase;
    padding: 12px 28px; border: 1px solid var(--border);
    background: transparent; color: var(--muted); cursor: none;
    transition: all 0.3s; font-family: 'Josefin Sans', sans-serif;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dl-tab-btn.active, .dl-tab-btn:hover {
    background: var(--accent); color: var(--black); border-color: var(--accent);
  }
  .dl-process-timeline { display: none; animation: dlFadeIn 0.5s forwards; }
  .dl-process-timeline.active { display: block; }
  .dl-timeline-line {
    position: absolute; top: 16px; left: 0; right: 0; height: 1px;
    background: linear-gradient(to right, transparent, var(--border), var(--accent), var(--border), transparent);
  }
  .dl-timeline-steps {
    display: flex; justify-content: space-around; position: relative; padding-top: 0;
  }
  .dl-timeline-step {
    display: flex; flex-direction: column; align-items: center;
    gap: 20px; flex: 1; max-width: 180px;
  }
  .dl-step-dot {
    width: 32px; height: 32px; border-radius: 50%;
    border: 1px solid var(--accent); background: var(--black);
    display: flex; align-items: center; justify-content: center;
    position: relative; z-index: 2; flex-shrink: 0;
  }
  .dl-step-dot::after {
    content: ''; width: 8px; height: 8px; border-radius: 50%;
    background: var(--accent); display: block;
  }
  .dl-step-label {
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px; font-weight: 400; text-align: center; line-height: 1.3;
  }
  .dl-step-desc {
    font-size: 10px; line-height: 1.7; color: var(--muted);
    text-align: center; letter-spacing: 0.05em;
  }

  /* ── ABOUT ── */
  #dl-nosotros { padding: 120px 0; background: var(--surface); }
  .dl-about-inner {
    max-width: 1200px; margin: 0 auto; padding: 0 80px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 100px; align-items: center;
  }
  .dl-about-visual {
    position: relative; aspect-ratio: 4/5;
    background: var(--near-black); border: 1px solid var(--border); overflow: hidden;
  }
  .dl-about-visual-inner {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 60% 80% at 50% 30%, rgba(201,169,110,0.06) 0%, transparent 70%),
      linear-gradient(135deg, rgba(201,169,110,0.03) 0%, transparent 60%);
  }
  .dl-about-year {
    position: absolute; top: 32px; left: 32px;
    font-family: 'Cormorant Garamond', serif; font-size: 80px; font-weight: 300;
    color: rgba(201,169,110,0.08); line-height: 1;
  }
  .dl-about-stat {
    position: absolute; bottom: 0; left: 0; right: 0; padding: 40px;
    background: linear-gradient(to top, var(--near-black), transparent);
  }
  .dl-stat-number {
    font-family: 'Cormorant Garamond', serif; font-size: 64px; font-weight: 300;
    color: var(--accent); line-height: 1;
  }
  .dl-stat-label {
    font-size: 9px; letter-spacing: 0.35em; text-transform: uppercase;
    color: var(--muted); margin-top: 8px;
  }
  .dl-about-corner {
    position: absolute; top: 32px; right: 32px; width: 80px; height: 80px;
    border-top: 1px solid var(--accent); border-right: 1px solid var(--accent); opacity: 0.3;
  }
  .dl-about-corner-bl {
    position: absolute; bottom: 32px; left: 32px; width: 80px; height: 80px;
    border-bottom: 1px solid var(--accent); border-left: 1px solid var(--accent); opacity: 0.3;
  }
  .dl-about-text {
    font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 300;
    line-height: 1.7; color: rgba(245,242,238,0.8); margin: 32px 0; font-style: italic;
  }
  .dl-about-desc { font-size: 12px; line-height: 2; color: var(--muted); margin-bottom: 20px; }
  .dl-about-credentials {
    margin-top: 48px; border-top: 1px solid var(--border); padding-top: 32px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
  }
  .dl-credential-label {
    font-size: 8px; letter-spacing: 0.4em; text-transform: uppercase;
    color: var(--accent); margin-bottom: 8px;
  }
  .dl-credential-value {
    font-family: 'Cormorant Garamond', serif; font-size: 16px;
    font-weight: 400; color: var(--white);
  }

  /* ── CONTACT ── */
  #dl-contacto { padding: 120px 0; background: var(--black); position: relative; overflow: hidden; }
  .dl-contact-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 50% 60% at 80% 50%, rgba(201,169,110,0.03) 0%, transparent 70%);
  }
  .dl-contact-inner {
    max-width: 1200px; margin: 0 auto; padding: 0 80px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 100px; position: relative; z-index: 2;
  }
  .dl-contact-heading {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(48px, 6vw, 80px); font-weight: 300; line-height: 1; margin: 24px 0 40px;
  }
  .dl-contact-info { display: flex; flex-direction: column; gap: 32px; }
  .dl-contact-row {
    display: flex; flex-direction: column; gap: 6px;
    border-bottom: 1px solid var(--border); padding-bottom: 24px;
  }
  .dl-contact-row-label {
    font-size: 8px; letter-spacing: 0.5em; text-transform: uppercase; color: var(--accent);
  }
  .dl-contact-row-value {
    font-family: 'Cormorant Garamond', serif; font-size: 18px;
    color: var(--white); text-decoration: none; transition: color 0.3s;
  }
  .dl-contact-row-value:hover { color: var(--accent); }
  .dl-contact-form { display: flex; flex-direction: column; gap: 0; }
  .dl-form-group {
    padding: 16px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .dl-form-group:focus-within {
    border-bottom-color: rgba(201,169,110,0.6);
  }
  .dl-form-input, .dl-form-textarea, .dl-form-select {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 2px;
    outline: none;
    color: #f5f2ee;
    font-family: 'Josefin Sans', sans-serif;
    font-size: 13px;
    font-weight: 300;
    letter-spacing: 0.05em;
    width: 100%;
    padding: 12px 14px;
    transition: border-color 0.3s, background 0.3s;
    -webkit-appearance: none;
    appearance: none;
  }
  .dl-form-input:focus,
  .dl-form-textarea:focus,
  .dl-form-select:focus {
    border-color: rgba(201,169,110,0.7);
    background: rgba(201,169,110,0.05);
  }
  .dl-form-input::placeholder,
  .dl-form-textarea::placeholder {
    color: rgba(245,242,238,0.25);
    font-style: italic;
  }
  .dl-form-textarea {
    resize: none;
    height: 100px;
  }
  .dl-form-select option {
    background: #111111;
    color: #f5f2ee;
  }
  .dl-form-label {
    font-size: 8px;
    letter-spacing: 0.4em;
    text-transform: uppercase;
    color: rgba(201,169,110,0.7);
  }
  .dl-form-submit {
    margin-top: 40px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  }
  .dl-submit-btn {
    font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
    background: var(--accent); color: var(--black);
    border: none; padding: 16px 40px; cursor: none; transition: all 0.3s;
    font-family: 'Josefin Sans', sans-serif; font-weight: 400;
  }
  .dl-submit-btn:hover:not(:disabled) { background: var(--white); }
  .dl-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .dl-whatsapp-link {
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--muted); text-decoration: none;
    display: flex; align-items: center; gap: 8px; transition: color 0.3s; cursor: none;
  }
  .dl-whatsapp-link:hover { color: #25D366; }
  .dl-whatsapp-link svg { width: 14px; height: 14px; }
  .dl-form-success {
    text-align: center; padding: 48px 0;
  }
  .dl-form-success-icon {
    font-family: 'Cormorant Garamond', serif; font-size: 48px;
    color: var(--accent); margin-bottom: 16px;
  }
  .dl-form-success-text {
    font-size: 12px; letter-spacing: 0.15em; color: var(--muted); line-height: 1.8;
  }
  .dl-form-error {
    font-size: 11px; color: #ff6b6b; padding: 12px 0; letter-spacing: 0.05em;
  }

  /* ── FOOTER ── */
  .dl-footer {
    border-top: 1px solid var(--border); padding: 32px 80px;
    background: var(--black); display: flex; align-items: center; justify-content: space-between;
    max-width: 100%;
    margin: 0 auto;
  }
  .dl-footer-copy { font-size: 9px; letter-spacing: 0.2em; color: var(--muted); }
  .dl-footer-url {
    font-family: 'Cormorant Garamond', serif; font-size: 11px;
    letter-spacing: 0.2em; color: var(--muted); text-decoration: none; transition: color 0.3s;
  }
  .dl-footer-url:hover { color: var(--accent); }
  .dl-footer-social { display: flex; gap: 20px; }
  .dl-footer-social a {
    width: 32px; height: 32px; border: 1px solid var(--border); border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    text-decoration: none; color: var(--muted); transition: all 0.3s;
    font-size: 10px; cursor: none;
  }
  .dl-footer-social a:hover { border-color: var(--accent); color: var(--accent); }

  /* ── ANIMATIONS ── */
  @keyframes dlFadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes dlFadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  .dl-reveal {
    opacity: 0; transform: translateY(32px);
    transition: opacity 0.8s cubic-bezier(0.23,1,0.32,1), transform 0.8s cubic-bezier(0.23,1,0.32,1);
  }
  .dl-reveal.visible { opacity: 1; transform: translateY(0); }
  .dl-reveal-d1 { transition-delay: 0.1s; }
  .dl-reveal-d2 { transition-delay: 0.2s; }
  .dl-reveal-d3 { transition-delay: 0.3s; }
  .dl-reveal-d4 { transition-delay: 0.4s; }
  .dl-reveal-d5 { transition-delay: 0.5s; }

  /* ── FLOATING WA BUTTON (mobile only) ── */
  @media (min-width: 901px) {
    .dl-wa-float { display: none; }
  }
  @media (max-width: 900px) {
    .dl-wa-float {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 8999;
      background: #25D366;
      color: #fff;
      border: none;
      border-radius: 50px;
      padding: 14px 20px;
      font-family: 'Josefin Sans', sans-serif;
      font-size: 11px;
      font-weight: 400;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 20px rgba(37,211,102,0.4);
      cursor: pointer;
    }
    .dl-wa-float svg { width: 16px; height: 16px; }
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .dl-side-indicator { display: none; }
    .dl-services-header { flex-direction: column; gap: 24px; padding: 0 24px 48px; }
    .dl-services-grid { grid-template-columns: 1fr; padding: 0 24px; }
    .dl-services-intro { max-width: 100%; }
    .dl-process-inner { padding: 0 24px; }
    .dl-about-inner { grid-template-columns: 1fr; padding: 0 24px; gap: 48px; }
    .dl-about-visual { aspect-ratio: 16/9; }
    .dl-contact-inner { grid-template-columns: 1fr; padding: 0 24px; gap: 48px; }
    .dl-footer { flex-direction: column; gap: 24px; text-align: center; padding: 32px 24px; }
    .dl-timeline-steps { flex-direction: column; align-items: flex-start; gap: 32px; }
    .dl-timeline-line { display: none; }
    .dl-timeline-step { flex-direction: row; text-align: left; max-width: 100%; gap: 16px; }
    .dl-scroll-down { display: none; }
  }
`;

const NAV_STYLES = `
  .dl-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 9000;
    display: flex; align-items: center; justify-content: space-between;
    padding: 28px 48px;
    background: linear-gradient(to bottom, rgba(8,8,8,0.95) 0%, transparent 100%);
    transition: all 0.4s;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    letter-spacing: 0.04em;
  }
  .dl-nav.scrolled {
    background: rgba(8,8,8,0.96);
    backdrop-filter: blur(20px);
    padding: 18px 48px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .dl-nav-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 13px; font-weight: 300;
    letter-spacing: 0.25em; text-transform: uppercase;
    color: #f5f2ee; text-decoration: none;
    display: flex; flex-direction: column; gap: 2px;
    flex-shrink: 0; cursor: none;
  }
  .dl-nav-logo span { font-size: 9px; color: #c9a96e; letter-spacing: 0.4em; }
  .dl-nav-links {
    display: flex; align-items: center; gap: 32px; list-style: none;
  }
  .dl-nav-links a {
    font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase;
    color: rgba(245,242,238,0.45); text-decoration: none; transition: color 0.3s;
    position: relative; cursor: none;
  }
  .dl-nav-links a::after {
    content: ''; position: absolute; bottom: -4px; left: 0;
    width: 0; height: 1px; background: #c9a96e; transition: width 0.3s;
  }
  .dl-nav-links a:hover { color: #f5f2ee; }
  .dl-nav-links a:hover::after { width: 100%; }
  .dl-nav-monogram {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px; font-weight: 400; letter-spacing: 0.1em;
    border: 1px solid rgba(255,255,255,0.08); padding: 6px 14px;
    color: #f5f2ee; flex-shrink: 0;
  }
  .dl-nav-cta {
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    border: 1px solid #f5f2ee; padding: 10px 22px;
    background: transparent; color: #f5f2ee; cursor: none;
    transition: all 0.3s; display: flex; align-items: center; gap: 8px;
    flex-shrink: 0; font-family: 'Josefin Sans', sans-serif;
  }
  .dl-nav-cta:hover { background: #f5f2ee; color: #080808; }
  .dl-nav-cta svg { width: 10px; height: 10px; }
  @media (max-width: 900px) {
    .dl-nav { padding: 24px 24px; }
    .dl-nav-monogram { display: none; }
    .dl-nav-links { display: none; }
  }
`;

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const GENERIC_STEPS = [
  { label: 'Consulta Inicial', desc: 'Evaluación de su situación particular' },
  { label: 'Análisis y Estrategia', desc: 'Definición del plan de acción' },
  { label: 'Ejecución', desc: 'Implementación con seguimiento continuo' },
  { label: 'Resolución', desc: 'Entrega de resultados y documentación' },
];

function formatWhatsApp(raw?: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('54') && digits.length >= 12) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)}-${digits.slice(8)}`;
  }
  return raw;
}

function getMonogram(nombre: string): string {
  const IGNORE = ['estudio','contable','jurídico','juridico','abogados',
                  'asociados','y','&','de','del','la','el','dr','dra','cr','lic'];
  const words = nombre.split(' ')
    .filter(w => w.length > 1 && !IGNORE.includes(w.toLowerCase()));
  if (words.length === 0) return nombre[0]?.toUpperCase() ?? '';
  if (words.length === 1) return words[0][0].toUpperCase();
  // Primera letra de la primera palabra significativa + primera del apellido (última)
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function getEyebrow(config: TenantConfig): string {
  if (config.hero?.eyebrow) return config.hero.eyebrow;
  if (config.direccion) {
    const parts = config.direccion.split(',');
    if (parts.length >= 2) {
      const ciudad = parts[parts.length - 2]?.trim();
      const provincia = parts[parts.length - 1]?.trim();
      if (ciudad && provincia) return `${ciudad}, ${provincia} · Asesoramiento Profesional`;
    }
  }
  return 'Resistencia, Chaco · Asesoramiento Profesional';
}

function splitTitle(nombre: string): string[] {
  const words = nombre.split(' ');
  if (words.length <= 2) return [nombre];
  if (words.length === 3) return [words[0], words[1], words[2]];
  const mid = Math.ceil(words.length / 3);
  return [
    words.slice(0, mid).join(' '),
    words.slice(mid, mid * 2).join(' '),
    words.slice(mid * 2).join(' '),
  ].filter(Boolean);
}

export default function DarkLuxuryTemplate({ slug, config }: TemplateProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    nombre_cliente: '', email: '', telefono: '',
    tipo_caso: '', urgencia: '', mensaje: '',
  });

  // Portal mount flag — createPortal requires a real document, only available client-side.
  useEffect(() => { setMounted(true); }, []);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const scrollDownRef = useRef<HTMLDivElement>(null);
  const rxRef = useRef(0);
  const ryRef = useRef(0);
  const mxRef = useRef(0);
  const myRef = useRef(0);
  const rafRef = useRef<number>(0);

  const servicios = config.servicios ?? [];
  const areas = config.areas ?? [];
  const sn = config.sobre_nosotros ?? {};
  const redes = config.redes ?? {};
  const monogram = getMonogram(config.nombre_completo);
  const titleLines = splitTitle(config.nombre_completo);
  const eyebrow = getEyebrow(config);
  const waNumber = config.whatsapp?.replace(/\D/g, '') ?? '';
  const waFormatted = formatWhatsApp(config.whatsapp);
  const waMensaje = config.contacto_config?.mensaje_whatsapp
    ?? 'Hola, los contacto desde su web para una consulta.';
  const sections = ['dl-hero', 'dl-services', 'dl-proceso', 'dl-nosotros', 'dl-contacto'];

  // Cursor
  useEffect(() => {
    const animateRing = () => {
      rxRef.current += (mxRef.current - rxRef.current) * 0.12;
      ryRef.current += (myRef.current - ryRef.current) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = rxRef.current + 'px';
        ringRef.current.style.top = ryRef.current + 'px';
      }
      rafRef.current = requestAnimationFrame(animateRing);
    };
    rafRef.current = requestAnimationFrame(animateRing);

    const onMove = (e: MouseEvent) => {
      mxRef.current = e.clientX;
      myRef.current = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + 'px';
        dotRef.current.style.top = e.clientY + 'px';
      }
      if (!cursorVisible) setCursorVisible(true);
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [cursorVisible]);

  // Nav scroll + hide scroll-down indicator past hero
  useEffect(() => {
    const onScroll = () => {
      if (navRef.current) {
        navRef.current.classList.toggle('scrolled', window.scrollY > 60);
      }
      if (scrollDownRef.current) {
        const heroEl = document.getElementById('dl-hero');
        const heroBottom = heroEl ? heroEl.offsetTop + heroEl.offsetHeight : 0;
        scrollDownRef.current.style.opacity = window.scrollY > heroBottom - 100 ? '0' : '1';
        scrollDownRef.current.style.transition = 'opacity 0.4s';
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const reveals = document.querySelectorAll('.dl-reveal');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.15 });
    reveals.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Side dots
  useEffect(() => {
    const dots = document.querySelectorAll('.dl-side-dot');
    const secObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = sections.indexOf(e.target.id);
          if (idx !== -1) dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        }
      });
    }, { threshold: 0.5 });
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) secObs.observe(el);
    });
    return () => secObs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');
    setFormError('');
    try {
      const fd = new FormData();
      fd.append('nombre_cliente', form.nombre_cliente);
      fd.append('email', form.email);
      if (form.telefono) fd.append('telefono', form.telefono);
      if (form.tipo_caso) fd.append('tipo_caso', form.tipo_caso);
      if (form.urgencia) fd.append('urgencia', form.urgencia);
      fd.append('mensaje', form.mensaje);

      const res = await fetch(`/api/consultas/publica/${slug}`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al enviar la consulta.');
      }
      setFormStatus('success');
    } catch (err: any) {
      setFormError(err.message || 'Ocurrió un error. Intente nuevamente.');
      setFormStatus('error');
    }
  };

  // Nav rendered via portal (see return) so it escapes any stacking context
  // created by template animations/transforms below in #dl-root.
  const navElement = (
    <>
      <style dangerouslySetInnerHTML={{ __html: NAV_STYLES }} />
      <nav ref={navRef} className="dl-nav">
        <a
          href="#"
          className="dl-nav-logo"
          onClick={e => { e.preventDefault(); scrollTo('dl-hero'); }}
        >
          {config.nombre_completo
            .split(' ')
            .filter(w => !['estudio','contable','jurídico','juridico',
                           'y','&','de','del'].includes(w.toLowerCase()))
            .join(' ')}
          <span>
            {config.nombre_completo
              .split(' ')
              .filter(w => ['estudio','contable','jurídico','juridico',
                            'abogados','asociados'].includes(w.toLowerCase()))
              .join(' ') || 'Estudio Profesional'}
          </span>
        </a>

        <ul className="dl-nav-links">
          <li><a href="#dl-services" onClick={e => { e.preventDefault(); scrollTo('dl-services'); }}>Servicios</a></li>
          <li><a href="#dl-proceso" onClick={e => { e.preventDefault(); scrollTo('dl-proceso'); }}>Proceso</a></li>
        </ul>

        <div className="dl-nav-monogram">{monogram}</div>

        <ul className="dl-nav-links">
          <li><a href="#dl-nosotros" onClick={e => { e.preventDefault(); scrollTo('dl-nosotros'); }}>Nosotros</a></li>
          <li><a href="#dl-contacto" onClick={e => { e.preventDefault(); scrollTo('dl-contacto'); }}>Contacto</a></li>
        </ul>

        <button className="dl-nav-cta" onClick={() => scrollTo('dl-contacto')}>
          Consultar
          <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 9L9 1M9 1H3M9 1V7" />
          </svg>
        </button>
      </nav>
    </>
  );

  return (
    <>
      {/* Nav via portal — escapa del stacking context del template */}
      {mounted && createPortal(navElement, document.body)}

      {/* Cursor via portal — same reason; uses inline styles since CSS vars from #dl-root don't reach document.body */}
      {mounted && createPortal(
        <>
          <div
            ref={dotRef}
            className="dl-cursor-dot"
            style={{
              opacity: cursorVisible ? 1 : 0,
              position: 'fixed', zIndex: 9999, pointerEvents: 'none',
              width: 6, height: 6, borderRadius: '50%',
              background: '#c9a96e',
              transform: 'translate(-50%,-50%)',
              transition: 'transform 0.1s, opacity 0.3s',
            }}
          />
          <div
            ref={ringRef}
            className="dl-cursor-ring"
            style={{
              opacity: cursorVisible ? 1 : 0,
              position: 'fixed', zIndex: 9998, pointerEvents: 'none',
              width: 36, height: 36, borderRadius: '50%',
              border: '1px solid rgba(201,169,110,0.5)',
              transform: 'translate(-50%,-50%)',
              transition: 'width 0.3s, height 0.3s, border-color 0.3s, opacity 0.3s',
            }}
          />
        </>,
        document.body,
      )}

      <div id="dl-root">
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />

      {/* Side indicator */}
      <div className="dl-side-indicator">
        {sections.map((_, i) => (
          <div key={i} className={`dl-side-dot${i === 0 ? ' active' : ''}`} />
        ))}
      </div>

      {/* Scroll line */}
      <div className="dl-scroll-down" ref={scrollDownRef}>
        <div className="dl-scroll-line" />
      </div>

      {/* ═══ HERO ═══ */}
      <section id="dl-hero" className="dl-hero" style={{ perspective: '600px' }}>
        <div className="dl-hero-bg" />
        <div className="dl-hero-grid">
          <div className="dl-hero-grid-inner" />
        </div>
        <div className="dl-hero-orb" />
        <div className="dl-hero-content">
          <p className="dl-hero-eyebrow">{eyebrow}</p>
          <h1 className="dl-hero-title">
            {titleLines[0]}<br />
            {titleLines[1] && <em>{titleLines[1]}</em>}
            {titleLines[1] && <br />}
            {titleLines[2]}
          </h1>
          <p className="dl-hero-subtitle">
            {config.nombre_completo.split(' ')[0]}&nbsp;·&nbsp;{config.descripcion?.slice(0, 60) ?? 'Asesoramiento Profesional Integral'}
          </p>
          {config.hero?.tagline && (
            <p style={{
              fontSize: 13, letterSpacing: '0.15em', color: 'rgba(245,242,238,0.6)',
              textTransform: 'uppercase',
              opacity: 0, animation: 'dlFadeUp 0.8s 0.7s forwards',
              maxWidth: 600, margin: '8px auto 40px',
            }}>
              {config.hero.tagline}
            </p>
          )}
          <div className="dl-hero-divider" />
          <div className="dl-hero-cta-group">
            <button className="dl-btn-primary" onClick={() => scrollTo('dl-services')}>
              {config.hero?.cta_primario ?? 'Ver Servicios'}
              <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" width="10" height="10">
                <path d="M1 9L9 1M9 1H3M9 1V7" />
              </svg>
            </button>
            <button className="dl-btn-ghost" onClick={() => scrollTo('dl-contacto')}>
              {config.hero?.cta_secundario ?? 'Contactar'}
            </button>
          </div>
        </div>
        {sn.texto_principal && (
          <div className="dl-hero-signature">{config.nombre_completo}</div>
        )}
      </section>

      {/* ═══ MARQUEE ═══ */}
      {servicios.length > 0 && (
        <div className="dl-marquee-wrap">
          <div className="dl-marquee-track">
            {[...servicios, ...servicios].map((s, i) => (
              <span key={i} className="dl-marquee-item">{s.titulo}</span>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SERVICIOS ═══ */}
      {servicios.length > 0 && (
        <section id="dl-services">
          <div className="dl-services-header">
            <div>
              <p className="dl-section-label dl-reveal">Nuestros Servicios</p>
              <h2 className="dl-section-heading dl-reveal dl-reveal-d1">
                Soluciones<br /><em>integrales</em>
              </h2>
            </div>
            <p className="dl-services-intro dl-reveal dl-reveal-d2">
              {config.descripcion ?? 'Asesoramiento profesional adaptado a cada necesidad.'}
            </p>
          </div>
          <div className="dl-services-grid">
            {servicios.map((s, i) => (
              <div key={i} className="dl-service-card dl-reveal">
                <div className="dl-service-number">{ROMAN[i] ?? String(i + 1).padStart(2, '0')}</div>
                <div className="dl-service-name">{s.titulo}</div>
                <p className="dl-service-desc">{s.descripcion}</p>
                <div className="dl-service-arrow">
                  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 9L9 1M9 1H3M9 1V7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ PROCESO ═══ */}
      {servicios.length > 0 && (
        <section id="dl-proceso">
          <div className="dl-process-inner">
            <div className="dl-process-header">
              <p className="dl-section-label dl-reveal" style={{ justifyContent: 'center' }}>Metodología</p>
              <h2 className="dl-section-heading dl-reveal dl-reveal-d1">
                Cómo <em>trabajamos</em>
              </h2>
            </div>

            {servicios.length > 1 && (
              <div className="dl-process-tabs">
                {servicios.map((s, i) => (
                  <button
                    key={i}
                    className={`dl-tab-btn${activeTab === i ? ' active' : ''}`}
                    onClick={() => setActiveTab(i)}
                    title={s.titulo}
                  >
                    {s.nombre_corto ?? s.titulo}
                  </button>
                ))}
              </div>
            )}

            {servicios.map((_, i) => (
              <div key={i} className={`dl-process-timeline${activeTab === i ? ' active' : ''}`}>
                <div style={{ position: 'relative' }}>
                  <div className="dl-timeline-line" />
                  <div className="dl-timeline-steps">
                    {GENERIC_STEPS.map((step, j) => (
                      <div key={j} className="dl-timeline-step">
                        <div className="dl-step-dot" />
                        <div className="dl-step-label">{step.label}</div>
                        <div className="dl-step-desc">{step.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ NOSOTROS ═══ */}
      <section id="dl-nosotros">
        <div className="dl-about-inner">
          <div className="dl-about-visual dl-reveal">
            <div className="dl-about-visual-inner" />
            {sn.año_fundacion && (
              <div className="dl-about-year">{sn.año_fundacion}</div>
            )}
            <div className="dl-about-corner" />
            <div className="dl-about-corner-bl" />
            {(sn.stat_numero || sn.stat_label) && (
              <div className="dl-about-stat">
                {sn.stat_numero && <div className="dl-stat-number">{sn.stat_numero}</div>}
                {sn.stat_label && <div className="dl-stat-label">{sn.stat_label}</div>}
              </div>
            )}
          </div>

          <div>
            <p className="dl-section-label dl-reveal">Quiénes Somos</p>
            <h2 className="dl-section-heading dl-reveal dl-reveal-d1">
              Un estudio<br /><em>de confianza</em>
            </h2>
            {sn.texto_principal && (
              <p className="dl-about-text dl-reveal dl-reveal-d2">"{sn.texto_principal}"</p>
            )}
            {sn.descripcion_1 && (
              <p className="dl-about-desc dl-reveal dl-reveal-d3">{sn.descripcion_1}</p>
            )}
            {sn.descripcion_2 && (
              <p className="dl-about-desc dl-reveal dl-reveal-d4">{sn.descripcion_2}</p>
            )}
            {sn.credenciales && sn.credenciales.length > 0 && (
              <div className="dl-about-credentials dl-reveal dl-reveal-d5">
                {sn.credenciales.map((c, i) => (
                  <div key={i} className="dl-credential-item">
                    <div className="dl-credential-label">{c.label}</div>
                    <div className="dl-credential-value">{c.value}</div>
                  </div>
                ))}
              </div>
            )}

            {(config.trust?.matricula || (config.trust?.badges && config.trust.badges.length > 0)) && (
              <div style={{
                marginTop: 32,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: 24,
              }}>
                {(config.trust?.matricula || config.trust?.entidad) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{
                      fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase',
                      color: '#c9a96e', marginBottom: 6,
                    }}>
                      {config.trust?.entidad ?? 'Matrícula Profesional'}
                    </div>
                    {config.trust?.matricula && (
                      <div style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 15, color: '#f5f2ee',
                      }}>
                        {config.trust.matricula}
                      </div>
                    )}
                    {config.trust?.numero_sindico && (
                      <div style={{
                        fontSize: 11, color: 'rgba(245,242,238,0.45)',
                        marginTop: 4, letterSpacing: '0.05em',
                      }}>
                        Síndico Concursal Nº {config.trust.numero_sindico}
                      </div>
                    )}
                  </div>
                )}

                {config.trust?.badges && config.trust.badges.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {config.trust.badges.map((badge, i) => (
                      <span key={i} style={{
                        fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
                        border: '1px solid rgba(201,169,110,0.4)',
                        color: '#c9a96e', padding: '4px 12px',
                        fontFamily: "'Josefin Sans', sans-serif",
                      }}>
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ CONTACTO ═══ */}
      <section id="dl-contacto">
        <div className="dl-contact-bg" />
        <div className="dl-contact-inner">
          <div>
            <p className="dl-section-label dl-reveal">Trabajemos Juntos</p>
            <h2 className="dl-contact-heading dl-reveal dl-reveal-d1">
              Hablemos<br />de su<br /><em style={{ color: 'rgba(245,242,238,0.4)' }}>proyecto</em>
            </h2>
            <div className="dl-contact-info dl-reveal dl-reveal-d2">
              {config.direccion && (
                <div className="dl-contact-row">
                  <span className="dl-contact-row-label">Dirección</span>
                  <span className="dl-contact-row-value">{config.direccion}</span>
                </div>
              )}
              {config.email_contacto && (
                <div className="dl-contact-row">
                  <span className="dl-contact-row-label">Email</span>
                  <a href={`mailto:${config.email_contacto}`} className="dl-contact-row-value">
                    {config.email_contacto}
                  </a>
                </div>
              )}
              {config.whatsapp && (
                <div className="dl-contact-row">
                  <span className="dl-contact-row-label">WhatsApp</span>
                  <a
                    href={`https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(waMensaje)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="dl-contact-row-value"
                  >
                    {waFormatted}
                  </a>
                </div>
              )}
              <div className="dl-contact-row">
                <span className="dl-contact-row-label">Web</span>
                <span className="dl-contact-row-value">casolisto.online/{slug}</span>
              </div>
            </div>
          </div>

          <div>
            {formStatus === 'success' ? (
              <div className="dl-form-success dl-reveal">
                <div className="dl-form-success-icon">✦</div>
                <p className="dl-form-success-text">
                  Su consulta fue recibida.<br />Le contactaremos a la brevedad.
                </p>
                {config.whatsapp && (
                  <a
                    href={`https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(waMensaje)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="dl-whatsapp-link"
                    style={{ justifyContent: 'center', marginTop: 32 }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.95-1.418A9.954 9.954 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 01-4.088-1.13l-.292-.175-3.037.87.869-3.02-.19-.307A7.96 7.96 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
                    </svg>
                    WhatsApp directo
                  </a>
                )}
              </div>
            ) : (
              <form className="dl-contact-form dl-reveal dl-reveal-d2" onSubmit={handleSubmit}>
                <div className="dl-form-group">
                  <label className="dl-form-label">Nombre completo *</label>
                  <input
                    className="dl-form-input" name="nombre_cliente" required
                    placeholder="Ingrese su nombre" value={form.nombre_cliente} onChange={handleChange}
                  />
                </div>
                <div className="dl-form-group">
                  <label className="dl-form-label">Email *</label>
                  <input
                    className="dl-form-input" name="email" type="email" required
                    placeholder="su@email.com" value={form.email} onChange={handleChange}
                  />
                </div>
                <div className="dl-form-group">
                  <label className="dl-form-label">Teléfono</label>
                  <input
                    className="dl-form-input" name="telefono"
                    placeholder="+54 ..." value={form.telefono} onChange={handleChange}
                  />
                </div>
                {areas.length > 0 && (
                  <div className="dl-form-group">
                    <label className="dl-form-label">Área de consulta</label>
                    <select className="dl-form-select" name="tipo_caso" value={form.tipo_caso} onChange={handleChange}>
                      <option value="">Seleccione un área...</option>
                      {areas.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="dl-form-group">
                  <label className="dl-form-label">Urgencia</label>
                  <select className="dl-form-select" name="urgencia" value={form.urgencia} onChange={handleChange}>
                    <option value="">Seleccione...</option>
                    <option value="baja">Baja — consulta general</option>
                    <option value="media">Media — requiere atención pronto</option>
                    <option value="alta">Alta — urgente</option>
                  </select>
                </div>
                <div className="dl-form-group">
                  <label className="dl-form-label">Mensaje *</label>
                  <textarea
                    className="dl-form-textarea" name="mensaje" required
                    placeholder="Cuéntenos cómo podemos ayudarle..."
                    value={form.mensaje} onChange={handleChange}
                  />
                </div>

                {formStatus === 'error' && (
                  <p className="dl-form-error">{formError}</p>
                )}

                <div className="dl-form-submit">
                  <button className="dl-submit-btn" type="submit" disabled={formStatus === 'loading'}>
                    {formStatus === 'loading' ? 'Enviando...' : 'Enviar Consulta'}
                  </button>
                  {config.whatsapp && (
                    <a
                      href={`https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(waMensaje)}`}
                      target="_blank" rel="noreferrer"
                      className="dl-whatsapp-link"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.95-1.418A9.954 9.954 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 01-4.088-1.13l-.292-.175-3.037.87.869-3.02-.19-.307A7.96 7.96 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
                      </svg>
                      WhatsApp directo
                    </a>
                  )}
                </div>

                {config.contacto_config?.tiempo_respuesta && (
                  <p style={{
                    fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: 'rgba(245,242,238,0.35)', marginTop: 16,
                  }}>
                    ✦ {config.contacto_config.tiempo_respuesta}
                  </p>
                )}

                {config.contacto_config?.mostrar_horarios && config.contacto_config?.horarios && (
                  <p style={{
                    fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: 'rgba(245,242,238,0.35)', marginTop: 8,
                  }}>
                    ◇ {config.contacto_config.horarios}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ═══ FLOATING WA BUTTON (mobile only — CSS hides on desktop) ═══ */}
      {(config.mobile?.cta_flotante ?? true) && config.whatsapp && (
        <a
          href={`https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(waMensaje)}`}
          target="_blank"
          rel="noreferrer"
          className="dl-wa-float"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.95-1.418A9.954 9.954 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 01-4.088-1.13l-.292-.175-3.037.87.869-3.02-.19-.307A7.96 7.96 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
          </svg>
          {config.mobile?.cta_texto ?? 'Consultar por WhatsApp'}
        </a>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer className="dl-footer">
        <span className="dl-footer-copy">
          © {new Date().getFullYear()} {config.nombre_completo} · Todos los derechos reservados
        </span>
        <a href={`//${slug}.casolisto.com`} className="dl-footer-url">
          casolisto.online/{slug}
        </a>
        <div className="dl-footer-social">
          {redes.facebook && (
            <a href={redes.facebook} target="_blank" rel="noreferrer" title="Facebook">f</a>
          )}
          {redes.instagram && (
            <a href={redes.instagram} target="_blank" rel="noreferrer" title="Instagram">ig</a>
          )}
          {config.whatsapp && (
            <a href={`https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(waMensaje)}`} target="_blank" rel="noreferrer" title="WhatsApp">w</a>
          )}
        </div>
      </footer>
      </div>
    </>
  );
}
