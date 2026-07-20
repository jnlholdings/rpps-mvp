import { useState, useEffect, useRef, createContext, useContext } from "react";
import { supabase } from "./supabaseClient";

// ─── COMING SOON MODE ──────────────────────────────────────────────────────
// Flip this to false when Prism Patient is ready to go fully live.
// While true: a banner + one-time modal appear site-wide, and sign in,
// account registration, and provider registration are disabled in favor of
// a "join the waitlist" email capture.
const COMING_SOON_MODE = true;

// Set to false once legal/human review of all copy (blog posts, marketing
// pages, etc.) is complete. While true, a subtle non-blocking watermark is
// tiled across every page as a reminder that copy hasn't been signed off.
const CONTENT_PENDING_REVIEW = true;

const ComingSoonContext = createContext({ active: false, requestAccess: () => {} });
function useComingSoon() {
  return useContext(ComingSoonContext);
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --teal: #0FB8AB;
    --teal-light: #3DD9CC;
    --teal-dark: #01665E;
    --coral: #F7A106;
    --coral-light: #FBBF4A;
    --navy: #001936;
    --navy-mid: #0A2A4D;
    --slate: #656972;
    --mist: #E6FBF9;
    --mist2: #F8FAFC;
    --border: #E2E8F0;
    --text-primary: #001936;
    --text-secondary: #656972;
    --text-light: #9BA0A9;
    --white: #FFFFFF;
    --success: #10B981;
    --warning: #F7A106;
    --radius: 16px;
    --radius-sm: 10px;
    --shadow: 0 4px 24px rgba(15,34,55,0.08);
    --shadow-lg: 0 12px 48px rgba(15,34,55,0.14);
  }

  body { font-family: 'DM Sans', sans-serif; background: var(--mist2); color: var(--text-primary); }
  .app { min-height: 100vh; display: flex; flex-direction: column; }

  .nav {
    background: var(--white);
    border-bottom: 1px solid var(--border);
    padding: 0 32px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 8px rgba(15,34,55,0.06);
  }
  .nav-logo {
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    font-size: 20px;
    color: var(--teal-dark);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .nav-logo span { color: var(--coral); }
  .nav-pill {
    background: var(--mist);
    border: 1px solid #B3EEE9;
    border-radius: 100px;
    display: flex;
    padding: 4px;
    gap: 2px;
  }
  .nav-pill button {
    padding: 6px 20px;
    border-radius: 100px;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    color: var(--text-secondary);
  }
  .nav-pill button.active { background: var(--teal); color: white; box-shadow: 0 2px 8px rgba(13,148,136,0.3); }

  .hero {
    background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 60%, #1B4F72 100%);
    padding: 80px 32px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 100%, rgba(13,148,136,0.18) 0%, transparent 70%);
  }
  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(249,115,22,0.15);
    border: 1px solid rgba(249,115,22,0.3);
    color: var(--coral-light);
    padding: 6px 16px;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 24px;
    position: relative;
  }
  .hero h1 {
    font-family: 'Sora', sans-serif;
    font-size: clamp(28px, 5vw, 48px);
    font-weight: 700;
    color: white;
    line-height: 1.15;
    margin-bottom: 16px;
    position: relative;
  }
  .hero h1 em { color: var(--teal-light); font-style: normal; }
  .hero p { color: rgba(255,255,255,0.65); font-size: 17px; max-width: 520px; margin: 0 auto 36px; line-height: 1.6; position: relative; }
  .hero-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; position: relative; }

  .btn {
    padding: 14px 28px;
    border-radius: 100px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    font-size: 15px;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .btn-primary { background: var(--teal); color: white; box-shadow: 0 4px 16px rgba(13,148,136,0.4); }
  .btn-primary:hover { background: var(--teal-light); transform: translateY(-1px); }
  .btn-outline { background: transparent; color: white; border: 1.5px solid rgba(255,255,255,0.3); }
  .btn-outline:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.6); }
  .btn-ghost { background: var(--mist); color: var(--teal-dark); border: 1.5px solid #B3EEE9; }
  .btn-ghost:hover { background: #B3EEE9; }
  .btn-danger { background: #FEE2E2; color: #991B1B; border: none; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .stats-bar {
    background: var(--white);
    border-bottom: 1px solid var(--border);
    padding: 20px 32px;
    display: flex;
    justify-content: center;
    gap: 48px;
    flex-wrap: wrap;
  }
  .stat { text-align: center; }
  .stat-num { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; color: var(--teal-dark); }
  .stat-label { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }

  .main { flex: 1; padding: 40px 16px; max-width: 900px; margin: 0 auto; width: 100%; }
  .main-narrow { flex: 1; padding: 40px 16px; max-width: 560px; margin: 0 auto; width: 100%; }

  .card { background: var(--white); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow); overflow: hidden; }
  .card-header { padding: 24px 28px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; }
  .card-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .card-icon.teal { background: #B3EEE9; }
  .card-title { font-family: 'Sora', sans-serif; font-size: 17px; font-weight: 600; }
  .card-subtitle { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }
  .card-body { padding: 28px; }

  .steps { display: flex; gap: 0; margin-bottom: 32px; }
  .step { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; }
  .step::after { content: ''; position: absolute; top: 16px; left: 50%; width: 100%; height: 2px; background: var(--border); z-index: 0; }
  .step:last-child::after { display: none; }
  .step-dot { width: 32px; height: 32px; border-radius: 50%; background: var(--border); color: var(--text-light); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; position: relative; z-index: 1; transition: all 0.3s; }
  .step-dot.active { background: var(--teal); color: white; box-shadow: 0 0 0 4px rgba(13,148,136,0.2); }
  .step-dot.done { background: var(--success); color: white; }
  .step-label { font-size: 11px; color: var(--text-light); margin-top: 6px; text-align: center; font-weight: 500; }
  .step-label.active { color: var(--teal-dark); }

  .form-group { margin-bottom: 20px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  label { display: block; font-size: 13px; font-weight: 500; color: var(--slate); margin-bottom: 6px; }
  input, select, textarea {
    width: 100%;
    padding: 12px 16px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: var(--text-primary);
    background: var(--white);
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(13,148,136,0.12); }
  .input-prefix { position: relative; }
  .input-prefix span { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-size: 15px; }
  .input-prefix input { padding-left: 28px; }
  .input-sensitive { font-family: monospace; letter-spacing: 2px; }

  .financing-card { border: 2px solid var(--border); border-radius: var(--radius-sm); padding: 20px; cursor: pointer; transition: all 0.2s; position: relative; background: var(--white); }
  .financing-card:hover { border-color: var(--teal-light); transform: translateY(-2px); box-shadow: var(--shadow); }
  .financing-card.selected { border-color: var(--teal); background: #E6FBF9; }
  .financing-card.recommended::before { content: 'Best Match'; position: absolute; top: -1px; right: 16px; background: var(--coral); color: white; font-size: 11px; font-weight: 600; padding: 3px 12px; border-radius: 0 0 8px 8px; }
  .fc-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .fc-logo { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .fc-name { font-family: 'Sora', sans-serif; font-weight: 600; font-size: 16px; }
  .fc-type { font-size: 12px; color: var(--text-secondary); }
  .fc-details { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .fc-detail { background: var(--mist2); border-radius: 8px; padding: 10px 12px; }
  .fc-detail-val { font-family: 'Sora', sans-serif; font-weight: 600; font-size: 15px; color: var(--teal-dark); }
  .fc-detail-label { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }

  .success-screen { text-align: center; padding: 48px 24px; }
  .success-icon { width: 80px; height: 80px; background: linear-gradient(135deg, var(--teal), var(--teal-light)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; margin: 0 auto 24px; box-shadow: 0 8px 24px rgba(13,148,136,0.3); }
  .success-screen h2 { font-family: 'Sora', sans-serif; font-size: 24px; font-weight: 700; margin-bottom: 12px; }
  .success-screen p { color: var(--text-secondary); font-size: 16px; line-height: 1.6; max-width: 400px; margin: 0 auto 32px; }
  .next-steps { background: var(--mist); border-radius: var(--radius-sm); padding: 20px; text-align: left; margin-top: 24px; }
  .next-steps h4 { font-weight: 600; margin-bottom: 12px; font-size: 14px; }
  .next-step-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; font-size: 14px; color: var(--slate); }
  .next-step-num { width: 22px; height: 22px; background: var(--teal); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }

  .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .metric-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 20px; box-shadow: var(--shadow); }
  .metric-label { font-size: 12px; color: var(--text-secondary); font-weight: 500; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .metric-val { font-family: 'Sora', sans-serif; font-size: 28px; font-weight: 700; color: var(--text-primary); }
  .metric-sub { font-size: 12px; color: var(--success); margin-top: 4px; }

  .patient-table { width: 100%; border-collapse: collapse; }
  .patient-table th { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 16px; text-align: left; border-bottom: 1px solid var(--border); }
  .patient-table td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid #F1F5F9; }
  .patient-table tr:last-child td { border-bottom: none; }
  .patient-table tr:hover td { background: var(--mist); }

  .status-pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 100px; font-size: 12px; font-weight: 500; }
  .status-pill.approved { background: #D1FAE5; color: #065F46; }
  .status-pill.pending { background: #FEF3C7; color: #92400E; }
  .status-pill.reviewing { background: #E0F2FE; color: #0C4A6E; }

  .tab-bar { display: flex; gap: 4px; border-bottom: 1px solid var(--border); padding: 0 28px; background: var(--white); }
  .tab-btn { padding: 14px 20px; border: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: var(--text-secondary); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.2s; }
  .tab-btn.active { color: var(--teal-dark); border-bottom-color: var(--teal); }

  .divider { border: none; border-top: 1px solid var(--border); margin: 24px 0; }
  .helper-text { font-size: 12px; color: var(--text-light); margin-top: 6px; }
  .alert { padding: 14px 16px; border-radius: var(--radius-sm); font-size: 14px; margin-bottom: 20px; display: flex; gap: 10px; align-items: flex-start; }
  .alert.info { background: #EFF6FF; color: #1E40AF; border: 1px solid #BFDBFE; }
  .alert.success { background: #D1FAE5; color: #065F46; border: 1px solid #6EE7B7; }
  .alert.warning { background: #FFFBEB; color: #92400E; border: 1px solid #FDE68A; }
  .section-title { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 6px; }
  .section-sub { font-size: 14px; color: var(--text-secondary); margin-bottom: 24px; }

  .magic-link-box { background: var(--mist); border: 1.5px dashed var(--teal-light); border-radius: var(--radius-sm); padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 20px 0; flex-wrap: wrap; }
  .magic-link-url { font-family: monospace; font-size: 12px; color: var(--teal-dark); word-break: break-all; flex: 1; }
  .copy-btn { background: var(--teal); color: white; border: none; border-radius: 8px; padding: 8px 14px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; font-family: 'DM Sans', sans-serif; }
  .copy-btn:hover { background: var(--teal-light); }

  .portal-header { background: linear-gradient(135deg, var(--navy), var(--navy-mid)); padding: 28px 32px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  .portal-user { display: flex; align-items: center; gap: 12px; }
  .portal-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--teal); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px; }
  .portal-name { color: white; font-weight: 600; font-size: 15px; }
  .portal-email { color: rgba(255,255,255,0.55); font-size: 12px; }

  .approval-card { border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-lg); }
  .approval-approved { background: linear-gradient(135deg, #065F46, #047857); }
  .approval-review { background: linear-gradient(135deg, #92400E, #B45309); }
  .approval-declined { background: linear-gradient(135deg, #7F1D1D, #991B1B); }
  .approval-body { padding: 40px 32px; text-align: center; color: white; }
  .approval-icon { font-size: 56px; margin-bottom: 16px; }
  .approval-title { font-family: 'Sora', sans-serif; font-size: 26px; font-weight: 700; margin-bottom: 8px; }
  .approval-sub { font-size: 15px; opacity: 0.8; margin-bottom: 32px; }
  .approval-amount { font-family: 'Sora', sans-serif; font-size: 48px; font-weight: 700; margin-bottom: 4px; }
  .approval-amount-label { font-size: 13px; opacity: 0.7; margin-bottom: 32px; }
  .approval-details { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 32px; }
  .approval-detail { background: rgba(255,255,255,0.15); border-radius: 10px; padding: 14px; }
  .approval-detail-val { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 700; }
  .approval-detail-label { font-size: 11px; opacity: 0.75; margin-top: 3px; }

  .section-divider { display: flex; align-items: center; gap: 12px; margin: 24px 0; }
  .section-divider-line { flex: 1; height: 1px; background: var(--border); }
  .section-divider-text { font-size: 12px; color: var(--text-light); font-weight: 500; white-space: nowrap; }

  .site-footer { background: var(--navy); color: rgba(255,255,255,0.7); padding: 56px 32px 32px; margin-top: auto; }
  .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; max-width: 1000px; margin: 0 auto 48px; }
  .footer-brand-col .footer-logo { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 22px; color: white; margin-bottom: 12px; }
  .footer-brand-col .footer-logo span { color: var(--coral); }
  .footer-brand-col p { font-size: 13px; line-height: 1.7; max-width: 240px; }
  .footer-col-title { font-family: 'Sora', sans-serif; font-weight: 600; font-size: 13px; color: white; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 16px; }
  .footer-link { display: block; font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 10px; cursor: pointer; transition: color 0.2s; background: none; border: none; font-family: 'DM Sans', sans-serif; padding: 0; text-align: left; }
  .footer-link:hover { color: var(--teal-light); }
  .footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; max-width: 1000px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; font-size: 12px; color: rgba(255,255,255,0.4); }
  .footer-legal { display: flex; gap: 20px; flex-wrap: wrap; }

  .blog-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 48px; }
  .blog-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
  .blog-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
  .blog-card-img { height: 140px; display: flex; align-items: center; justify-content: center; font-size: 48px; }
  .blog-card-body { padding: 20px; }
  .blog-card-tag { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--teal-dark); margin-bottom: 8px; }
  .blog-card-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 16px; margin-bottom: 8px; line-height: 1.4; }
  .blog-card-excerpt { font-size: 13px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 16px; }
  .blog-card-meta { font-size: 12px; color: var(--text-light); display: flex; justify-content: space-between; }

  @media (max-width: 600px) {
    .footer-grid { grid-template-columns: 1fr 1fr; }
  }
    .form-row { grid-template-columns: 1fr; }
    .fc-details { grid-template-columns: 1fr 1fr; }
    .dashboard-grid { grid-template-columns: 1fr; }
    .hero { padding: 48px 20px; }
    .stats-bar { gap: 24px; }
    .main { padding: 24px 12px; }
    .main-narrow { padding: 24px 12px; }
    .approval-details { grid-template-columns: 1fr 1fr; }
  }
`;

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const PRISM_PRODUCT = {
  name: "Prism Patient EOB-Verified Financing",
  type: "Single Prism Patient-Branded Product",
  logo: "🏥",
  apr: "0% if paid within 12 months",
  terms: "3, 6, 9, or 12 months — auto-assigned based on EOB-verified amount",
  approval: "Instant for clear EOBs, up to 1 business day if manual review is needed",
};

const MOCK_PATIENTS = [
  { name: "Maria L.", amount: "$1,200", plan: "Prism Patient Financing", status: "approved", date: "Today" },
  { name: "James R.", amount: "$3,400", plan: "Prism Patient Financing", status: "reviewing", date: "Yesterday" },
  { name: "Aisha T.", amount: "$680", plan: "Prism Patient Financing", status: "approved", date: "May 20" },
  { name: "Carlos M.", amount: "$2,100", plan: "Prism Patient Financing", status: "pending", date: "May 19" },
  { name: "Diane K.", amount: "$890", plan: "Prism Patient Financing", status: "approved", date: "May 18" },
];

// ─── MOCK AUTH ────────────────────────────────────────────────────────────────
// TODO: Replace with Supabase auth calls on deployment
// supabase.auth.signInWithOtp({ email }) for magic link send
// supabase.auth.getSession() for session check

function generateMagicLink(email) {
  const token = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `https://prism-patient-mvp.vercel.app/auth?token=${token}&email=${encodeURIComponent(email)}`;
}

// ─── INPUT FORMATTERS ─────────────────────────────────────────────────────────

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length < 4) return digits.length ? `(${digits}` : "";
  if (digits.length < 7) return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
}

function formatSSN(value) {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (digits.length < 4) return digits;
  if (digits.length < 6) return `${digits.slice(0,3)}-${digits.slice(3)}`;
  return `${digits.slice(0,3)}-${digits.slice(3,5)}-${digits.slice(5)}`;
}

function formatIncome(value) {
  const digits = value.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "");
  const isAmex = digits.startsWith("34") || digits.startsWith("37");
  if (isAmex) {
    const d = digits.slice(0, 15);
    const parts = [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean);
    return parts.join(" ");
  }
  const d = digits.slice(0, 16);
  const parts = [];
  for (let i = 0; i < d.length; i += 4) parts.push(d.slice(i, i + 4));
  return parts.join(" ");
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

// ─── ORIGINATION FEE TIERS ─────────────────────────────────────────────────────
// Placeholder tier structure — percentage decreases as loan balance increases,
// consistent with standard healthcare/consumer financing convention (fixed
// underwriting costs are a smaller % of larger loans). Adjust once Medallion
// Bank or another lending partner provides real risk-based pricing guidance.
// Origination fee is deducted from the provider's disbursement, not charged
// to the patient. Patient is charged a separate flat 3.5% processing fee.
//
// NOT YET WIRED INTO THE UNDERWRITING FLOW — utility only, pending Stage 1.

const ORIGINATION_FEE_TIERS = [
  { min: 0,     max: 1000,    rate: 0.05 }, // 5.0% — $0–$1,000
  { min: 1000,  max: 3000,    rate: 0.04 }, // 4.0% — $1,001–$3,000
  { min: 3000,  max: Infinity, rate: 0.03 }, // 3.0% — $3,001+
];

const PATIENT_PROCESSING_FEE_RATE = 0.035; // 3.5% flat, charged to the patient

function getOriginationFeeRate(loanAmount) {
  const amt = parseFloat(loanAmount) || 0;
  const tier = ORIGINATION_FEE_TIERS.find(t => amt > t.min && amt <= t.max) || ORIGINATION_FEE_TIERS[0];
  return tier.rate;
}

function calculateLoanFees(loanAmount) {
  const amt = parseFloat(loanAmount) || 0;
  const originationRate = getOriginationFeeRate(amt);
  const originationFee = amt * originationRate;
  const processingFee = amt * PATIENT_PROCESSING_FEE_RATE;
  return {
    loanAmount: amt,
    originationRate,
    originationFee: originationFee.toFixed(2),
    providerDisbursement: (amt - originationFee).toFixed(2), // provider receives loan minus origination fee
    processingFee: processingFee.toFixed(2), // charged to patient separately
  };
}

// ─── EOB REVIEW & DISPUTE SERVICE — PRICING MENU ──────────────────────────────
// Placeholder pricing — patient-facing consultative service, separate from financing.
// Patient submits a request with their EOB attached; Prism Patient reviews and follows up
// via email with standard confirmation responses and further updates as needed.

const DISPUTE_SERVICE_TIERS = [
  { id: "basic_review", name: "Basic EOB Review", price: 49, desc: "We review your EOB for billing errors, duplicate charges, and coding mistakes, and send you a summary of what we find.", includes: ["Line-by-line EOB review", "Written summary of findings", "Guidance on next steps"] },
  { id: "standard_dispute", name: "Standard Dispute Filing", price: 149, desc: "We file the dispute directly with your insurer or provider on your behalf and manage the initial back-and-forth.", includes: ["Everything in Basic Review", "Dispute filed on your behalf", "Insurer/provider correspondence handled for you"] },
  { id: "full_representation", name: "Full Representation", price: 299, desc: "End-to-end handling of your dispute from filing through resolution, including follow-up until the issue is closed.", includes: ["Everything in Standard Dispute Filing", "Ongoing follow-up until resolved", "Priority handling and status updates"] },
];

// ─── TERM AUTO-ASSIGNMENT ──────────────────────────────────────────────────────
// Placeholder breakpoints — Prism Patient assigns the term automatically based on the
// EOB-verified loan amount. Adjust once real portfolio/risk data is available.
// All terms are 0% APR if paid in full within 12 months.

const TERM_ASSIGNMENT_TIERS = [
  { min: 0,    max: 500,     term: 3 },
  { min: 500,  max: 1500,    term: 6 },
  { min: 1500, max: 3000,    term: 9 },
  { min: 3000, max: Infinity, term: 12 },
];

function getAssignedTerm(loanAmount) {
  const amt = parseFloat(loanAmount) || 0;
  const tier = TERM_ASSIGNMENT_TIERS.find(t => amt > t.min && amt <= t.max) || TERM_ASSIGNMENT_TIERS[0];
  return tier.term;
}

// ─── EOB-BASED UNDERWRITING ENGINE ────────────────────────────────────────────
// TODO: Replace with real EOB review (AI + human) and live credit pull on deployment.
// Two possible outcomes:
//   1. Instant decision — EOB amount confirmed, credit pull clears, decision returned immediately
//   2. Needs review — EOB cannot be auto-verified, routed to human review; patient is
//      notified via email and portal status, decision follows within 1 business day

function runEobUnderwriting(data) {
  const eobAmount = parseFloat(data.eobVerifiedAmount) || parseFloat(data.balanceOwed) || 0;
  const score = parseInt(data.mockCreditScore) || 650;
  const eobClarity = data.eobClarity || "clear"; // "clear" | "needs_review" — demo toggle

  // EOB could not be auto-verified — route to human review
  if (eobClarity === "needs_review") {
    return {
      decision: "eob_review",
      approvedAmount: null,
      originationFee: null,
      providerDisbursement: null,
      processingFee: null,
      term: null,
      monthlyPayment: null,
      eobAmount,
    };
  }

  // EOB is clear — proceed with credit pull and instant decision
  if (score >= 600) {
    const fees = calculateLoanFees(eobAmount);
    const term = getAssignedTerm(eobAmount);
    const monthlyPayment = (eobAmount / term).toFixed(2);
    return {
      decision: "approved",
      approvedAmount: eobAmount.toFixed(2),
      originationRate: fees.originationRate,
      originationFee: fees.originationFee,
      providerDisbursement: fees.providerDisbursement,
      processingFee: fees.processingFee,
      apr: "0% if paid within 12 months",
      term: `${term} mo`,
      monthlyPayment,
      eobAmount,
    };
  } else if (score >= 560) {
    return { decision: "review", approvedAmount: null, originationFee: null, providerDisbursement: null, processingFee: null, term: null, monthlyPayment: null, eobAmount };
  } else {
    return { decision: "declined", approvedAmount: null, originationFee: null, providerDisbursement: null, processingFee: null, term: null, monthlyPayment: null, eobAmount };
  }
}

// ─── INTAKE FORM (pre-auth) ───────────────────────────────────────────────────

// ─── PENDING REVIEW WATERMARK ─────────────────────────────────────────────
// Site-wide, non-interactive reminder that copy (blog posts, marketing
// pages, everything) hasn't cleared human/legal review yet.

const pendingReviewWatermarkUrl = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="260">
    <text x="10" y="140" transform="rotate(-28 210 130)" font-family="DM Sans, Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="2" fill="rgba(0,25,54,0.07)">DRAFT &#183; PENDING REVIEW</text>
  </svg>`
)}`;

function ContentPendingWatermark() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 400,
        pointerEvents: "none",
        backgroundImage: `url("${pendingReviewWatermarkUrl}")`,
        backgroundRepeat: "repeat",
      }}
    />
  );
}

// ─── COMING SOON: BANNER + WAITLIST MODAL ─────────────────────────────────

function ComingSoonBanner({ onJoinClick }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 500,
        width: "100%",
        background: "linear-gradient(90deg, #01665E, #0FB8AB)",
        color: "#FFFFFF",
        fontFamily: "DM Sans, sans-serif",
        padding: "10px 16px",
        textAlign: "center",
        fontSize: 13.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <span>🚧 <strong>Prism Patient is launching soon.</strong> You're an early visitor — sign-in and applications aren't open yet.</span>
      <button
        onClick={onJoinClick}
        style={{
          background: "#FFFFFF",
          color: "#01665E",
          border: "none",
          borderRadius: 999,
          padding: "5px 14px",
          fontSize: 12.5,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        Join the waitlist
      </button>
    </div>
  );
}

// Mailchimp embedded-form target. Posting a real <form> to this URL with
// target set to a hidden iframe submits the subscriber directly to
// Mailchimp — no API key, no CORS, no backend involved. Values copied from
// the embed code in Mailchimp: Audience > Forms > Other forms > Embedded form.
const MAILCHIMP_ACTION_URL = "https://gmail.us5.list-manage.com/subscribe/post?u=0fe959857832831538427af7e&id=f2c9ab9c3a&f_id=00e4bdedf0";
// Mailchimp's anti-bot honeypot field. Must stay present, hidden, and empty.
const MAILCHIMP_HONEYPOT_NAME = "b_0fe959857832831538427af7e_f2c9ab9c3a";

function ComingSoonModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | done

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    if (!firstName.trim() || !lastName.trim()) { e.preventDefault(); setError("Please enter your first and last name."); return; }
    if (!isValidEmail) { e.preventDefault(); setError("Please enter a valid email address."); return; }
    setError("");
    setStatus("submitting");
    // No preventDefault here — the browser submits the real <form> below to
    // Mailchimp, loading the response into the hidden iframe instead of
    // navigating the page. We optimistically show success shortly after.
    setTimeout(() => setStatus("done"), 900);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 25, 54, 0.55)",
        zIndex: 900,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ maxWidth: 420, width: "100%", position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 14, right: 14, background: "none", border: "none",
            fontSize: 20, lineHeight: 1, cursor: "pointer", color: "var(--text-light)",
          }}
        >
          ×
        </button>
        <div className="card-header">
          <div className="card-icon teal">🚀</div>
          <div>
            <div className="card-title">We're launching soon!</div>
            <div className="card-subtitle">Prism Patient isn't live yet — leave your email and we'll let you know the moment we open.</div>
          </div>
        </div>
        <div className="card-body">
          {status === "done" ? (
            <div className="alert success" style={{ textAlign: "center" }}>
              You're on the list! Check your inbox to confirm if prompted — we'll email you as soon as we launch.
            </div>
          ) : (
            <form
              action={MAILCHIMP_ACTION_URL}
              method="post"
              target="mc_hidden_iframe"
              onSubmit={handleSubmit}
            >
              <div className="form-group">
                <label>First Name *</label>
                <input name="FNAME" placeholder="Jane" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input name="LNAME" placeholder="Smith" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input type="email" name="EMAIL" placeholder="jane@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {/* Mailchimp anti-bot honeypot — must stay hidden and empty */}
              <div aria-hidden="true" style={{ position: "absolute", left: -5000 }}>
                <input type="text" name={MAILCHIMP_HONEYPOT_NAME} tabIndex={-1} defaultValue="" />
              </div>
              {error && <div style={{ color: "#DC2626", fontSize: 13, marginBottom: 12 }}>{error}</div>}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%" }}
                disabled={!email || !firstName.trim() || !lastName.trim() || status === "submitting"}
              >
                {status === "submitting" ? "Joining..." : "Notify Me at Launch"}
              </button>
              <div style={{ fontSize: 11.5, color: "var(--text-light)", textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
                We'll only use this to send you launch updates. No spam, unsubscribe anytime.
              </div>
            </form>
          )}
        </div>
      </div>
      <iframe name="mc_hidden_iframe" title="mailchimp-submit" style={{ display: "none" }} />
    </div>
  );
}

function IntakeForm({ onSubmit, prefill, hideContactFields, storageKey }) {
  const [form, setForm] = useState(() => {
    let draft = null;
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) draft = JSON.parse(saved);
      } catch (e) { /* ignore corrupt/unavailable storage */ }
    }
    return {
      firstName: prefill?.firstName || draft?.firstName || "",
      lastName: prefill?.lastName || draft?.lastName || "",
      phone: prefill?.phone || draft?.phone || "",
      email: prefill?.email || draft?.email || "",
      balanceOwed: prefill?.balanceOwed || draft?.balanceOwed || "",
      careDescription: prefill?.careDescription || draft?.careDescription || "",
      provider: draft?.provider || "",
      referralCode: prefill?.referralCode || draft?.referralCode || "",
    };
  });
  const upd = (k, v) => setForm(f => {
    const next = { ...f, [k]: v };
    if (storageKey) {
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch (e) { /* ignore storage errors */ }
    }
    return next;
  });
  const valid = form.firstName && form.lastName && form.email && form.phone && form.balanceOwed && form.careDescription;
  const handleSubmit = () => {
    if (storageKey) {
      try { localStorage.removeItem(storageKey); } catch (e) { /* ignore storage errors */ }
    }
    onSubmit(form);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon teal">💚</div>
        <div>
          <div className="card-title">Check Your Payment Options</div>
          <div className="card-subtitle">Takes under 2 minutes — no impact to your credit score</div>
        </div>
      </div>
      <div className="card-body">
        {hideContactFields ? (
          <div className="alert info" style={{ marginBottom: 20 }}>
            Using the contact info on your account: <strong>{form.firstName} {form.lastName}</strong>, {form.email}{form.phone ? `, ${form.phone}` : ""}.
          </div>
        ) : (
          <>
            <div className="section-title">Tell us about yourself</div>
            <div className="section-sub">Your information is private and HIPAA-protected.</div>
            <div className="form-row">
              <div className="form-group"><label>First Name *</label><input placeholder="Maria" value={form.firstName} onChange={e => upd("firstName", e.target.value)} /></div>
              <div className="form-group"><label>Last Name *</label><input placeholder="Lopez" value={form.lastName} onChange={e => upd("lastName", e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Phone Number *</label><input placeholder="(555) 000-0000" value={form.phone} onChange={e => upd("phone", formatPhone(e.target.value))} /></div>
              <div className="form-group"><label>Email Address *</label><input type="email" placeholder="maria@email.com" value={form.email} onChange={e => upd("email", e.target.value)} /></div>
            </div>
          </>
        )}
        <div className="form-row">
          <div className="form-group">
            <label>Estimated Balance Owed ($) *</label>
            <div className="input-prefix"><span>$</span><input type="text" inputMode="numeric" placeholder="0" value={form.balanceOwed} onChange={e => upd("balanceOwed", formatIncome(e.target.value))} /></div>
            <div className="helper-text">Include copays, deductibles, or self-pay amounts</div>
          </div>
          <div className="form-group"><label>Provider / Practice Name</label><input placeholder="e.g. Sunrise Health Clinic" value={form.provider} onChange={e => upd("provider", e.target.value)} /></div>
        </div>
        <div className="form-group">
          <label>Description of Care Needed *</label>
          <textarea placeholder="Briefly describe the healthcare service you are seeking (e.g. dental work, physical therapy, behavioral health treatment, chiropractic care, etc.)" value={form.careDescription} onChange={e => upd("careDescription", e.target.value)} style={{ minHeight: 90, resize: "vertical", lineHeight: 1.6 }} />
          <div className="helper-text">Required — helps us match you with the right payment options.</div>
        </div>
        <hr className="divider" />
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={!valid} onClick={handleSubmit}>
          Continue — Check My Options
        </button>
      </div>
    </div>
  );
}

// ─── MAGIC LINK SENT SCREEN ───────────────────────────────────────────────────

function MagicLinkSent({ email, magicLink, onSimulateClick }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(magicLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="card">
      <div className="success-screen">
        <div className="success-icon">📬</div>
        <h2>Check your email</h2>
        <p>{"We sent a secure sign-in link to:"}<br /><strong style={{ color: "var(--teal-dark)" }}>{email}</strong></p>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: -16 }}>{"Click the link in your email to register and complete your application. The link expires in 24 hours."}</p>

        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "var(--radius-sm)", padding: "14px 16px", fontSize: 13, color: "#92400E", marginBottom: 20, textAlign: "left" }}>
          <strong>Demo mode:</strong> Email sending requires deployment. Use the link below to simulate clicking the magic link.
        </div>

        <div className="magic-link-box">
          <span className="magic-link-url">{magicLink}</span>
          <button className="copy-btn" onClick={handleCopy}>{copied ? "Copied!" : "Copy"}</button>
        </div>

        <button className="btn btn-primary" style={{ width: "100%" }} onClick={onSimulateClick}>
          Simulate: Click Magic Link
        </button>
      </div>
    </div>
  );
}

// ─── SHARED AUTH UTILITIES ────────────────────────────────────────────────────

function LogoDark({ width = 158, height = 63 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 1983 793" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#001936" strokeWidth="7" strokeLinejoin="round">
        <polygon points="430,164 560,391 415,453 203,550" fill="#0FB8AB"/>
        <polygon points="203,550 172,597 430,590 415,453" fill="#01665E"/>
        <polygon points="560,391 687,597 430,590 415,453" fill="#F7A106"/>
      </g>
      <text x="750" y="520" fontFamily="Inter, Montserrat, Avenir Next, Helvetica, Arial, sans-serif" fontSize="400" fontWeight="900" letterSpacing="-8" fill="#F8FAFC">Pr{"\u0131"}sm</text>
      <circle cx="1225" cy="215" r="42" fill="#0FB8AB"/>
      <text x="755" y="615" fontFamily="Inter, Montserrat, Avenir Next, Helvetica, Arial, sans-serif" fontSize="95" fontWeight="400" letterSpacing="2" fill="#CBD5E1">Patient Payment Solutions</text>
    </svg>
  );
}

function validatePassword(pw) {
  const errors = [];
  if (pw.length < 8) errors.push("At least 8 characters");
  if (!/[0-9]/.test(pw)) errors.push("At least one number");
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) errors.push("At least one special character");
  return errors;
}

function PasswordStrength({ password }) {
  const errors = validatePassword(password);
  if (!password) return null;
  const rules = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Contains a number", pass: /[0-9]/.test(password) },
    { label: "Contains a special character", pass: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];
  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
      {rules.map(r => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <span style={{ color: r.pass ? "var(--success)" : "var(--text-light)", fontWeight: 700 }}>{r.pass ? "✓" : "○"}</span>
          <span style={{ color: r.pass ? "var(--success)" : "var(--text-light)" }}>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

function ForgotFlow({ type, onBack }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const label = type === "password" ? "Password Reset" : "Username Recovery";
  const bodyText = type === "password"
    ? "Enter your email address and we will send you a link to reset your password."
    : "Enter your email address and we will send you your account username if one exists.";
  const sentText = type === "password"
    ? "If an account exists for that email, a password reset link has been sent."
    : "If an account exists for that email, your username has been sent to that address.";
  return (
    <div style={{ padding: "0 0 8px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--teal-dark)", fontFamily: "DM Sans, sans-serif", fontSize: 13, cursor: "pointer", fontWeight: 500, marginBottom: 16, padding: 0 }}>← Back to Sign In</button>
      <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{label}</div>
      {!sent ? (
        <>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>{bodyText}</div>
          <div className="form-group"><label>Email Address</label><input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <button className="btn btn-primary" style={{ width: "100%" }} disabled={!email} onClick={() => setSent(true)}>Send {type === "password" ? "Reset Link" : "Username"}</button>
        </>
      ) : (
        <div className="alert success">{sentText}</div>
      )}
    </div>
  );
}

function AuthDivider() {
  return (
    <div className="section-divider" style={{ margin: "16px 0" }}>
      <div className="section-divider-line" />
      <div className="section-divider-text">or</div>
      <div className="section-divider-line" />
    </div>
  );
}

// ─── REGISTER / LOGIN PAGE (patient intake) ───────────────────────────────────

function AuthPage({ intakeData, onAuthenticated }) {
  const { active: comingSoon, requestAccess } = useComingSoon();
  const [tab, setTab] = useState("register");
  const [forgot, setForgot] = useState(null); // "password" | "username" | null
  const [regForm, setRegForm] = useState({ password: "", confirmPassword: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [magicEmail, setMagicEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState("");
  const updReg = (k, v) => setRegForm(f => ({ ...f, [k]: v }));
  const updLogin = (k, v) => setLoginForm(f => ({ ...f, [k]: v }));

const handleRegister = async () => {
    if (comingSoon) { requestAccess(); return; }
    const errs = validatePassword(regForm.password);
    if (errs.length) { setError(errs[0]); return; }
    if (regForm.password !== regForm.confirmPassword) { setError("Passwords do not match."); return; }
    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: intakeData.email,
      password: regForm.password,
      options: { data: { role: "patient" } },
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    await supabase.from("patients").insert({
      email: intakeData.email,
      first_name: intakeData.firstName,
      last_name: intakeData.lastName,
      phone: intakeData.phone,
    });

    onAuthenticated({ email: intakeData.email, firstName: intakeData.firstName, lastName: intakeData.lastName });
  };

const handlePasswordSignIn = async () => {
    if (comingSoon) { requestAccess(); return; }
    if (!loginForm.email || !loginForm.password) { setError("Please enter your email and password."); return; }
    setError("");

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const { data: patientData } = await supabase
      .from("patients")
      .select("*")
      .eq("email", loginForm.email)
      .order("created_at", { ascending: false })
      .limit(1);

    const patientRow = patientData?.[0];
    if (!patientRow) {
      await supabase.auth.signOut();
      setError("We couldn't find a patient account for this email. If you're a provider, please use Provider Sign In instead.");
      return;
    }

    onAuthenticated({
      email: loginForm.email,
      firstName: patientRow.first_name || "",
      lastName: patientRow.last_name || "",
    });
  };

  const handleMagicLink = async () => {
    if (comingSoon) { requestAccess(); return; }
    if (!magicEmail) return;

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: magicEmail,
    });

    if (otpError) {
      setError(otpError.message);
      return;
    }

    setMagicSent(true);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon teal">🔐</div>
        <div>
          <div className="card-title">Create Your Account</div>
          <div className="card-subtitle">Secure your application with a password</div>
        </div>
      </div>
      <div className="tab-bar">
        <button className={`tab-btn ${tab === "register" ? "active" : ""}`} onClick={() => { setTab("register"); setForgot(null); setError(""); }}>Create Account</button>
        <button className={`tab-btn ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setForgot(null); setError(""); }}>Sign In</button>
      </div>
      <div className="card-body">
        {tab === "register" && (
          <>
            <div className="alert info" style={{ marginBottom: 16 }}>{"Creating account for: "}<strong>{intakeData?.email}</strong></div>
            <div className="form-group">
              <label>Create Password *</label>
              <input type="password" placeholder="Min. 8 chars, 1 number, 1 special character" value={regForm.password} onChange={e => updReg("password", e.target.value)} />
              <PasswordStrength password={regForm.password} />
            </div>
            <div className="form-group">
              <label>Confirm Password *</label>
              <input type="password" placeholder="Re-enter your password" value={regForm.confirmPassword} onChange={e => updReg("confirmPassword", e.target.value)} />
            </div>
            {error && <div style={{ color: "#DC2626", fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleRegister}>Create Account & Continue</button>
          </>
        )}

        {tab === "login" && !forgot && (
          <>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="maria@email.com" value={loginForm.email} onChange={e => updLogin("email", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Your password" value={loginForm.password} onChange={e => updLogin("password", e.target.value)} />
            </div>
            {error && <div style={{ color: "#DC2626", fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <button onClick={() => { setForgot("password"); setError(""); }} style={{ background: "none", border: "none", color: "var(--teal-dark)", fontSize: 12, cursor: "pointer", fontFamily: "DM Sans, sans-serif", padding: 0 }}>Forgot password?</button>
              <button onClick={() => { setForgot("username"); setError(""); }} style={{ background: "none", border: "none", color: "var(--teal-dark)", fontSize: 12, cursor: "pointer", fontFamily: "DM Sans, sans-serif", padding: 0 }}>Forgot username?</button>
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={handlePasswordSignIn}>Sign In</button>
            <AuthDivider />
            {!magicSent ? (
              <>
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <label>Or sign in with a magic link</label>
                  <input type="email" placeholder="Enter your email" value={magicEmail} onChange={e => setMagicEmail(e.target.value)} />
                </div>
                <button className="btn btn-ghost" style={{ width: "100%" }} disabled={!magicEmail} onClick={handleMagicLink}>Send Magic Link</button>
              </>
            ) : (
              <div className="alert success">{"Magic link sent! Check your email to sign in."}</div>
            )}
          </>
        )}

        {tab === "login" && forgot && <ForgotFlow type={forgot} onBack={() => setForgot(null)} />}

        <div className="section-divider" style={{ marginTop: 20 }}>
          <div className="section-divider-line" />
          <div className="section-divider-text">HIPAA-protected and encrypted</div>
          <div className="section-divider-line" />
        </div>
        <div style={{ fontSize: 12, color: "var(--text-light)", textAlign: "center", lineHeight: 1.6 }}>
          By creating an account you agree to our Terms of Service and Privacy Policy. Your health information is never sold or shared.
        </div>
      </div>
    </div>
  );
}

// ─── PATIENT PORTAL (underwriting + plan selection) ──────────────────────────

function PatientPortal({ user, intakeData, onApprovalResult, onEobReview, onSignOut, onApplicationCreated, embedded }) {
  const [uwStep, setUwStep] = useState(0);
  const [uwForm, setUwForm] = useState({
    dob: "", ssn: "", address: "", city: "", state: "", zip: "",
    employmentStatus: "", annualIncome: "", employerName: "",
    mockCreditScore: "670",
    eobFile: "", eobFileObj: null, eobAmount: intakeData.balanceOwed || "", eobClarity: "clear",
  });
  const [submitting, setSubmitting] = useState(false);
  const [eobUploadError, setEobUploadError] = useState("");
  const fileInputRef = useRef(null);

  const handleEobFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEobUploadError("");
    setUwForm(f => ({ ...f, eobFile: file.name, eobFileObj: file }));
  };

  const uwSteps = ["Personal", "Financial", "Upload EOB", "Review"];
  const upd = (k, v) => setUwForm(f => ({ ...f, [k]: v }));

  const canProceed = [
    uwForm.dob && uwForm.ssn && uwForm.address && uwForm.city && uwForm.state && uwForm.zip,
    uwForm.employmentStatus && uwForm.annualIncome,
    uwForm.eobFile && uwForm.eobAmount,
    true,
  ][uwStep];

  const handleSubmit = async () => {
    setSubmitting(true);

    const result = runEobUnderwriting({ ...uwForm, eobVerifiedAmount: uwForm.eobAmount, balanceOwed: intakeData.balanceOwed });

    const { data: patientData } = await supabase
      .from("patients")
      .select("id")
      .eq("email", user.email)
      .single();

    const { data: appData } = await supabase.from("applications").insert({
      patient_id: patientData?.id,
      balance_owed: parseFloat(intakeData.balanceOwed),
      care_description: intakeData.careDescription,
      decision: result.decision,
      approved_amount: result.approvedAmount ? parseFloat(result.approvedAmount) : null,
      apr: result.apr,
      term: result.term,
      monthly_payment: result.monthlyPayment ? parseFloat(result.monthlyPayment) : null,
      status: result.decision,
    }).select().single();

    if (intakeData.referralCode) {
      await supabase.from("referrals").update({ status: "applied" }).eq("referral_code", intakeData.referralCode);
    }

    if (uwForm.eobFile) {
      let fileUrl = null;

      if (uwForm.eobFileObj) {
        const filePath = `${patientData?.id || "unlinked"}/${Date.now()}_${uwForm.eobFileObj.name}`;
        const { error: uploadError } = await supabase.storage
          .from("eob-documents")
          .upload(filePath, uwForm.eobFileObj);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from("eob-documents").getPublicUrl(filePath);
          fileUrl = publicUrlData?.publicUrl || null;
        } else {
          setEobUploadError("File upload failed — the application was still submitted, but the document wasn't attached.");
        }
      }

      await supabase.from("documents").insert({
        patient_id: patientData?.id,
        document_type: "EOB",
        file_name: uwForm.eobFile,
        file_url: fileUrl,
        status: uwForm.eobClarity === "clear" ? "verified" : "reviewing",
      });
    }

    setSubmitting(false);
    onApplicationCreated?.(appData?.id, patientData?.id);

    if (result.decision === "eob_review") {
      onEobReview(result, intakeData);
    } else {
      onApprovalResult(result, intakeData, null);
    }
  };

  const initials = (user.firstName?.[0] || user.email?.[0] || "P").toUpperCase();

  return (
    <>
      {!embedded ? (
        <div className="portal-header">
          <div className="portal-user">
            <div className="portal-avatar">{initials}</div>
            <div>
              <div className="portal-name">{user.firstName ? `${user.firstName} ${user.lastName}` : "Patient"}</div>
              <div className="portal-email">{user.email}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>Balance to finance</div>
              <div style={{ color: "white", fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 20 }}>${parseFloat(intakeData.balanceOwed || 0).toLocaleString()}</div>
            </div>
            <button className="btn btn-ghost" style={{ fontSize: 13, padding: "8px 16px" }} onClick={onSignOut}>Sign Out</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={onSignOut} style={{ background: "none", border: "none", color: "var(--teal-dark)", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 500, padding: 0 }}>{"← Cancel"}</button>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Balance to finance: <strong style={{ color: "var(--text-primary)" }}>${parseFloat(intakeData.balanceOwed || 0).toLocaleString()}</strong></div>
        </div>
      )}

      <div className="main-narrow">
        <div className="card">
          <div className="card-header">
            <div className="card-icon teal">📋</div>
            <div>
              <div className="card-title">Complete Your Application</div>
              <div className="card-subtitle">Required for pre-approval — all information is encrypted</div>
            </div>
          </div>
          <div className="card-body">
            <div className="steps">
              {uwSteps.map((s, i) => (
                <div className="step" key={i}>
                  <div className={`step-dot ${i < uwStep ? "done" : i === uwStep ? "active" : ""}`}>{i < uwStep ? "✓" : i + 1}</div>
                  <div className={`step-label ${i === uwStep ? "active" : ""}`}>{s}</div>
                </div>
              ))}
            </div>

            {uwStep === 0 && (
              <>
                <div className="section-title">Personal Information</div>
                <div className="section-sub">Required for identity verification and underwriting.</div>
                <div className="form-row">
                  <div className="form-group"><label>Date of Birth *</label><input type="date" value={uwForm.dob} onChange={e => upd("dob", e.target.value)} /></div>
                  <div className="form-group">
                    <label>Social Security Number *</label>
                    <input className="input-sensitive" placeholder="XXX-XX-XXXX" value={uwForm.ssn} onChange={e => upd("ssn", formatSSN(e.target.value))} maxLength={11} />
                    <div className="helper-text">256-bit encrypted — never stored in plain text</div>
                  </div>
                </div>
                <div className="form-group"><label>Street Address *</label><input placeholder="123 Main Street" value={uwForm.address} onChange={e => upd("address", e.target.value)} /></div>
                <div className="form-row">
                  <div className="form-group"><label>City *</label><input placeholder="Miami" value={uwForm.city} onChange={e => upd("city", e.target.value)} /></div>
                  <div className="form-group"><label>State *</label>
                    <select value={uwForm.state} onChange={e => upd("state", e.target.value)}>
                      <option value="">Select...</option>
                      {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ maxWidth: 180 }}><label>ZIP Code *</label><input placeholder="33101" value={uwForm.zip} onChange={e => upd("zip", e.target.value)} maxLength={5} /></div>
              </>
            )}

            {uwStep === 1 && (
              <>
                <div className="section-title">Financial Information</div>
                <div className="section-sub">Used to determine your eligibility and plan options.</div>
                <div className="form-group">
                  <label>Employment Status *</label>
                  <select value={uwForm.employmentStatus} onChange={e => upd("employmentStatus", e.target.value)}>
                    <option value="">Select...</option>
                    <option>Employed Full-Time</option>
                    <option>Employed Part-Time</option>
                    <option>Self-Employed</option>
                    <option>Retired</option>
                    <option>Unemployed</option>
                    <option>Student</option>
                    <option>Unable to Work</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Annual Household Income ($) *</label>
                  <div className="input-prefix"><span>$</span><input type="text" inputMode="numeric" placeholder="0" value={uwForm.annualIncome} onChange={e => upd("annualIncome", formatIncome(e.target.value))} /></div>
                  <div className="helper-text">Include all sources: wages, benefits, Social Security, etc.</div>
                </div>
                <div className="form-group">
                  <label>Employer / Income Source</label>
                  <input placeholder="e.g. Employer name or Social Security" value={uwForm.employerName} onChange={e => upd("employerName", e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Estimated Credit Score (for demo)</label>
                  <select value={uwForm.mockCreditScore} onChange={e => upd("mockCreditScore", e.target.value)}>
                    <option value="720">720+ (Excellent)</option>
                    <option value="680">680–719 (Good)</option>
                    <option value="640">640–679 (Fair)</option>
                    <option value="600">600–639 (Poor)</option>
                    <option value="550">Below 600 (Very Poor)</option>
                  </select>
                  <div className="helper-text">Demo only — a real credit pull replaces this on deployment.</div>
                </div>
              </>
            )}

            {uwStep === 2 && (
              <>
                <div className="section-title">Upload Your EOB or Bill</div>
                <div className="section-sub">{"We use your Explanation of Benefits (EOB) or provider statement to verify the exact amount owed — this gives you a more accurate, more reliable financing decision than a generic credit check alone."}</div>
                <div className="alert info">{"Estimated balance from your application: "}<strong>${parseFloat(intakeData.balanceOwed || 0).toLocaleString()}</strong> {"for "}<strong>{intakeData.careDescription}</strong></div>

                <div className="form-group">
                  <label>Upload EOB or Provider Statement *</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: "none" }}
                    onChange={handleEobFileChange}
                  />
                  <div style={{ border: "2px dashed var(--border)", borderRadius: "var(--radius-sm)", padding: "28px 20px", textAlign: "center", cursor: "pointer", background: "var(--mist2)" }}
                    onClick={() => fileInputRef.current?.click()}>
                    {uwForm.eobFile ? (
                      <div><div style={{ fontSize: 24, marginBottom: 6 }}>📄</div><div style={{ fontWeight: 600, fontSize: 14 }}>{uwForm.eobFile}</div><div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Click to change file</div></div>
                    ) : (
                      <div><div style={{ fontSize: 32, marginBottom: 8 }}>📎</div><div style={{ fontWeight: 500, fontSize: 14, color: "var(--text-secondary)" }}>Click to select a file</div><div style={{ fontSize: 12, color: "var(--text-light)", marginTop: 4 }}>PDF, JPG, or PNG — max 10MB</div></div>
                    )}
                  </div>
                  <div className="helper-text">Uploads to secure storage when you submit your application.</div>
                  {eobUploadError && <div className="alert" style={{ marginTop: 10, background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}>{eobUploadError}</div>}
                </div>

                <div className="form-group">
                  <label>Amount Shown on EOB / Statement ($) *</label>
                  <div className="input-prefix"><span>$</span><input type="text" inputMode="numeric" placeholder="0" value={uwForm.eobAmount} onChange={e => upd("eobAmount", formatIncome(e.target.value))} /></div>
                  <div className="helper-text">This is the amount our team will verify against your uploaded document.</div>
                </div>

                <div className="form-group">
                  <label>Demo: EOB Review Outcome</label>
                  <select value={uwForm.eobClarity} onChange={e => upd("eobClarity", e.target.value)}>
                    <option value="clear">Clear — verify instantly</option>
                    <option value="needs_review">Unclear — route to human review</option>
                  </select>
                  <div className="helper-text">Demo only — in production, our team or AI review determines this automatically.</div>
                </div>
              </>
            )}

            {uwStep === 3 && (
              <>
                <div className="section-title">Review & Submit</div>
                <div className="section-sub">Confirm your details before we submit your application.</div>
                <div style={{ background: "var(--mist)", borderRadius: "var(--radius-sm)", padding: 20, marginBottom: 20 }}>
                  {[
                    ["Name", `${intakeData.firstName} ${intakeData.lastName}`],
                    ["Email", user.email],
                    ["Date of Birth", uwForm.dob],
                    ["Address", `${uwForm.address}, ${uwForm.city}, ${uwForm.state} ${uwForm.zip}`],
                    ["Employment", uwForm.employmentStatus],
                    ["Annual Income", `$${parseFloat(uwForm.annualIncome || 0).toLocaleString()}`],
                    ["Care Description", intakeData.careDescription],
                    ["EOB Document", uwForm.eobFile],
                    ["EOB Amount", `$${parseFloat(uwForm.eobAmount || 0).toLocaleString()}`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
                      <span style={{ color: "var(--text-secondary)" }}>{k}</span>
                      <span style={{ fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="alert info">{"By submitting, you authorize Prism Patient to verify your EOB and perform a soft credit check to determine your financing offer. This does not affect your credit score. If approved, your loan is 0% interest as long as it's paid within 12 months. A 3.5% processing fee applies."}</div>
                {submitting && (
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Submitting your application...</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Verifying your EOB and checking your offer</div>
                  </div>
                )}
              </>
            )}

            {!submitting && (
              <>
                <hr className="divider" />
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  {uwStep > 0 && <button className="btn btn-ghost" onClick={() => setUwStep(s => s - 1)}>Back</button>}
                  <button className="btn btn-primary" disabled={!canProceed} onClick={uwStep === 3 ? handleSubmit : () => setUwStep(s => s + 1)}>
                    {uwStep === 3 ? "Submit Application" : "Continue"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── EMAIL MOCK DISPLAY ───────────────────────────────────────────────────────

function MockEmail({ subject, to, body, note }) {
  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden", boxShadow: "var(--shadow)", marginBottom: 20 }}>
      <div style={{ background: "#F8FAFC", borderBottom: "1px solid var(--border)", padding: "14px 20px" }}>
        <div style={{ fontSize: 11, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, fontWeight: 600 }}>Mock Email Preview</div>
        <div style={{ fontSize: 13, marginBottom: 4 }}><span style={{ color: "var(--text-secondary)", width: 48, display: "inline-block" }}>To:</span><strong>{to}</strong></div>
        <div style={{ fontSize: 13 }}><span style={{ color: "var(--text-secondary)", width: 48, display: "inline-block" }}>Re:</span>{subject}</div>
      </div>
      <div style={{ padding: "20px", fontSize: 14, color: "var(--slate)", lineHeight: 1.8, whiteSpace: "pre-line" }}>{body}</div>
      {note && <div style={{ background: "#FFFBEB", borderTop: "1px solid #FDE68A", padding: "10px 20px", fontSize: 12, color: "#92400E" }}><strong>Demo note:</strong> {note}</div>}
    </div>
  );
}

// ─── APPLICATION SUBMITTED SCREEN ────────────────────────────────────────────

function AppSubmitted({ intakeData, onSimulateDecision, onSignOut, embedded }) {
  const [showEmail, setShowEmail] = useState(false);

  const emailBody =
`Dear ${intakeData.firstName},

Thank you for submitting your application through Prism Patient.

We have received your application and your uploaded EOB / provider statement for:

  Care Description: ${intakeData.careDescription}
  Estimated Amount: $${parseFloat(intakeData.balanceOwed || 0).toLocaleString()}

Our team is verifying your EOB and running a credit check. Most applicants receive a decision within minutes — if your EOB needs a closer look, we will let you know and follow up within 1 business day.

If you have any questions in the meantime, please reply to this email.

— The Prism Patient Team`;

  return (
    <>
      {!embedded ? (
        <div className="portal-header">
          <div style={{ color: "white" }}>
            <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 2 }}>Application submitted</div>
            <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 18 }}>{intakeData.careDescription}</div>
          </div>
          <button className="btn btn-ghost" style={{ fontSize: 13, padding: "8px 16px" }} onClick={onSignOut}>Sign Out</button>
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <button onClick={onSignOut} style={{ background: "none", border: "none", color: "var(--teal-dark)", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 500, padding: 0 }}>{"← Cancel"}</button>
        </div>
      )}
      <div className="main-narrow">
        <div className="card">
          <div className="success-screen" style={{ paddingBottom: 32 }}>
            <div className="success-icon">📨</div>
            <h2>Application Submitted</h2>
            <p>{"Your application and EOB have been received. We're verifying your information now."}</p>
            <button className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => setShowEmail(v => !v)}>
              {showEmail ? "Hide" : "Preview"} Confirmation Email
            </button>
            {showEmail && (
              <MockEmail
                to={intakeData.email}
                subject="Your Prism Patient Application Has Been Received"
                body={emailBody}
                note="On deployment this email sends automatically via SendGrid when the application is submitted."
              />
            )}
            <div style={{ background: "var(--mist)", borderRadius: "var(--radius-sm)", padding: 20, textAlign: "left", marginTop: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>What happens next</div>
              {[
                "Application confirmation email sent to your inbox",
                "Your EOB is verified and a credit check is run",
                "Most decisions are instant — some need a closer look from our team",
                "You receive a decision email with a link to review your offer",
              ].map((s, i) => (
                <div className="next-step-item" key={i}>
                  <div className="next-step-num">{i + 1}</div>{s}
                </div>
              ))}
            </div>
            <hr className="divider" />
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "var(--radius-sm)", padding: "14px 16px", fontSize: 13, color: "#92400E", marginBottom: 20, textAlign: "left" }}>
              <strong>Demo mode:</strong> In production, a real decision comes back from EOB verification and a live credit pull. Click below to simulate it.
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={onSimulateDecision}>
              Simulate: Receive Decision
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── EOB UNDER REVIEW SCREEN ──────────────────────────────────────────────────

function EobUnderReview({ result, intakeData, onCheckStatus, onSignOut, embedded }) {
  const [showEmail, setShowEmail] = useState(true);

  const emailBody =
`Hey ${intakeData.firstName},

Just a quick note — we're taking a closer look at the EOB you uploaded to make sure we get your financing offer exactly right.

This usually only takes a little while, and we'll follow up by email as soon as we have a decision. No action is needed from you right now.

Thanks for your patience!

— The Prism Patient Team`;

  return (
    <>
      {!embedded ? (
        <div className="portal-header">
          <div style={{ color: "white" }}>
            <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 2 }}>Application status</div>
            <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 18 }}>EOB Under Review</div>
          </div>
          <button className="btn btn-ghost" style={{ fontSize: 13, padding: "8px 16px" }} onClick={onSignOut}>Sign Out</button>
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <button onClick={onSignOut} style={{ background: "none", border: "none", color: "var(--teal-dark)", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 500, padding: 0 }}>{"← Cancel"}</button>
        </div>
      )}
      <div className="main-narrow">
        {showEmail && (
          <MockEmail
            to={intakeData.email}
            subject="Quick update on your Prism Patient application"
            body={emailBody}
            note="Sends automatically the moment an EOB is routed to human review."
          />
        )}
        <button className="btn btn-ghost" style={{ marginBottom: 20, fontSize: 13 }} onClick={() => setShowEmail(v => !v)}>
          {showEmail ? "Hide" : "Show"} Email
        </button>

        <div className="card">
          <div className="success-screen" style={{ paddingBottom: 32 }}>
            <div className="success-icon" style={{ background: "linear-gradient(135deg, var(--warning), #FBBF24)" }}>🔍</div>
            <h2>{"We're reviewing your EOB"}</h2>
            <p>{"Your EOB needs a closer look before we can finalize your offer. We'll have a decision soon and will email you the moment it's ready."}</p>
            <div style={{ background: "var(--mist)", borderRadius: "var(--radius-sm)", padding: 20, textAlign: "left", marginTop: 8, marginBottom: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>What this means</div>
              <div style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.7 }}>
                Most EOBs are verified instantly. Yours needs a quick manual check — this is normal and does not mean anything is wrong. You will receive an email as soon as a decision is made, typically within 1 business day.
              </div>
            </div>
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "var(--radius-sm)", padding: "14px 16px", fontSize: 13, color: "#92400E", marginBottom: 20, textAlign: "left" }}>
              <strong>Demo mode:</strong> Click below to simulate the review finishing and a decision being returned.
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => onCheckStatus(result, intakeData)}>
              Simulate: Decision Ready
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── DECISION EMAIL + OFFER REVIEW ───────────────────────────────────────────

function OfferReview({ result, intakeData, onAccept, onDecline, onSignOut, embedded }) {
  const [showEmail, setShowEmail] = useState(true);
  const approved = result.decision === "approved";
  const review = result.decision === "review";

  const decisionEmailBody = approved
    ? `Dear ${intakeData.firstName},

Great news — your EOB has been verified and you have been approved!

  Approved Amount: $${parseFloat(result.approvedAmount).toLocaleString()}
  Interest Rate: ${result.apr}
  Term: ${result.term}
  Estimated Monthly Payment: $${result.monthlyPayment}
  Processing Fee (3.5%): $${result.processingFee}

To accept this offer, please sign in to your Prism Patient portal using the link below and review your loan agreement.

  [View and Accept Your Offer]
  https://prism-patient-mvp.vercel.app/portal

This offer expires in 30 days.

— The Prism Patient Team`
    : review
    ? `Dear ${intakeData.firstName},

Thank you for your patience. Your application is currently under additional review by our team.

We will contact you within 1 business day with a final decision. You may be asked to provide supporting documentation such as proof of income.

If you have questions please reply to this email.

— The Prism Patient Team`
    : `Dear ${intakeData.firstName},

Thank you for applying through Prism Patient. After careful review, we are unable to approve your application at this time.

A Prism Patient care coordinator will reach out to discuss alternative options that may be available to you, including hardship programs and extended payment arrangements.

— The Prism Patient Team`;

  return (
    <>
      {!embedded ? (
        <div className="portal-header">
          <div style={{ color: "white" }}>
            <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 2 }}>Decision received</div>
            <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 18 }}>{approved ? "Approved" : review ? "Under Review" : "Not Approved"}</div>
          </div>
          <button className="btn btn-ghost" style={{ fontSize: 13, padding: "8px 16px" }} onClick={onSignOut}>Sign Out</button>
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <button onClick={onSignOut} style={{ background: "none", border: "none", color: "var(--teal-dark)", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 500, padding: 0 }}>{"← Cancel"}</button>
        </div>
      )}

      <div className="main-narrow">
        {showEmail && (
          <MockEmail
            to={intakeData.email}
            subject={approved ? "Your Prism Patient Application — Decision Ready" : review ? "Your Prism Patient Application — Under Review" : "Your Prism Patient Application — Update"}
            body={decisionEmailBody}
            note="On deployment this email sends automatically when EOB verification and the credit pull are complete."
          />
        )}
        <button className="btn btn-ghost" style={{ marginBottom: 20, fontSize: 13 }} onClick={() => setShowEmail(v => !v)}>
          {showEmail ? "Hide" : "Show"} Decision Email
        </button>

        <div className={`approval-card ${approved ? "approval-approved" : review ? "approval-review" : "approval-declined"}`}>
          <div className="approval-body">
            <div className="approval-icon">{approved ? "✅" : review ? "🔍" : "❌"}</div>
            <div className="approval-title">{approved ? "You're Approved!" : review ? "Under Review" : "Not Approved"}</div>
            <div className="approval-sub">
              {approved ? "Your EOB has been verified and your financing offer is ready." : review ? "Your application needs additional review. We will be in touch within 1 business day." : "We were unable to approve your application at this time."}
            </div>
            {approved && (
              <>
                <div className="approval-amount">${parseFloat(result.approvedAmount).toLocaleString()}</div>
                <div className="approval-amount-label">Approved Amount</div>
                <div className="approval-details">
                  <div className="approval-detail"><div className="approval-detail-val">{result.apr}</div><div className="approval-detail-label">Interest Rate</div></div>
                  <div className="approval-detail"><div className="approval-detail-val">{result.term}</div><div className="approval-detail-label">Term</div></div>
                  <div className="approval-detail"><div className="approval-detail-val">${result.monthlyPayment}</div><div className="approval-detail-label">Est. Monthly</div></div>
                </div>
              </>
            )}
          </div>
        </div>

        {approved && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-body">
              <div className="section-title" style={{ fontSize: 17 }}>Fee Breakdown</div>
              <div style={{ background: "var(--mist)", borderRadius: "var(--radius-sm)", padding: 16, marginBottom: 20 }}>
                {[
                  ["Loan Amount", `$${parseFloat(result.approvedAmount).toLocaleString()}`],
                  ["Processing Fee (3.5%, charged to you)", `$${result.processingFee}`],
                  ["Term", `${result.term}, 0% interest if paid in full within 12 months`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{k}</span>
                    <span style={{ fontWeight: 600, textAlign: "right" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="section-title" style={{ fontSize: 17 }}>Ready to accept your offer?</div>
              <p style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.7, marginTop: 8, marginBottom: 20 }}>
                Review and sign your loan agreement to finalize your payment plan. Funds will be sent to your provider within 1-2 business days of signing.
              </p>
              <button className="btn btn-primary" style={{ width: "100%", marginBottom: 12 }} onClick={onAccept}>
                Review and Sign Agreement
              </button>
              <button className="btn btn-ghost" style={{ width: "100%" }} onClick={onDecline}>
                Decline This Offer
              </button>
            </div>
          </div>
        )}

        {!approved && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-body">
              {review
                ? <p style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.7 }}>A Prism Patient specialist will contact you at <strong>{intakeData.email}</strong> within 1 business day.</p>
                : <p style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.7 }}>A Prism Patient care coordinator will reach out to discuss alternatives including hardship programs and extended payment arrangements.</p>
              }
              <hr className="divider" />
              <button className="btn btn-ghost" style={{ width: "100%" }} onClick={onSignOut}>Return to Home</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── E-SIGN DOCUMENT ─────────────────────────────────────────────────────────

function ESignDoc({ result, intakeData, patientEmail, applicationId, patientDbId, onSigned, onBack }) {
  const [agreed, setAgreed] = useState(false);
  const [signed, setSigned] = useState(false);
  const [sigName, setSigName] = useState("");
  const [saveError, setSaveError] = useState("");

  const handleSign = async () => {
    if (!agreed || !sigName.trim()) return;
    setSigned(true);

    try {
      let patientId = patientDbId;
      if (!patientId) {
        const { data: patientData } = await supabase
          .from("patients")
          .select("id")
          .eq("email", patientEmail)
          .single();
        patientId = patientData?.id;
      }

      const nextDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const { error: planError } = await supabase.from("payment_plans").insert({
        application_id: applicationId,
        patient_id: patientId,
        original_amount: parseFloat(result.approvedAmount),
        remaining_balance: parseFloat(result.approvedAmount),
        monthly_payment: parseFloat(result.monthlyPayment),
        next_due_date: nextDueDate,
        status: "active",
      });
      if (planError) setSaveError(planError.message);
    } catch (err) {
      setSaveError(err.message);
    }

    setTimeout(() => onSigned(), 1200);
  };

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="main-narrow" style={{ paddingTop: 32 }}>
      <div className="card">
        <div className="card-header">
          <div className="card-icon teal">📄</div>
          <div>
            <div className="card-title">Loan Agreement</div>
            <div className="card-subtitle">Review carefully before signing</div>
          </div>
        </div>
        <div className="card-body">
          <div style={{ background: "var(--mist2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "24px", fontSize: 13, lineHeight: 1.9, color: "var(--slate)", maxHeight: 360, overflowY: "auto", marginBottom: 24 }}>
            <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16, textAlign: "center" }}>CONSUMER LOAN AGREEMENT</div>
            <div style={{ marginBottom: 12 }}><strong>Lender:</strong> Prism Patient Payment Solutions</div>
            <div style={{ marginBottom: 12 }}><strong>Borrower:</strong> {intakeData.firstName} {intakeData.lastName}</div>
            <div style={{ marginBottom: 12 }}><strong>Date:</strong> {today}</div>
            <div style={{ marginBottom: 12 }}><strong>Loan Amount:</strong> ${parseFloat(result.approvedAmount).toLocaleString()}</div>
            <div style={{ marginBottom: 12 }}><strong>Annual Percentage Rate (APR):</strong> {result.apr}</div>
            <div style={{ marginBottom: 12 }}><strong>Loan Term:</strong> {result.term}</div>
            <div style={{ marginBottom: 12 }}><strong>Estimated Monthly Payment:</strong> ${result.monthlyPayment}</div>
            <div style={{ marginBottom: 12 }}><strong>Processing Fee (3.5%, charged to borrower):</strong> ${result.processingFee}</div>
            <div style={{ marginBottom: 12 }}><strong>Purpose of Loan:</strong> {intakeData.careDescription}</div>
            <hr style={{ margin: "16px 0", borderColor: "var(--border)" }} />
            <div style={{ marginBottom: 12 }}><strong>1. Promise to Pay.</strong> Borrower agrees to repay the loan amount in monthly installments as described above, beginning 30 days from the date of funding. This loan carries 0% interest provided the full balance is repaid within 12 months of funding.</div>
            <div style={{ marginBottom: 12 }}><strong>2. Disbursement.</strong> Loan proceeds, less an origination fee deducted by Prism Patient, will be disbursed directly to the healthcare provider within 1-2 business days of signing this agreement.</div>
            <div style={{ marginBottom: 12 }}><strong>3. Prepayment.</strong> Borrower may prepay all or part of the outstanding balance at any time without penalty.</div>
            <div style={{ marginBottom: 12 }}><strong>4. Default.</strong> Borrower will be considered in default if a payment is more than 30 days past due. Default may result in acceleration of the remaining balance and referral to a collections agency.</div>
            <div style={{ marginBottom: 12 }}><strong>5. Autopay Authorization.</strong> By signing this agreement, Borrower authorizes Prism Patient to initiate ACH debit entries from the bank account provided for monthly payment amounts on the scheduled due date.</div>
            <div style={{ marginBottom: 12 }}><strong>6. TILA Disclosure.</strong> This agreement is governed by the Truth in Lending Act (TILA) and Regulation Z. The APR, finance charges, and total repayment amounts disclosed herein represent the full cost of credit.</div>
            <div style={{ marginBottom: 12 }}><strong>7. Privacy.</strong> All personal and health information collected in connection with this loan, including any uploaded EOB or provider statement, is protected under HIPAA and will not be sold or shared with third parties except as necessary to administer this loan.</div>
            <div style={{ fontSize: 11, color: "var(--text-light)", marginTop: 16 }}>This is a mock document for demonstration purposes. On deployment, this agreement will be generated by the issuing lender (e.g. Medallion Bank) and will constitute a legally binding consumer loan agreement.</div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20, cursor: "pointer" }} onClick={() => setAgreed(v => !v)}>
            <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${agreed ? "var(--teal)" : "var(--border)"}`, background: agreed ? "var(--teal)" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
              {agreed && <span style={{ color: "white", fontSize: 12 }}>✓</span>}
            </div>
            <div style={{ fontSize: 13, color: "var(--slate)", lineHeight: 1.6 }}>I have read and agree to the terms of this Loan Agreement, including the TILA disclosures and ACH autopay authorization.</div>
          </div>

          <div className="form-group">
            <label>Type your full legal name to sign *</label>
            <input placeholder={`${intakeData.firstName} ${intakeData.lastName}`} value={sigName} onChange={e => setSigName(e.target.value)} style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "var(--navy)" }} />
            <div className="helper-text">Typing your name constitutes a legal electronic signature under the ESIGN Act.</div>
          </div>

          {signed && (
            <div className="alert success">Signature captured — processing your agreement...</div>
          )}

          {!signed && (
            <>
              <hr className="divider" />
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button className="btn btn-ghost" onClick={onBack}>Back</button>
                <button className="btn btn-primary" disabled={!agreed || !sigName.trim()} onClick={handleSign}>
                  Sign and Accept Offer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── OFFER ACCEPTED CONFIRMATION ─────────────────────────────────────────────

function OfferAccepted({ result, intakeData, providerEmail, onStartOver }) {
  const [showPatientEmail, setShowPatientEmail] = useState(false);
  const [showProviderEmail, setShowProviderEmail] = useState(false);

  const patientEmailBody =
`Dear ${intakeData.firstName},

Congratulations — your loan agreement has been signed and your payment plan is now active!

  Funded Amount: $${parseFloat(result.approvedAmount).toLocaleString()}
  Interest Rate: ${result.apr}
  Term: ${result.term}
  Monthly Payment: $${result.monthlyPayment}
  Processing Fee Charged: $${result.processingFee}
  First Payment Due: 30 days from today

Funds are being disbursed directly to your healthcare provider within 1-2 business days.

Your monthly payments will be automatically debited from your account on file. You will receive a reminder 3 days before each payment.

Thank you for choosing Prism Patient.

— The Prism Patient Team`;

  const providerEmailBody =
`Dear ${intakeData.provider || "Healthcare Provider"},

This is a notification that a patient has accepted a payment plan through Prism Patient and funding is on its way to your practice.

  Patient: ${intakeData.firstName} ${intakeData.lastName}
  Care Description: ${intakeData.careDescription}
  Loan Amount: $${parseFloat(result.approvedAmount).toLocaleString()}
  Origination Fee Deducted: $${result.originationFee}
  Net Disbursement to Your Practice: $${result.providerDisbursement}
  Expected Disbursement: Within 1-2 business days

Net proceeds will be deposited via ACH to your account on file.

If you have questions please contact your Prism Patient account manager.

— The Prism Patient Team`;

  return (
    <div className="main-narrow" style={{ paddingTop: 32 }}>
      <div className="card">
        <div className="success-screen" style={{ paddingBottom: 32 }}>
          <div className="success-icon">🎉</div>
          <h2>{"You're all set!"}</h2>
          <p>Your payment plan is active and funds are on their way to your provider.</p>

          <div style={{ background: "var(--mist)", border: "1px solid #B3EEE9", borderRadius: "var(--radius-sm)", padding: 20, textAlign: "left", marginBottom: 24 }}>
            {[
              ["Funded Amount", `$${parseFloat(result.approvedAmount).toLocaleString()}`],
              ["Monthly Payment", `$${result.monthlyPayment}`],
              ["Term", result.term],
              ["Processing Fee Charged to You", `$${result.processingFee}`],
              ["First Payment Due", "30 days from today"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
                <span style={{ color: "var(--text-secondary)" }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginBottom: 24 }}>
            <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => setShowPatientEmail(v => !v)}>
              {showPatientEmail ? "Hide" : "Preview"} Patient Confirmation Email
            </button>
            {showPatientEmail && (
              <MockEmail
                to={intakeData.email}
                subject="Your Prism Patient Payment Plan is Active"
                body={patientEmailBody}
                note="Sends automatically to the patient upon offer acceptance."
              />
            )}
            <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => setShowProviderEmail(v => !v)}>
              {showProviderEmail ? "Hide" : "Preview"} Provider Payment Notification Email
            </button>
            {showProviderEmail && (
              <MockEmail
                to={providerEmail || "provider@practice.com"}
                subject="Prism Patient — Upcoming Patient Payment to Your Practice"
                body={providerEmailBody}
                note="Sends automatically to the provider notification email on file."
              />
            )}
          </div>

          <hr className="divider" />
          <button className="btn btn-ghost" style={{ width: "100%" }} onClick={onStartOver}>Return to Home</button>
        </div>
      </div>
    </div>
  );
}

// ─── HOW IT WORKS PAGE ────────────────────────────────────────────────────────

function HowItWorks({ onBack, onApply }) {
  const steps = [
    { num: "01", icon: "🔍", title: "Check Your Options", desc: "Tell us about your care and estimated balance. We will show you available payment options in seconds — with no impact to your credit score.", detail: "No commitment required. Checking your options is completely free and takes less than 2 minutes." },
    { num: "02", icon: "📋", title: "Apply in Minutes", desc: "Select the option that works best for you and complete a short application. We only ask for the basics — name, contact info, and a few financial details.", detail: "Your information is private and HIPAA-protected. We use bank-level encryption on every submission." },
    { num: "03", icon: "✓", title: "Get Pre-Approved", desc: "Most patients receive a pre-approval decision in under 60 seconds. If approved, your payment plan details are displayed immediately.", detail: "84% of applicants are approved. If one option does not work, we will show you alternatives." },
    { num: "04", icon: "💚", title: "Start Your Care", desc: "Your provider is notified and your financial barrier is removed. Focus on getting better — we will handle the rest with simple monthly payments.", detail: "Payments are set up on autopay so you never have to think about it during treatment." },
  ];

  const faqs = [
    { q: "Will checking my options affect my credit score?", a: "No. Checking your options uses a soft credit pull which has zero impact on your credit score. Only if you proceed with a full application will a hard pull occur." },
    { q: "What types of care does this cover?", a: "Behavioral health, dental, chiropractic, physical therapy, occupational therapy, speech therapy, primary care, and other healthcare services." },
    { q: "How much can I finance?", a: "Payment plans are available for balances from $100 up to $5,000, depending on the option you select and your individual application." },
    { q: "Is my information private?", a: "Yes. All information you submit is HIPAA-protected and encrypted. We never sell your personal or health information." },
    { q: "What if I am not approved?", a: "If one option does not work, we will automatically show you alternatives. There are multiple financing paths available depending on your situation." },
  ];

  return (
    <>
      <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 60%, #1B4F72 100%)", padding: "60px 32px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(13,148,136,0.18) 0%, transparent 70%)" }} />
        <button onClick={onBack} style={{ position: "absolute", top: 24, left: 24, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "8px 16px", borderRadius: "100px", cursor: "pointer", fontSize: 13, fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", gap: 6 }}>Back</button>
        <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 700, color: "white", lineHeight: 1.15, marginBottom: 16, position: "relative" }}>How <em style={{ color: "var(--teal-light)", fontStyle: "normal" }}>Prism Patient</em> Works</h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 17, maxWidth: 480, margin: "0 auto", lineHeight: 1.6, position: "relative" }}>{"From checking your options to starting care \u2014 here is exactly what to expect."}</p>
      </div>

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "40px 24px 0" }}>
        <div style={{ background: "var(--mist)", border: "1px solid #B3EEE9", borderRadius: "var(--radius)", padding: "28px 32px" }}>
          <p style={{ fontSize: 16, color: "var(--slate)", lineHeight: 1.8, margin: 0 }}>
            Prism Patient is a patient financing platform designed specifically for behavioral and mental health care — including ABA therapy, IOP, PHP, outpatient therapy, and psychiatric services. We connect patients with flexible monthly payment options so cost never becomes a reason to pause or stop treatment.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "40px 24px 48px" }}>
        <div style={{ marginBottom: 64 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 28, marginBottom: 40, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--teal), var(--teal-light))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 4px 16px rgba(13,148,136,0.3)" }}>{s.icon}</div>
                {i < steps.length - 1 && <div style={{ width: 2, height: 40, background: "linear-gradient(to bottom, var(--teal-light), var(--border))", marginTop: 8 }} />}
              </div>
              <div style={{ paddingTop: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--teal)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>Step {s.num}</div>
                <div style={{ fontFamily: "Sora, sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 15, color: "var(--slate)", lineHeight: 1.6, marginBottom: 8 }}>{s.desc}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", background: "var(--mist)", borderRadius: 8, padding: "10px 14px", borderLeft: "3px solid var(--teal-light)" }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Common Questions</div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 28 }}>Everything you need to know before applying.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((f, i) => (
              <div key={i} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "20px 22px", boxShadow: "var(--shadow)" }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{f.q}</div>
                <div style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.6 }}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "linear-gradient(135deg, var(--navy), var(--navy-mid))", borderRadius: "var(--radius)", padding: "40px 32px", textAlign: "center" }}>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 700, color: "white", marginBottom: 10 }}>Ready to check your options?</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, marginBottom: 28 }}>{"It takes under 2 minutes and won't affect your credit score."}</div>
          <button className="btn btn-primary" onClick={onApply}>Check My Options</button>
        </div>
      </div>
    </>
  );
}

// ─── SHARED FOOTER ────────────────────────────────────────────────────────────

function SiteFooter({ mode, onNavigate }) {
  const patientLinks = [["home","Home"],["about","About"],["services","Services"],["blog-patient","Blog"],["contact-patient","Contact"]];
  const providerLinks = [["home","Home"],["about","About"],["services","Services"],["partners","Partners"],["faq","FAQ"],["blog-provider","Blog"],["contact-provider","Contact"]];
  const links = mode === "provider" ? providerLinks : patientLinks;

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand-col">
          <div style={{ marginBottom: 14 }}><LogoDark width={180} height={44} /></div>
          <p>Purpose-built patient financing for behavioral health, mental health, autism, and ABA therapy practices. Flexible payment options that keep patients in treatment.</p>
        </div>
        <div>
          <div className="footer-col-title">Navigation</div>
          {links.map(([id, label]) => (
            <button key={id} className="footer-link" onClick={() => onNavigate(id)}>{label}</button>
          ))}
        </div>
        <div>
          <div className="footer-col-title">Legal</div>
          {[["privacy","Privacy Policy"],["terms","Terms of Service"],["hipaa","HIPAA Notice"],["accessibility","Accessibility"]].map(([id, label]) => (
            <button key={id} className="footer-link" onClick={() => onNavigate(id)}>{label}</button>
          ))}
        </div>
        <div>
          <div className="footer-col-title">Contact</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>
            <div>support@prism.com</div>
            <div>(800) 000-0000</div>
            <div style={{ marginTop: 8 }}>Mon–Fri, 9am–6pm ET</div>
            <div style={{ marginTop: 12, fontSize: 12 }}>123 Health Ave, Suite 100<br />Miami, FL 33101</div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div>© {new Date().getFullYear()} Prism Patient Payment Solutions. All rights reserved.</div>
        <div className="footer-legal">
          <span style={{ cursor: "pointer" }} onClick={() => onNavigate("privacy")}>Privacy Policy</span>
          <span style={{ cursor: "pointer" }} onClick={() => onNavigate("terms")}>Terms of Service</span>
          <span style={{ cursor: "pointer" }} onClick={() => onNavigate("hipaa")}>HIPAA Notice</span>
        </div>
      </div>
    </footer>
  );
}

// ─── PATIENT BLOG ─────────────────────────────────────────────────────────────

const PATIENT_POSTS = [
  { icon: "🧩", tag: "Autism & ABA", title: "Understanding the Cost of ABA Therapy", excerpt: "ABA therapy is one of the most effective interventions for autism spectrum disorder — and one of the most expensive. This guide breaks down what families typically pay and what options exist.", author: "Prism Patient Team", date: "May 20, 2026" },
  { icon: "🧠", tag: "Behavioral Health", title: "When Insurance Falls Short: Financing Behavioral Health Care", excerpt: "Insurance coverage for IOP, PHP, and ABA therapy is often partial or contested. This guide explains what families can do when their benefits run out before treatment is complete.", author: "Prism Patient Team", date: "May 12, 2026" },
  { icon: "💳", tag: "Financing", title: "Does Applying for a Payment Plan Affect My Credit Score?", excerpt: "One of the most common questions families ask before applying for a behavioral health payment plan is whether it will impact their credit. The short answer: checking your options does not. Here is the full picture.", author: "Prism Patient Team", date: "May 5, 2026" },
  { icon: "💚", tag: "Mental Health", title: "The Cost of Stopping Treatment Early", excerpt: "Research consistently shows that interrupted behavioral health treatment leads to setbacks. Here is how families can plan ahead financially to protect continuity of care.", author: "Prism Patient Team", date: "Apr 28, 2026" },
  { icon: "🏡", tag: "IOP & PHP", title: "What to Expect Financially from an IOP or PHP Program", excerpt: "Intensive outpatient and partial hospitalization programs are highly effective — and often come with substantial out-of-pocket costs. This guide walks you through what to expect and how to plan.", author: "Prism Patient Team", date: "Apr 18, 2026" },
  { icon: "📋", tag: "Family Resources", title: "A Family Guide to Managing Autism Treatment Costs", excerpt: "For families navigating an autism diagnosis, the financial picture can feel overwhelming. This guide covers insurance, public funding, and private financing options from start to finish.", author: "Prism Patient Team", date: "Apr 10, 2026" },
];

function PatientBlog({ onNavigate }) {
  return (
    <>
      <div className="hero" style={{ padding: "72px 32px" }}>
        <h1>Patient <em>Resources</em></h1>
        <p>Resources for families and patients navigating ABA therapy, behavioral health treatment, and mental health care costs.</p>
      </div>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "56px 24px" }}>
        <div className="blog-grid">
          {PATIENT_POSTS.map((post, i) => (
            <div key={i} className="blog-card">
              <div className="blog-card-img" style={{ background: i % 3 === 0 ? "var(--mist)" : i % 3 === 1 ? "#EFF6FF" : "#FFF7ED" }}>{post.icon}</div>
              <div className="blog-card-body">
                <div className="blog-card-tag">{post.tag}</div>
                <div className="blog-card-title">{post.title}</div>
                <div className="blog-card-excerpt">{post.excerpt}</div>
                <div className="blog-card-meta">
                  <span>{post.author}</span>
                  <span>{post.date}</span>
                </div>
                <button className="btn btn-ghost" style={{ marginTop: 14, padding: "8px 16px", fontSize: 13, width: "100%" }}>Read More →</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center" }}>
          <button className="btn btn-primary" onClick={() => onNavigate("get-started")}>Explore Your Payment Options</button>
        </div>
      </div>
    </>
  );
}

// ─── PROVIDER BLOG ────────────────────────────────────────────────────────────

const PROVIDER_POSTS = [
  { icon: "📈", tag: "Revenue Cycle", title: "How ABA Centers Are Reducing Write-Offs with Point-of-Service Financing", excerpt: "ABA therapy practices face some of the highest rates of patient balance write-offs in behavioral health. Point-of-service financing is changing that — here is the data.", author: "Prism Patient Team", date: "May 22, 2026" },
  { icon: "🧩", tag: "ABA & Autism", title: "Why ABA Practices Need a Purpose-Built Financing Solution", excerpt: "Generic medical financing products were not designed for the session-based, insurance-complex world of ABA therapy. Here is what purpose-built looks like.", author: "Prism Patient Team", date: "May 15, 2026" },
  { icon: "💚", tag: "Patient Retention", title: "Financial Stress is the Leading Cause of ABA Dropout", excerpt: "Studies show that financial burden is the number one reason families discontinue ABA therapy before goals are met. Patient financing at the point of service directly addresses this.", author: "Prism Patient Team", date: "May 8, 2026" },
  { icon: "📋", tag: "Compliance", title: "TILA, Reg Z, and Behavioral Health Financing: What Providers Need to Know", excerpt: "When your IOP, PHP, or ABA practice offers payment plans, specific federal disclosure requirements apply. This guide clarifies what you are responsible for and what Prism Patient handles.", author: "Prism Patient Team", date: "Apr 30, 2026" },
  { icon: "🔗", tag: "Integrations", title: "Embedding Patient Financing Into Your Behavioral Health EHR", excerpt: "For ABA and behavioral health practices using Kipu, Netsmart, or Qualifacts, embedding financing into existing intake workflows can dramatically increase uptake. Here is how it works.", author: "Prism Patient Team", date: "Apr 22, 2026" },
  { icon: "💰", tag: "Practice Management", title: "The Real Cost of Uncollected Balances in ABA and IOP Practices", excerpt: "Behavioral health practices write off a disproportionate share of patient balances compared to other specialties. Payment plans close that gap before it opens — here is how to calculate your exposure.", author: "Prism Patient Team", date: "Apr 14, 2026" },
];

function ProviderBlog({ onNavigate }) {
  return (
    <>
      <div className="hero" style={{ padding: "72px 32px" }}>
        <h1>Provider <em>Insights</em></h1>
        <p>Research, trends, and practical guidance for healthcare practices navigating patient financing.</p>
      </div>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "56px 24px" }}>
        <div className="blog-grid">
          {PROVIDER_POSTS.map((post, i) => (
            <div key={i} className="blog-card">
              <div className="blog-card-img" style={{ background: i % 3 === 0 ? "var(--mist)" : i % 3 === 1 ? "#EFF6FF" : "#FFF7ED" }}>{post.icon}</div>
              <div className="blog-card-body">
                <div className="blog-card-tag">{post.tag}</div>
                <div className="blog-card-title">{post.title}</div>
                <div className="blog-card-excerpt">{post.excerpt}</div>
                <div className="blog-card-meta">
                  <span>{post.author}</span>
                  <span>{post.date}</span>
                </div>
                <button className="btn btn-ghost" style={{ marginTop: 14, padding: "8px 16px", fontSize: 13, width: "100%" }}>Read More →</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center" }}>
          <button className="btn btn-primary" onClick={() => onNavigate("register")}>Get Started — First Month Free</button>
        </div>
      </div>
    </>
  );
}

// ─── SHARED CONTACT PAGE ──────────────────────────────────────────────────────

function ContactPage({ audience }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.name && form.email && form.subject && form.message;

  const handleSend = async () => {
    setSending(true);

    let patientId = null;
    let providerId = null;
    if (audience === "provider") {
      const { data } = await supabase.from("providers").select("id").eq("email", form.email).maybeSingle();
      providerId = data?.id || null;
    } else {
      const { data } = await supabase.from("patients").select("id").eq("email", form.email).maybeSingle();
      patientId = data?.id || null;
    }

    const bodyWithContact = `${form.message}\n\n---\nFrom: ${form.name} (${form.email}${form.phone ? ", " + form.phone : ""})`;

    await supabase.from("messages").insert({
      patient_id: patientId,
      provider_id: providerId,
      thread_id: Date.now(),
      subject: form.subject,
      body: bodyWithContact,
      sender: form.name,
      read: false,
    });
    setSending(false);
    setSubmitted(true);
  };

  const subjects = audience === "provider"
    ? ["General Inquiry", "Partnership Opportunity", "Technical Support", "Billing Question", "Demo Request", "Other"]
    : ["General Inquiry", "Help with My Application", "Payment Plan Question", "Account Support", "Document Upload Help", "Other"];

  return (
    <>
      <div className="hero" style={{ padding: "72px 32px" }}>
        <h1>{"Get in "}<em>Touch</em></h1>
        <p>{audience === "provider" ? "Our team specializes in ABA therapy, IOP, PHP, and behavioral health financing. We are here to help you get set up and answer any questions." : "Have a question about your ABA or behavioral health payment plan? Our team understands the unique nature of these treatments and is here to help."}</p>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 40, alignItems: "start" }}>

          {/* Contact info */}
          <div>
            <div style={{ fontFamily: "Sora, sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Contact Information</div>
            {[
              ["📧", "Email", "support@prism.com", audience === "provider" ? "providers@prism.com" : null],
              ["📞", "Phone", "(800) 000-0000", null],
              ["🕐", "Hours", "Monday – Friday", "9:00 AM – 6:00 PM ET"],
              ["📍", "Address", "123 Health Ave, Suite 100", "Miami, FL 33101"],
            ].map(([icon, label, line1, line2]) => (
              <div key={label} style={{ display: "flex", gap: 14, marginBottom: 24 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--mist)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{line1}{line2 && <><br />{line2}</>}</div>
                </div>
              </div>
            ))}
            <div style={{ background: "var(--mist)", borderRadius: "var(--radius-sm)", padding: "16px 18px", fontSize: 13, color: "var(--slate)", lineHeight: 1.7 }}>
              {audience === "provider"
                ? "For urgent technical issues or platform questions, existing providers can also message us directly from the provider portal."
                : "For questions about your ABA, IOP, or behavioral health payment plan, signing in to your patient account and using secure messaging will get you the fastest response from our team."}
            </div>
          </div>

          {/* Contact form */}
          <div className="card">
            <div className="card-body">
              {submitted ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                  <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Message sent!</div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{"We'll get back to you within 1 business day."}</div>
                  <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }}>Send Another Message</button>
                </div>
              ) : (
                <>
                  <div style={{ fontFamily: "Sora, sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Send Us a Message</div>
                  <div className="form-row">
                    <div className="form-group"><label>Your Name *</label><input placeholder="Jane Smith" value={form.name} onChange={e => upd("name", e.target.value)} /></div>
                    <div className="form-group"><label>Email Address *</label><input type="email" placeholder="you@email.com" value={form.email} onChange={e => upd("email", e.target.value)} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Phone (optional)</label><input placeholder="(555) 000-0000" value={form.phone} onChange={e => upd("phone", formatPhone(e.target.value))} /></div>
                    <div className="form-group"><label>Subject *</label>
                      <select value={form.subject} onChange={e => upd("subject", e.target.value)}>
                        <option value="">Select a subject...</option>
                        {subjects.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Message *</label>
                    <textarea placeholder="How can we help you?" value={form.message} onChange={e => upd("message", e.target.value)} style={{ minHeight: 120, resize: "vertical", lineHeight: 1.6 }} />
                  </div>
                  <button className="btn btn-primary" style={{ width: "100%" }} disabled={!valid || sending} onClick={handleSend}>{sending ? "Sending..." : "Send Message"}</button>
                  <div style={{ fontSize: 11, color: "var(--text-light)", textAlign: "center", marginTop: 12 }}>We typically respond within 1 business day.</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── PATIENT MARKETING SITE ──────────────────────────────────────────────────

function PatientMarketingNav({ activePage, onNavigate }) {
  const links = [["home", "Home"], ["about", "About"], ["services", "Services"], ["blog-patient", "Blog"], ["contact-patient", "Contact"]];
  return (
    <div style={{ background: "var(--white)", borderBottom: "1px solid var(--border)", padding: "10px 16px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, minHeight: 56 }}>
      <div style={{ display: "flex", gap: 2, flexWrap: "wrap", flex: "1 1 auto" }}>
        {links.map(([id, label]) => (
          <button key={id} onClick={() => onNavigate(id)} style={{ padding: "6px 10px", borderRadius: 8, border: "none", fontFamily: "DM Sans, sans-serif", fontSize: 14, fontWeight: activePage === id ? 600 : 400, cursor: "pointer", background: "transparent", color: activePage === id ? "var(--teal-dark)" : "var(--text-secondary)", borderBottom: activePage === id ? "2px solid var(--teal)" : "2px solid transparent", transition: "all 0.2s", whiteSpace: "nowrap" }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
        <div className="nav-pill" style={{ display: "flex" }}>
          <button type="button" className={activePage === "patient-account-login" ? "active" : ""} onClick={() => onNavigate("patient-account-login")} style={{ whiteSpace: "nowrap" }}>Sign In</button>
          <button type="button" onClick={() => onNavigate("get-started")} style={{ whiteSpace: "nowrap" }}>Get Started</button>
        </div>
      </div>
    </div>
  );
}

function PatientAbout({ onNavigate }) {
  return (
    <>
      <div className="hero" style={{ padding: "72px 32px" }}>
        <h1>About <em>Prism Patient</em></h1>
        <p>We built Prism Patient for the families and patients navigating some of the most demanding treatment journeys — behavioral health, mental health, autism, and ABA therapy.</p>
      </div>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ fontFamily: "Sora, sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Why We Exist</div>
        <p style={{ fontSize: 16, color: "var(--slate)", lineHeight: 1.8, marginBottom: 40 }}>ABA therapy. Intensive outpatient programs. Psychiatric care. These are not optional treatments — they are essential. Yet for many families, the cost of sustained care becomes an obstacle. Prism Patient was built to remove that obstacle. We connect patients and families with transparent, flexible monthly payment options designed around the realities of behavioral health treatment.</p>

        <div style={{ fontFamily: "Sora, sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 16 }}>How We Help You</div>
        <p style={{ fontSize: 16, color: "var(--slate)", lineHeight: 1.8, marginBottom: 40 }}>{"Prism Patient works directly with your ABA center, behavioral health provider, or mental health practice. Whether you are managing ongoing ABA sessions, a PHP program, or outpatient therapy costs, we offer a payment path that fits your family's budget — without disrupting treatment."}</p>

        <div style={{ fontFamily: "Sora, sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 16 }}>What We Stand For</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 48 }}>
          {[
            ["Transparency", "No hidden fees, no surprise charges. You always know exactly what you are agreeing to before you sign."],
            ["Accessibility", "We work with patients across the credit spectrum. Getting care should not require a perfect credit score."],
            ["Privacy", "Your health and financial information is HIPAA-protected and encrypted. We never sell your data."],
            ["Simplicity", "We designed Prism Patient to be straightforward. Apply in minutes, get a decision fast, and start your care."],
          ].map(([title, desc]) => (
            <div key={title} style={{ background: "var(--mist)", borderRadius: "var(--radius-sm)", padding: "24px 20px" }}>
              <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 8, color: "var(--teal-dark)" }}>{title}</div>
              <div style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.7 }}>{desc}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "linear-gradient(135deg, var(--navy), var(--navy-mid))", borderRadius: "var(--radius)", padding: "40px 32px", textAlign: "center" }}>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 700, color: "white", marginBottom: 10 }}>Ready to check your options?</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, marginBottom: 28 }}>{"It takes under 2 minutes and won't affect your credit score."}</div>
          <button className="btn btn-primary" onClick={() => onNavigate("get-started")}>Get Started</button>
        </div>
      </div>
    </>
  );
}

function PatientServices({ onNavigate }) {
  const services = [
    { icon: "💳", title: "Flexible Payment Plans", desc: "Instead of paying your full balance upfront, Prism Patient lets you spread the cost into manageable monthly payments. Plans are available from 3 to 60 months depending on your balance and the option you choose.", features: ["Multiple term options", "0% and low-interest plans available", "No prepayment penalties", "Plans starting from $100"] },
    { icon: "⚡", title: "Fast Pre-Approval", desc: "Most patients receive a pre-approval decision in under 60 seconds. Checking your options uses a soft credit pull, which means there is no impact to your credit score until you formally apply.", features: ["Soft credit pull to check options", "Decision in seconds", "84% average approval rate", "Multiple options if one does not fit"] },
    { icon: "🏥", title: "Works With Your Provider", desc: "Prism Patient is offered directly through your healthcare provider. Your provider is paid in full by Prism Patient — your monthly payments go directly to us, not to collections.", features: ["Provider-integrated platform", "No collection risk to you", "Coordinated with your care team", "Available at point of service"] },
    { icon: "🔒", title: "Secure and Private", desc: "Every piece of information you submit through Prism Patient is encrypted and HIPAA-protected. We maintain strict data security standards and never sell or share your personal or health information.", features: ["HIPAA-compliant platform", "Bank-level encryption", "No data sold or shared", "ESIGN Act-compliant agreements"] },
    { icon: "📱", title: "Manage Everything Online", desc: "Your Prism Patient patient account gives you full visibility into your payment plans, payment history, and upcoming due dates — all in one place, accessible from any device.", features: ["View all active plans", "Make payments anytime", "Upload documents securely", "Message our support team"] },
    { icon: "🤝", title: "Support When You Need It", desc: "Our patient support team is here to help. Whether you have questions about your plan, need to update your account, or want to explore additional financing options, we are just a message away.", features: ["In-app secure messaging", "Typical response within 1 business day", "Document upload and review", "Account management support"] },
    { icon: "🔍", title: "Bill Review & Dispute Service", desc: "Think there is an error on your medical bill? Submit your EOB and our team will review it for mistakes and help you dispute incorrect charges with your insurer or provider.", features: ["EOB review starting at $49", "Dispute filing on your behalf", "Full representation through resolution"], link: "bill-review-service" },
  ];

  return (
    <>
      <div className="hero" style={{ padding: "72px 32px" }}>
        <h1>Built for <em>your</em> care journey</h1>
        <p>Prism Patient is designed specifically for the long-term, high-engagement nature of ABA therapy, behavioral health, and mental health treatment — not a one-time procedure.</p>
      </div>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {services.map((s, i) => (
            <div key={i} onClick={s.link ? () => onNavigate(s.link) : undefined} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "32px 28px", boxShadow: "var(--shadow)", cursor: s.link ? "pointer" : "default" }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{s.icon}</div>
              <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.7, marginBottom: 20 }}>{s.desc}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {s.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--slate)" }}>
                    <span style={{ color: "var(--teal)", fontWeight: 700, fontSize: 12 }}>✓</span>{f}
                  </div>
                ))}
              </div>
              {s.link && <div style={{ marginTop: 16, fontSize: 13, fontWeight: 600, color: "var(--teal-dark)" }}>Learn more →</div>}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 56, background: "linear-gradient(135deg, var(--navy), var(--navy-mid))", borderRadius: "var(--radius)", padding: "40px 32px", textAlign: "center" }}>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 700, color: "white", marginBottom: 10 }}>See what options are available to you</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, marginBottom: 28 }}>{"Checking your options takes under 2 minutes and won't affect your credit score."}</div>
          <button className="btn btn-primary" onClick={() => onNavigate("get-started")}>Check My Options</button>
        </div>
      </div>
    </>
  );
}

// ─── BILL REVIEW SERVICE — MARKETING SUB-PAGE ────────────────────────────────

function BillReviewService({ onNavigate }) {
  return (
    <>
      <div className="hero" style={{ padding: "72px 32px" }}>
        <h1>{"Think there's an "}<em>error</em>{" on your bill?"}</h1>
        <p>Our team reviews your EOB for mistakes and helps you dispute incorrect charges — so you only pay what you actually owe.</p>
      </div>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, marginBottom: 12 }}>How it works</div>
          <div style={{ fontSize: 15, color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto" }}>Medical bills are complicated, and billing errors happen more often than you would think. Submit your EOB and our team will take a closer look.</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 56 }}>
          {[["01", "Submit Your EOB", "Sign in to your Prism Patient account and upload your EOB or bill along with a quick description of what looks wrong."], ["02", "We Review It", "Our team reviews your EOB for billing errors, duplicate charges, and coding mistakes."], ["03", "We Follow Up", "Depending on the service level you choose, we file the dispute on your behalf and follow up with you by email."], ["04", "Issue Resolved", "We keep working the dispute until it's resolved, and update you in your portal along the way."]].map(([num, title, desc]) => (
            <div key={num} style={{ background: "var(--white)", borderRadius: "var(--radius-sm)", padding: "24px 20px", boxShadow: "var(--shadow)", border: "1px solid var(--border)", textAlign: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, var(--teal), var(--teal-light))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 14, color: "white" }}>{num}</div>
              <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{desc}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, marginBottom: 12 }}>Choose your level of service</div>
          <div style={{ fontSize: 15, color: "var(--text-secondary)" }}>Simple, flat pricing. No surprise fees.</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginBottom: 56 }}>
          {DISPUTE_SERVICE_TIERS.map(tier => (
            <div key={tier.id} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "28px 24px", boxShadow: "var(--shadow)" }}>
              <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{tier.name}</div>
              <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 32, color: "var(--teal-dark)", marginBottom: 12 }}>${tier.price}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>{tier.desc}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {tier.includes.map((inc, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--slate)" }}>
                    <span style={{ color: "var(--teal)", fontWeight: 700 }}>✓</span>{inc}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "linear-gradient(135deg, var(--navy), var(--navy-mid))", borderRadius: "var(--radius)", padding: "40px 32px", textAlign: "center" }}>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 700, color: "white", marginBottom: 10 }}>Ready to get your bill reviewed?</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, marginBottom: 28 }}>{"Sign in to your account to submit your EOB, or create an account if you're new to Prism Patient."}</div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => onNavigate("patient-account-login")}>Sign In to Submit a Request</button>
            <button className="btn btn-outline" onClick={() => onNavigate("get-started")}>New Here? Get Started</button>
          </div>
        </div>
      </div>
    </>
  );
}



// ─── PROVIDER FLOW ────────────────────────────────────────────────────────────

// ─── PROVIDER LOGIN PAGE ─────────────────────────────────────────────────────

function ProviderLogin({ onAuthenticated }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [magicEmail, setMagicEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [magicLink, setMagicLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [forgot, setForgot] = useState(null);
  const [error, setError] = useState("");
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const { active: comingSoon, requestAccess } = useComingSoon();

  const handlePasswordSignIn = async () => {
    if (!form.email || !form.password) { setError("Please enter your email and password."); return; }
    if (comingSoon) { requestAccess(); return; }
    setError("");

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (signInError) { setError(signInError.message); return; }

    const { data: providerData } = await supabase
      .from("providers")
      .select("*")
      .eq("email", form.email)
      .order("created_at", { ascending: false })
      .limit(1);

    const providerRow = providerData?.[0];
    if (!providerRow) {
      await supabase.auth.signOut();
      setError("We couldn't find a provider account for this email. If you're a patient, please use Patient Sign In instead.");
      return;
    }

    onAuthenticated({
      email: form.email,
      practiceName: providerRow.practice_name || "",
      address: providerRow.address || "",
      city: providerRow.city || "",
      state: providerRow.state || "",
      zip: providerRow.zip || "",
    });
  };

  const handleMagicLink = async () => {
    if (!magicEmail) return;
    if (comingSoon) { requestAccess(); return; }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: magicEmail,
    });

    if (otpError) { setError(otpError.message); return; }

    setMagicSent(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(magicLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="main-narrow" style={{ paddingTop: 48 }}>
      <div className="card">
        <div className="card-header">
          <div className="card-icon teal">🏥</div>
          <div>
            <div className="card-title">Provider Sign In</div>
            <div className="card-subtitle">Sign in to your Prism Patient Provider Portal</div>
          </div>
        </div>
        <div className="card-body">
          {forgot ? (
            <ForgotFlow type={forgot} onBack={() => setForgot(null)} />
          ) : !magicSent ? (
            <>
              <div className="form-group">
                <label>Practice Email Address</label>
                <input type="email" placeholder="admin@practice.com" value={form.email} onChange={e => upd("email", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="Your password" value={form.password} onChange={e => upd("password", e.target.value)} />
              </div>
              {error && <div style={{ color: "#DC2626", fontSize: 13, marginBottom: 12 }}>{error}</div>}
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <button onClick={() => setForgot("password")} style={{ background: "none", border: "none", color: "var(--teal-dark)", fontSize: 12, cursor: "pointer", fontFamily: "DM Sans, sans-serif", padding: 0 }}>Forgot password?</button>
                <button onClick={() => setForgot("username")} style={{ background: "none", border: "none", color: "var(--teal-dark)", fontSize: 12, cursor: "pointer", fontFamily: "DM Sans, sans-serif", padding: 0 }}>Forgot username?</button>
              </div>
              <button className="btn btn-primary" style={{ width: "100%" }} disabled={!form.email || !form.password} onClick={handlePasswordSignIn}>Sign In</button>
              <AuthDivider />
              <div className="form-group" style={{ marginBottom: 8 }}>
                <label>Or sign in with a magic link</label>
                <input type="email" placeholder="Enter your practice email" value={magicEmail} onChange={e => setMagicEmail(e.target.value)} />
              </div>
              <button className="btn btn-ghost" style={{ width: "100%" }} disabled={!magicEmail} onClick={handleMagicLink}>Send Magic Link</button>
            </>
          ) : (
            <div className="success-screen" style={{ padding: "16px 0 24px" }}>
              <div className="success-icon">📬</div>
              <h2>{"Check your email"}</h2>
              <p>{"We sent a sign-in link to:"}<br /><strong style={{ color: "var(--teal-dark)" }}>{magicEmail}</strong></p>
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "var(--radius-sm)", padding: "14px 16px", fontSize: 13, color: "#92400E", marginBottom: 20, textAlign: "left" }}>
                <strong>Demo mode:</strong> Use the link below to simulate clicking the magic link.
              </div>
              <div className="magic-link-box">
                <span className="magic-link-url">{magicLink}</span>
                <button className="copy-btn" onClick={handleCopy}>{copied ? "Copied!" : "Copy"}</button>
              </div>
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={async () => {
                const { data: providerData } = await supabase
                  .from("providers")
                  .select("*")
                  .eq("email", magicEmail)
                  .order("created_at", { ascending: false })
                  .limit(1);
                const providerRow = providerData?.[0];
                if (!providerRow) {
                  await supabase.auth.signOut();
                  setMagicSent(false);
                  setError("We couldn't find a provider account for this email. If you're a patient, please use Patient Sign In instead.");
                  return;
                }
                onAuthenticated({
                  email: magicEmail,
                  practiceName: providerRow.practice_name || "",
                });
              }}>
                Simulate: Click Magic Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── PROVIDER PORTAL NAV ─────────────────────────────────────────────────────

function ProviderPortalNav({ providerUser, activePage, onNavigate, onSignOut }) {
  return (
    <div style={{ background: "var(--navy)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", height: 56, gap: 16 }}>
      <div />
      <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
        {[["dashboard", "Dashboard"], ["refer", "Refer Patient"], ["account", "Account"], ["billing", "Billing"], ["messages", "Messages"]].map(([id, label]) => (
          <button key={id} onClick={() => onNavigate(id)} style={{ padding: "6px 16px", borderRadius: 8, border: "none", fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", background: activePage === id ? "rgba(255,255,255,0.15)" : "transparent", color: activePage === id ? "white" : "rgba(255,255,255,0.55)", transition: "all 0.2s" }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, justifySelf: "end" }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{providerUser?.email}</div>
        <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 12px" }} onClick={onSignOut}>Sign Out</button>
      </div>
    </div>
  );
}

// ─── PROVIDER DASHBOARD PAGE ──────────────────────────────────────────────────

function ProviderDashboard({ onNavigate }) {
  return (
    <div className="main">
      <div className="card">
        <div className="card-body">
          <div className="section-title">Practice Dashboard</div>
          <div className="section-sub">Sunrise Health Clinic · Last updated just now</div>
          <div className="dashboard-grid">
            {[{ label: "Total Financed", val: "$41.2K", sub: "↑ $6.8K this month" }, { label: "Approval Rate", val: "84%", sub: "Industry avg: 61%" }, { label: "Avg. Plan Size", val: "$1,790", sub: "Across all partners" }, { label: "Active Plans", val: "23", sub: "↑ 4 this week" }].map(m => (
              <div className="metric-card" key={m.label}>
                <div className="metric-label">{m.label}</div>
                <div className="metric-val">{m.val}</div>
                <div className="metric-sub">{m.sub}</div>
              </div>
            ))}
          </div>
          <div className="metric-card" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div className="metric-label">Monthly Payment Plan Activity</div>
                <div className="metric-val">31 <span style={{ fontSize: 16, fontWeight: 400, color: "var(--text-secondary)" }}>applications</span></div>
                <div className="metric-sub">↑ 6 vs. last month</div>
              </div>
              <div style={{ background: "var(--mist)", border: "1px solid #B3EEE9", borderRadius: 10, padding: "6px 14px", fontSize: 13, color: "var(--teal-dark)", fontWeight: 500 }}>This Month</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[{ label: "Approved", val: "26", pct: "84%", color: "var(--success)" }, { label: "Pending", val: "3", pct: "10%", color: "var(--warning)" }, { label: "Declined", val: "2", pct: "6%", color: "#EF4444" }].map(s => (
                <div key={s.label} style={{ background: "var(--mist2)", borderRadius: 8, padding: "12px 14px", borderLeft: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "Sora, sans-serif" }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: s.color, marginTop: 2 }}>{s.pct}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Recent Patient Applications</div>
            <button className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => onNavigate("refer")}>+ Refer Patient</button>
          </div>
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="patient-table">
              <thead><tr><th>Patient</th><th>Amount</th><th>Plan</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {MOCK_PATIENTS.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td>{p.amount}</td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{p.plan}</td>
                    <td><span className={`status-pill ${p.status}`}>{p.status === "approved" ? "✓" : p.status === "pending" ? "○" : "◎"} {p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span></td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REFER PATIENT PAGE ───────────────────────────────────────────────────────

function ReferPatientPage({ providerUser }) {
  const APP_URL = "https://prism-patient-mvp.vercel.app";
  const [refForm, setRefForm] = useState({ firstName: "", lastName: "", phone: "", email: "", balance: "", careDescription: "" });
  const [refSent, setRefSent] = useState(null);
  const [sending, setSending] = useState(false);
  const [providerId, setProviderId] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loadingReferrals, setLoadingReferrals] = useState(true);
  const updRef = (k, v) => setRefForm(f => ({ ...f, [k]: v }));

  const fetchReferrals = async (provId) => {
    setLoadingReferrals(true);
    const { data } = await supabase
      .from("referrals")
      .select("*")
      .eq("provider_id", provId)
      .order("created_at", { ascending: false });
    setReferrals(data || []);
    setLoadingReferrals(false);
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("providers").select("id").eq("email", providerUser?.email).order("created_at", { ascending: false }).limit(1);
      const provId = data?.[0]?.id || null;
      setProviderId(provId);
      if (provId) await fetchReferrals(provId);
      else setLoadingReferrals(false);
    })();
  }, [providerUser?.email]);

  const buildAppLink = (code) => {
    const params = new URLSearchParams({
      firstName: refForm.firstName,
      lastName: refForm.lastName,
      phone: refForm.phone,
      email: refForm.email,
      balance: refForm.balance,
      care: refForm.careDescription,
      ref: code,
    });
    return `${APP_URL}?${params.toString()}`;
  };

  const generateReferralCode = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const recordReferral = async (method, link, code) => {
    await supabase.from("referrals").insert({
      provider_id: providerId,
      patient_first_name: refForm.firstName,
      patient_last_name: refForm.lastName,
      patient_phone: refForm.phone || null,
      patient_email: refForm.email || null,
      balance_owed: refForm.balance ? parseFloat(refForm.balance) : null,
      care_description: refForm.careDescription,
      method,
      link,
      referral_code: code,
      status: "sent",
    });
    if (providerId) await fetchReferrals(providerId);
  };

  const handleSendSMS = async () => {
    setSending(true);
    const code = generateReferralCode();
    const link = buildAppLink(code);
    const name = refForm.firstName || "there";
    const message = `Hi ${name}, your provider has invited you to apply for a patient payment plan through Prism Patient. It takes under 2 minutes and won't affect your credit score. Apply here: ${link}`;
    window.open(`sms:${refForm.phone.replace(/\D/g, "")}?body=${encodeURIComponent(message)}`);
    await recordReferral("sms", link, code);
    setSending(false);
    setRefSent("sms");
  };

  const handleSendEmail = async () => {
    setSending(true);
    const code = generateReferralCode();
    const link = buildAppLink(code);
    const name = refForm.firstName || "there";
    const subject = "Your Patient Payment Options — Prism Patient";
    const body = `Hi ${name},\n\nYour provider has invited you to explore flexible payment options for your upcoming care.\n\nApplying takes under 2 minutes and won't affect your credit score.\n\nGet started here:\n${link}\n\n— Your Care Team`;
    window.open(`mailto:${refForm.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    await recordReferral("email", link, code);
    setSending(false);
    setRefSent("email");
  };

  const refFormValid = refForm.firstName && refForm.lastName && (refForm.phone || refForm.email);

  return (
    <div className="main-narrow">
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-icon teal">➕</div>
          <div><div className="card-title">Refer a Patient</div><div className="card-subtitle">Send a patient their payment options link</div></div>
        </div>
        <div className="card-body">
          {refSent && (
            <div className="alert success">
              Application link {refSent === "sms" ? "text opened" : "email opened"} for {refForm.firstName} {refForm.lastName}.
              {" "}<span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => { setRefSent(null); setRefForm({ firstName: "", lastName: "", phone: "", email: "", balance: "", careDescription: "" }); }}>Refer another</span>
            </div>
          )}
          <div className="form-row">
            <div className="form-group"><label>First Name *</label><input placeholder="Maria" value={refForm.firstName} onChange={e => updRef("firstName", e.target.value)} /></div>
            <div className="form-group"><label>Last Name *</label><input placeholder="Lopez" value={refForm.lastName} onChange={e => updRef("lastName", e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Patient Phone</label><input placeholder="(555) 000-0000" value={refForm.phone} onChange={e => updRef("phone", formatPhone(e.target.value))} /></div>
            <div className="form-group"><label>Patient Email</label><input placeholder="patient@email.com" value={refForm.email} onChange={e => updRef("email", e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Balance Owed ($)</label><div className="input-prefix"><span>$</span><input type="text" inputMode="numeric" placeholder="0" value={refForm.balance} onChange={e => updRef("balance", formatIncome(e.target.value))} /></div></div>
            <div className="form-group"><label>Description of Care *</label><input placeholder="e.g. dental, PT, behavioral health..." value={refForm.careDescription} onChange={e => updRef("careDescription", e.target.value)} /></div>
          </div>
          <div className="helper-text" style={{ marginBottom: 16 }}>* Required. Phone needed for text, email needed for email link.</div>
          <hr className="divider" />
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" disabled={!refFormValid || !refForm.phone || sending} onClick={handleSendSMS}>Send via Text</button>
            <button className="btn btn-primary" disabled={!refFormValid || !refForm.email || sending} onClick={handleSendEmail}>{sending ? "Sending..." : "Send Application Link"}</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-icon teal">📋</div>
          <div><div className="card-title">Recent Referrals</div><div className="card-subtitle">Patients you've referred through this portal</div></div>
        </div>
        {loadingReferrals ? (
          <div style={{ padding: 24, color: "var(--text-secondary)", fontSize: 14 }}>Loading...</div>
        ) : referrals.length === 0 ? (
          <div style={{ padding: 24, color: "var(--text-secondary)", fontSize: 14 }}>No referrals sent yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="patient-table">
              <thead><tr><th>Patient</th><th>Balance</th><th>Care</th><th>Method</th><th>Status</th><th>Sent</th></tr></thead>
              <tbody>
                {referrals.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.patient_first_name} {r.patient_last_name}</td>
                    <td>{r.balance_owed ? `$${Number(r.balance_owed).toLocaleString()}` : "—"}</td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{r.care_description}</td>
                    <td style={{ fontSize: 13, textTransform: "uppercase" }}>{r.method}</td>
                    <td><span className={`status-pill ${r.status === "applied" ? "approved" : "reviewing"}`}>{r.status === "applied" ? "✓ Applied" : "Sent"}</span></td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PROVIDER ACCOUNT PAGE ────────────────────────────────────────────────────

function ProviderAccountPage({ providerEmail, onNotifEmailChange, sharedAddress, onSharedAddressChange }) {
  const [account, setAccount] = useState({ practiceName: "", npi: "", specialty: "", phone: "", billingEmail: "", notifEmail: "" });
  const [banking, setBanking] = useState({ bankName: "", accountHolder: "", routingNumber: "", accountNumber: "", accountType: "checking" });
  const [bankSaved, setBankSaved] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const updAcc = (k, v) => {
    setAccount(f => ({ ...f, [k]: v }));
    if (k === "notifEmail" && onNotifEmailChange) onNotifEmailChange(v);
  };
  const updAddress = (k, v) => onSharedAddressChange?.({ [k]: v });
  const updBank = (k, v) => setBanking(f => ({ ...f, [k]: v }));

  const handleSaveAccount = async () => {
    setSavingAccount(true);
    if (providerEmail) {
      await supabase.from("providers").update({
        address: sharedAddress?.address || null,
        city: sharedAddress?.city || null,
        state: sharedAddress?.state || null,
        zip: sharedAddress?.zip || null,
      }).eq("email", providerEmail);
    }
    setSavingAccount(false);
    setAccountSaved(true);
    setTimeout(() => setAccountSaved(false), 3000);
  };

  const maskAccount = (num) => num.length > 4 ? "•".repeat(num.length - 4) + num.slice(-4) : num;
  const maskRouting = (num) => num.length > 4 ? "•".repeat(num.length - 4) + num.slice(-4) : num;

  return (
    <div className="main" style={{ maxWidth: 740 }}>

      {/* Practice Info */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-icon teal">🏥</div>
          <div><div className="card-title">Practice Information</div><div className="card-subtitle">Your practice details and contact information</div></div>
        </div>
        <div className="card-body">
          {accountSaved && <div className="alert success" style={{ marginBottom: 16 }}>Changes saved successfully.</div>}
          <div className="form-group"><label>Practice Name</label><input placeholder="Sunrise Health Clinic" value={account.practiceName} onChange={e => updAcc("practiceName", e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label>NPI Number</label><input placeholder="1234567890" inputMode="numeric" maxLength={10} value={account.npi} onChange={e => updAcc("npi", e.target.value.replace(/\D/g, "").slice(0, 10))} /></div>
            <div className="form-group"><label>Specialty</label>
              <select value={account.specialty} onChange={e => updAcc("specialty", e.target.value)}>
                <option value="">Select...</option>
                <option>Behavioral Health</option><option>Dental</option><option>Chiropractic</option>
                <option>Physical Therapy</option><option>Occupational Therapy</option><option>Speech Therapy</option>
                <option>Primary Care</option><option>Specialty Medicine</option><option>Other Healthcare</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>Street Address</label><input placeholder="123 Main Street" value={sharedAddress?.address || ""} onChange={e => updAddress("address", e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label>City</label><input placeholder="Miami" value={sharedAddress?.city || ""} onChange={e => updAddress("city", e.target.value)} /></div>
            <div className="form-group"><label>State</label>
              <select value={sharedAddress?.state || ""} onChange={e => updAddress("state", e.target.value)}>
                <option value="">Select...</option>
                {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ maxWidth: 180 }}><label>ZIP Code</label><input placeholder="33101" value={sharedAddress?.zip || ""} onChange={e => updAddress("zip", e.target.value)} maxLength={5} /></div>
            <div className="form-group"><label>Practice Phone</label><input placeholder="(555) 000-0000" value={account.phone} onChange={e => updAcc("phone", formatPhone(e.target.value))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Billing Email</label><input placeholder="billing@practice.com" value={account.billingEmail} onChange={e => updAcc("billingEmail", e.target.value)} /></div>
            <div className="form-group"><label>Notification Email</label><input placeholder="admin@practice.com" value={account.notifEmail} onChange={e => updAcc("notifEmail", e.target.value)} /><div className="helper-text">Receives patient payment alerts</div></div>
          </div>
          <hr className="divider" />
          <div className="section-title" style={{ fontSize: 16, marginBottom: 6 }}>Financing</div>
          <div className="section-sub">{"Prism Patient verifies each patient's EOB and offers one straightforward financing product — no partner selection needed."}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, border: "2px solid var(--teal)", borderRadius: "var(--radius-sm)", padding: "14px 16px", background: "#E6FBF9" }}>
            <div className="fc-logo" style={{ background: "#E6FBF9" }}>🏥</div>
            <div><div style={{ fontWeight: 600, fontSize: 14 }}>Prism Patient EOB-Verified Financing</div><div style={{ fontSize: 12, color: "var(--text-secondary)" }}>3/6/9/12-month terms · 0% interest if paid within 12 months</div></div>
            <div style={{ marginLeft: "auto", width: 22, height: 22, borderRadius: 6, background: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 13, flexShrink: 0 }}>✓</div>
          </div>
          <hr className="divider" />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" disabled={savingAccount} onClick={handleSaveAccount}>{savingAccount ? "Saving..." : "Save Changes"}</button>
          </div>
        </div>
      </div>

      {/* ACH Banking Info */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-icon teal">🏦</div>
          <div><div className="card-title">ACH Banking Information</div><div className="card-subtitle">Where patient payment funds will be deposited</div></div>
        </div>
        <div className="card-body">
          {bankSaved && <div className="alert success" style={{ marginBottom: 16 }}>Banking information saved securely.</div>}
          <div className="alert info" style={{ marginBottom: 20 }}>{"Your banking details are encrypted and used solely for ACH disbursement of patient payment funds to your practice."}</div>
          <div className="form-row">
            <div className="form-group"><label>Bank Name</label><input placeholder="e.g. Chase, Bank of America" value={banking.bankName} onChange={e => updBank("bankName", e.target.value)} /></div>
            <div className="form-group"><label>Account Holder Name</label><input placeholder="Practice legal name" value={banking.accountHolder} onChange={e => updBank("accountHolder", e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Routing Number</label>
              <input className="input-sensitive" placeholder="9 digits" value={bankSaved ? maskRouting(banking.routingNumber) : banking.routingNumber} onChange={e => updBank("routingNumber", e.target.value)} maxLength={9} readOnly={bankSaved} />
            </div>
            <div className="form-group">
              <label>Account Number</label>
              <input className="input-sensitive" placeholder="Account number" value={bankSaved ? maskAccount(banking.accountNumber) : banking.accountNumber} onChange={e => updBank("accountNumber", e.target.value)} readOnly={bankSaved} />
            </div>
          </div>
          <div className="form-group" style={{ maxWidth: 220 }}>
            <label>Account Type</label>
            <select value={banking.accountType} onChange={e => updBank("accountType", e.target.value)} disabled={bankSaved}>
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
            </select>
          </div>
          <div className="helper-text" style={{ marginBottom: 20 }}>Routing and account numbers are masked after saving. Contact support to update banking information.</div>
          <hr className="divider" />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            {bankSaved && <button className="btn btn-ghost" onClick={() => setBankSaved(false)}>Edit</button>}
            {!bankSaved && <button className="btn btn-primary" disabled={!banking.bankName || !banking.routingNumber || !banking.accountNumber || !banking.accountHolder} onClick={() => setBankSaved(true)}>Save Banking Info</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PROVIDER BILLING PAGE ────────────────────────────────────────────────────

function ProviderBillingPage({ accountAddress }) {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [card, setCard] = useState({ cardNumber: "", expiry: "", cvv: "", name: "", address: "", city: "", state: "", zip: "" });
  const [cardSaved, setCardSaved] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [sameAsAccount, setSameAsAccount] = useState(false);
  const [ach, setAch] = useState({ bankName: "", accountHolder: "", routingNumber: "", accountNumber: "", accountType: "checking" });
  const [achSaved, setAchSaved] = useState(false);
  const updCard = (k, v) => setCard(f => ({ ...f, [k]: v }));
  const updAch = (k, v) => setAch(f => ({ ...f, [k]: v }));
  const maskCard = (num) => num.replace(/\s/g, "").length >= 4 ? "•••• •••• •••• " + num.replace(/\s/g, "").slice(-4) : num;
  const maskNum = (n) => n.length > 4 ? "•".repeat(n.length - 4) + n.slice(-4) : n;

  const handleSameAsAccount = (checked) => {
    setSameAsAccount(checked);
    if (checked && accountAddress) {
      setCard(f => ({ ...f, address: accountAddress.address || "", city: accountAddress.city || "", state: accountAddress.state || "", zip: accountAddress.zip || "" }));
    }
  };

  return (
    <div className="main-narrow">
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-icon teal">💳</div>
          <div><div className="card-title">Billing</div><div className="card-subtitle">Payment method on file for Prism Patient monthly platform fee</div></div>
        </div>
        <div className="card-body">
          <div style={{ background: "var(--mist)", border: "1px solid #B3EEE9", borderRadius: "var(--radius-sm)", padding: "16px 20px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Current Plan</div>
              <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 18 }}>Prism Patient Provider</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>$29.99 / month + $19.99 per additional user · Billed monthly</div>
            </div>
            <div style={{ background: "#D1FAE5", color: "#065F46", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: "100px" }}>Active</div>
          </div>

          {(cardSaved || achSaved) && <div className="alert success" style={{ marginBottom: 16 }}>Payment method saved securely.</div>}

          <div className="section-title" style={{ fontSize: 16, marginBottom: 6 }}>Payment Method</div>
          <div className="section-sub">
            {paymentMethod === "card" ? "Your card is charged on the 1st of each month." : "Your bank account is debited via ACH on the 1st of each month."}
          </div>

          <div className="nav-pill" style={{ marginBottom: 20 }}>
            <button className={paymentMethod === "card" ? "active" : ""} onClick={() => setPaymentMethod("card")}>Credit Card</button>
            <button className={paymentMethod === "ach" ? "active" : ""} onClick={() => setPaymentMethod("ach")}>ACH / Bank Transfer</button>
          </div>

          {paymentMethod === "card" ? (
            <>
              <div className="form-group">
                <label>Cardholder Name</label>
                <input placeholder="Name as it appears on card" value={card.name} onChange={e => updCard("name", e.target.value)} readOnly={cardSaved} />
              </div>
              <div className="form-group">
                <label>Card Number</label>
                <input className="input-sensitive" placeholder="1234 5678 9012 3456" value={cardSaved ? maskCard(card.cardNumber) : card.cardNumber} onChange={e => updCard("cardNumber", formatCardNumber(e.target.value))} maxLength={19} readOnly={cardSaved} />
              </div>
              <div className="form-row">
                <div className="form-group"><label>Expiration Date</label><input placeholder="MM / YY" value={card.expiry} onChange={e => updCard("expiry", formatExpiry(e.target.value))} maxLength={7} readOnly={cardSaved} /></div>
                <div className="form-group">
                  <label>CVV</label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input-sensitive"
                      type={cardSaved || !showCvv ? "password" : "text"}
                      placeholder="•••"
                      value={cardSaved ? "•••" : card.cvv}
                      onChange={e => updCard("cvv", e.target.value.replace(/\D/g, ""))}
                      maxLength={4}
                      readOnly={cardSaved}
                      style={{ paddingRight: 40 }}
                    />
                    {!cardSaved && (
                      <button
                        type="button"
                        onClick={() => setShowCvv(v => !v)}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 4, color: "var(--text-secondary)" }}
                        aria-label={showCvv ? "Hide CVV" : "Show CVV"}
                      >
                        {showCvv ? "🙈" : "👁"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <hr className="divider" />
              <div className="section-title" style={{ fontSize: 16, marginBottom: 6 }}>Billing Address</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <input type="checkbox" id="sameAsAccount" checked={sameAsAccount} onChange={e => handleSameAsAccount(e.target.checked)} style={{ width: "auto" }} />
                <label htmlFor="sameAsAccount" style={{ fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Same as Account Info address</label>
              </div>
              {sameAsAccount && !accountAddress?.address && (
                <div className="helper-text" style={{ marginBottom: 12, color: "#B45309" }}>No address is saved under Account Info yet — fill it in there first, or uncheck this to enter one here.</div>
              )}
              <div className="form-group"><label>Street Address</label><input placeholder="123 Main Street" value={card.address} onChange={e => updCard("address", e.target.value)} readOnly={cardSaved || sameAsAccount} /></div>
              <div className="form-row">
                <div className="form-group"><label>City</label><input placeholder="Miami" value={card.city} onChange={e => updCard("city", e.target.value)} readOnly={cardSaved || sameAsAccount} /></div>
                <div className="form-group"><label>State</label>
                  <select value={card.state} onChange={e => updCard("state", e.target.value)} disabled={cardSaved || sameAsAccount}>
                    <option value="">Select...</option>
                    {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ maxWidth: 180 }}><label>ZIP Code</label><input placeholder="33101" value={card.zip} onChange={e => updCard("zip", e.target.value)} maxLength={5} readOnly={cardSaved || sameAsAccount} /></div>

              <div className="helper-text" style={{ marginBottom: 20 }}>Card details are masked after saving. Click Edit to update your payment method.</div>
              <hr className="divider" />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                {cardSaved && <button className="btn btn-ghost" onClick={() => setCardSaved(false)}>Edit Card</button>}
                {!cardSaved && <button className="btn btn-primary" disabled={!card.cardNumber || !card.expiry || !card.cvv || !card.name} onClick={() => setCardSaved(true)}>Save Card</button>}
              </div>
            </>
          ) : (
            <>
              <div className="form-group"><label>Bank Name</label><input placeholder="Chase" value={ach.bankName} onChange={e => updAch("bankName", e.target.value)} readOnly={achSaved} /></div>
              <div className="form-group"><label>Account Holder Name</label><input placeholder="Name on the account" value={ach.accountHolder} onChange={e => updAch("accountHolder", e.target.value)} readOnly={achSaved} /></div>
              <div className="form-row">
                <div className="form-group"><label>Routing Number</label><input className="input-sensitive" placeholder="9 digits" value={achSaved ? maskNum(ach.routingNumber) : ach.routingNumber} onChange={e => updAch("routingNumber", e.target.value.replace(/\D/g, ""))} maxLength={9} readOnly={achSaved} /></div>
                <div className="form-group"><label>Account Number</label><input className="input-sensitive" placeholder="Account number" value={achSaved ? maskNum(ach.accountNumber) : ach.accountNumber} onChange={e => updAch("accountNumber", e.target.value.replace(/\D/g, ""))} readOnly={achSaved} /></div>
              </div>
              <div className="form-group" style={{ maxWidth: 220 }}>
                <label>Account Type</label>
                <select value={ach.accountType} onChange={e => updAch("accountType", e.target.value)} disabled={achSaved}>
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </div>

              <div className="helper-text" style={{ marginBottom: 20 }}>Bank details are masked after saving. Click Edit to update your payment method.</div>
              <hr className="divider" />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                {achSaved && <button className="btn btn-ghost" onClick={() => setAchSaved(false)}>Edit Bank Info</button>}
                {!achSaved && <button className="btn btn-primary" disabled={!ach.bankName || !ach.accountHolder || !ach.routingNumber || !ach.accountNumber} onClick={() => setAchSaved(true)}>Save Bank Info</button>}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="section-title" style={{ fontSize: 16, marginBottom: 6 }}>Billing History</div>
          <div className="section-sub">Recent charges to your account.</div>
          <table className="patient-table">
            <thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {[["May 1, 2026", "Prism Patient Provider — Base Fee + 1 User", "$49.98", "approved"], ["Apr 1, 2026", "Prism Patient Provider — Base Fee + 1 User", "$49.98", "approved"], ["Mar 1, 2026", "Prism Patient Provider — Base Fee", "$29.99", "approved"]].map(([date, desc, amt, status], i) => (
                <tr key={i}>
                  <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{date}</td>
                  <td style={{ fontSize: 14 }}>{desc}</td>
                  <td style={{ fontWeight: 600 }}>{amt}</td>
                  <td><span className={`status-pill ${status}`}>✓ Paid</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PROVIDER MESSAGES / CONTACT US ──────────────────────────────────────────

function ProviderMessagesPage({ providerUser }) {
  const [providerId, setProviderId] = useState(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("providers").select("id").eq("email", providerUser?.email).order("created_at", { ascending: false }).limit(1);
      setProviderId(data?.[0]?.id || null);
    })();
  }, [providerUser?.email]);
  const MOCK_PROVIDER_MESSAGES = [
    { id: 1, subject: "Welcome to Prism Patient", from: "Prism Patient Team", date: "May 1, 2026", read: true, thread: [
      { from: "Prism Patient Team", date: "May 1, 2026", body: "Welcome to Prism Patient! Your practice account is now active. If you have questions about referrals, billing, or your account, please reach out any time — we're here to help." },
    ]},
  ];
  const [messages, setMessages] = useState(MOCK_PROVIDER_MESSAGES);
  const [activeThread, setActiveThread] = useState(null);
  const [composing, setComposing] = useState(false);
  const [newMsg, setNewMsg] = useState({ subject: "", body: "" });
  const [replyBody, setReplyBody] = useState("");
  const [replySent, setReplySent] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const senderName = providerUser?.practiceName || providerUser?.contactName || providerUser?.email || "Me";
  const senderInitial = (senderName || "M")[0].toUpperCase();

  // Fetch real message threads from Supabase once we know the provider's DB id.
  useEffect(() => {
    if (!providerId) return;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        const byThread = {};
        data.forEach(row => {
          const dateStr = row.created_at
            ? new Date(row.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
            : "";
          const isMe = row.sender === senderName;
          if (!byThread[row.thread_id]) {
            byThread[row.thread_id] = { id: row.thread_id, subject: (row.subject || "").replace(/^Re:\s*/i, ""), read: true, thread: [] };
          }
          byThread[row.thread_id].thread.push({ from: isMe ? "Me" : (row.sender || "Prism Patient Team"), date: dateStr, body: row.body });
          if (row.read === false) byThread[row.thread_id].read = false;
        });
        const grouped = Object.values(byThread)
          .sort((a, b) => Number(b.id) - Number(a.id))
          .map(t => {
            const last = t.thread[t.thread.length - 1];
            return { ...t, from: last.from, date: last.date };
          });
        setMessages(grouped);
      }
    })();
  }, [providerId, senderName]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="section-title" style={{ marginBottom: 4 }}>Messages</div>
          <div className="section-sub">Contact the Prism Patient support team with any questions about referrals, billing, or your account.</div>
        </div>
        {!composing && !activeThread && (
          <button className="btn btn-primary" style={{ padding: "8px 18px", fontSize: 13 }} onClick={() => { setComposing(true); setNewMsg({ subject: "", body: "" }); }}>+ New Message</button>
        )}
      </div>

      {composing && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-icon teal">✏️</div>
            <div><div className="card-title">New Message</div><div className="card-subtitle">Our team typically responds within 1 business day</div></div>
          </div>
          <div className="card-body">
            <div className="form-group"><label>Subject *</label><input placeholder="e.g. Question about a referral" value={newMsg.subject} onChange={e => setNewMsg(m => ({ ...m, subject: e.target.value }))} /></div>
            <div className="form-group"><label>Message *</label><textarea placeholder="Type your message here..." value={newMsg.body} onChange={e => setNewMsg(m => ({ ...m, body: e.target.value }))} style={{ minHeight: 120, resize: "vertical", lineHeight: 1.6 }} /></div>
            <hr className="divider" />
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setComposing(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!newMsg.subject || !newMsg.body || sendingMsg}
                onClick={async () => {
                  setSendingMsg(true);
                  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
                  const threadId = Date.now();
                  await supabase.from("messages").insert({
                    patient_id: null,
                    provider_id: providerId,
                    thread_id: threadId,
                    subject: newMsg.subject,
                    body: newMsg.body,
                    sender: senderName,
                    read: true,
                  });
                  const msg = { id: threadId, subject: newMsg.subject, from: "Me", date: today, read: true, thread: [{ from: "Me", date: today, body: newMsg.body }] };
                  setMessages(msgs => [msg, ...msgs]);
                  setSendingMsg(false);
                  setComposing(false);
                  setActiveThread(msg);
                }}>{sendingMsg ? "Sending..." : "Send Message"}</button>
            </div>
          </div>
        </div>
      )}

      {activeThread && !composing && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
              <button onClick={() => { setActiveThread(null); setReplyBody(""); setReplySent(false); }} style={{ background: "none", border: "none", color: "var(--teal-dark)", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 500, padding: 0 }}>{"← Back"}</button>
              <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 600, fontSize: 16 }}>{activeThread.subject}</div>
            </div>
          </div>
          <div style={{ padding: "0 28px" }}>
            {activeThread.thread.map((msg, i) => (
              <div key={i} style={{ padding: "20px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: msg.from === "Me" ? "var(--teal)" : "var(--coral)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 13, fontWeight: 700 }}>
                    {msg.from === "Me" ? senderInitial : "R"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{msg.from === "Me" ? senderName : "Prism Patient Support Team"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{msg.date}</div>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.8, paddingLeft: 42 }}>{msg.body}</div>
              </div>
            ))}
          </div>
          <div className="card-body" style={{ paddingTop: 16 }}>
            {replySent ? (
              <div className="alert success">{"Reply sent. Our team will respond within 1 business day."}</div>
            ) : (
              <>
                <div className="form-group"><label>Reply</label><textarea placeholder="Type your reply..." value={replyBody} onChange={e => setReplyBody(e.target.value)} style={{ minHeight: 90, resize: "vertical", lineHeight: 1.6 }} /></div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" disabled={!replyBody.trim() || sendingMsg}
                    onClick={async () => {
                      setSendingMsg(true);
                      const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
                      await supabase.from("messages").insert({
                        patient_id: null,
                        provider_id: providerId,
                        thread_id: activeThread.id,
                        subject: `Re: ${activeThread.subject}`,
                        body: replyBody,
                        sender: senderName,
                        read: true,
                      });
                      const updated = { ...activeThread, thread: [...activeThread.thread, { from: "Me", date: today, body: replyBody }] };
                      setMessages(msgs => msgs.map(m => m.id === activeThread.id ? updated : m));
                      setActiveThread(updated);
                      setReplyBody("");
                      setSendingMsg(false);
                      setReplySent(true);
                    }}>{sendingMsg ? "Sending..." : "Send Reply"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!activeThread && !composing && (
        <div className="card">
          <div className="card-header">
            <div className="card-icon teal">📬</div>
            <div><div className="card-title">Inbox</div><div className="card-subtitle">{messages.length} conversation{messages.length !== 1 ? "s" : ""}</div></div>
          </div>
          {messages.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>No messages yet.</div>
          ) : (
            <div>
              {messages.map(msg => (
                <div key={msg.id}
                  onClick={() => { setActiveThread(msg); setMessages(msgs => msgs.map(m => m.id === msg.id ? { ...m, read: true } : m)); setReplySent(false); setReplyBody(""); }}
                  style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: msg.read ? "var(--white)" : "#E6FBF9", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: msg.from === "Me" ? "var(--teal)" : "var(--coral)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                    {msg.from === "Me" ? senderInitial : "R"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div style={{ fontWeight: msg.read ? 500 : 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.subject}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{msg.date}</div>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                      {msg.from === "Me" ? "Me" : "Prism Patient Team"}{": "}{msg.thread[msg.thread.length - 1].body.slice(0, 60)}{"..."}
                    </div>
                  </div>
                  {!msg.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--teal)", flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PROVIDER MARKETING SITE ─────────────────────────────────────────────────

function ProviderMarketingNav({ activePage, onNavigate }) {
  const links = [["home", "Home"], ["about", "About"], ["services", "Services"], ["partners", "Partners"], ["faq", "FAQ"], ["blog-provider", "Blog"], ["contact-provider", "Contact"]];
  return (
    <div style={{ background: "var(--white)", borderBottom: "1px solid var(--border)", padding: "10px 16px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, minHeight: 56 }}>
      <div style={{ display: "flex", gap: 2, flexWrap: "wrap", flex: "1 1 auto" }}>
        {links.map(([id, label]) => (
          <button key={id} onClick={() => onNavigate(id)} style={{ padding: "6px 10px", borderRadius: 8, border: "none", fontFamily: "DM Sans, sans-serif", fontSize: 14, fontWeight: activePage === id ? 600 : 400, cursor: "pointer", background: "transparent", color: activePage === id ? "var(--teal-dark)" : "var(--text-secondary)", borderBottom: activePage === id ? "2px solid var(--teal)" : "2px solid transparent", transition: "all 0.2s", whiteSpace: "nowrap" }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
        <div className="nav-pill" style={{ display: "flex" }}>
          <button type="button" className={activePage === "provider-login" ? "active" : ""} onClick={() => onNavigate("provider-login")} style={{ whiteSpace: "nowrap" }}>Sign In</button>
          <button type="button" className={activePage === "register" ? "active" : ""} onClick={() => onNavigate("register")} style={{ whiteSpace: "nowrap" }}>Get Started</button>
        </div>
      </div>
    </div>
  );
}

function GetStartedCTA({ onNavigate, light }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 32px", background: light ? "var(--mist)" : "linear-gradient(135deg, var(--navy), var(--navy-mid))", borderRadius: light ? 0 : "var(--radius)" }}>
      <div style={{ fontFamily: "Sora, sans-serif", fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 700, color: light ? "var(--text-primary)" : "white", marginBottom: 12 }}>Ready to get started?</div>
      <div style={{ fontSize: 16, color: light ? "var(--text-secondary)" : "rgba(255,255,255,0.65)", marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>Join hundreds of practices offering flexible payment options to their patients. Setup takes under 5 minutes.</div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={() => onNavigate("register")}>Create Your Free Account</button>
        <button onClick={() => onNavigate("about")} style={{ padding: "14px 28px", borderRadius: "100px", fontFamily: "DM Sans, sans-serif", fontWeight: 500, fontSize: 15, cursor: "pointer", background: "transparent", color: light ? "var(--teal-dark)" : "white", border: light ? "1.5px solid var(--teal)" : "1.5px solid rgba(255,255,255,0.3)" }}>Learn More</button>
      </div>
    </div>
  );
}

// ── PROVIDER HOME PAGE ──

function ProviderHome({ onNavigate }) {
  const features = [
    { icon: "⚡", title: "Instant Pre-Approvals", desc: "Patients receive a pre-approval decision in seconds, removing financial hesitation at the point of care." },
    { icon: "💳", title: "Multiple Payment Plans", desc: "Offer patients monthly payment options built around the episodic, ongoing nature of ABA therapy, IOP, PHP, and outpatient behavioral health treatment." },
    { icon: "🏦", title: "Direct ACH Disbursement", desc: "Approved funds are deposited directly to your practice account within 1-2 business days. Zero collection risk." },
    { icon: "📊", title: "Real-Time Dashboard", desc: "Track application activity, approval rates, and financed revenue from a single, intuitive dashboard." },
    { icon: "🔒", title: "HIPAA Compliant", desc: "Patient data is encrypted and handled in full compliance with HIPAA requirements at every step." },
    { icon: "📲", title: "Refer in Seconds", desc: "Send patients a personalized application link via text or email directly from your provider portal." },
  ];

  const stats = [["84%", "Approval rate"], ["1–2 days", "ACH disbursement"], ["$0", "Collection risk"], ["ABA & BH", "Built for your vertical"]];

  return (
    <>
      {/* Hero */}
      <div className="hero" style={{ padding: "88px 32px" }}>
        <h1 style={{ position: "relative" }}>Your patients need care.<br />Cost <em>should not</em> be the reason they stop.</h1>
        <p>Prism Patient is built for behavioral health, mental health, autism, and ABA practices — giving your patients a clear path to financing so your team can focus on treatment, not billing.</p>
        <div className="hero-ctas">
          <button className="btn btn-primary" onClick={() => onNavigate("register")}>Create Your Free Account</button>
          <button className="btn btn-outline" onClick={() => onNavigate("how-it-works")}>Learn How It Works</button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="stats-bar">
        {stats.map(([n, l]) => (
          <div className="stat" key={l}><div className="stat-num">{n}</div><div className="stat-label">{l}</div></div>
        ))}
      </div>

      {/* Features grid */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 700, marginBottom: 12 }}>Everything your practice needs</div>
          <div style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto" }}>One platform to handle patient financing from application to disbursement.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "28px 24px", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works strip */}
      <div style={{ background: "var(--mist)", padding: "64px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontFamily: "Sora, sans-serif", fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 700, marginBottom: 10 }}>How it works for your practice</div>
            <div style={{ fontSize: 15, color: "var(--text-secondary)" }}>Designed for the workflow of ABA centers, behavioral health practices, and mental health providers. No technical setup required.</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            {[["01", "Create Your Account", "Sign up in under 5 minutes. Enter your practice details and connect your bank account for ACH deposits."], ["02", "Refer a Patient", "Send patients a personalized financing link via text or email directly from your dashboard."], ["03", "Patient Gets Pre-Approved", "Patients complete a short application and receive a pre-approval decision in seconds."], ["04", "You Get Paid", "Approved funds are deposited to your practice within 1-2 business days. Zero collection risk."]].map(([num, title, desc]) => (
              <div key={num} style={{ background: "var(--white)", borderRadius: "var(--radius-sm)", padding: "24px 20px", boxShadow: "var(--shadow)", textAlign: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, var(--teal), var(--teal-light))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 14, color: "white" }}>{num}</div>
                <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing teaser */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ fontFamily: "Sora, sans-serif", fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 700, marginBottom: 12 }}>Simple, transparent pricing</div>
        <div style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32 }}>One low monthly fee per practice, plus a small per-user add-on. No setup costs, no hidden fees, no long-term contracts.</div>
        <div style={{ background: "var(--white)", border: "2px solid var(--teal)", borderRadius: "var(--radius)", padding: "36px 32px", boxShadow: "var(--shadow-lg)" }}>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: 48, fontWeight: 700, color: "var(--teal-dark)" }}>$29.99</div>
          <div style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 8 }}>per practice / month</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24, background: "var(--mist)", borderRadius: "100px", padding: "6px 14px", display: "inline-block" }}>+ $19.99 / month per additional user</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, textAlign: "left" }}>
            {["Unlimited patient referrals", "Full dashboard and reporting", "ACH disbursement within 1-2 days", "Multiple lending partner options", "HIPAA-compliant platform", "Email and chat support"].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--slate)" }}>
                <span style={{ color: "var(--success)", fontWeight: 700 }}>✓</span>{f}
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => onNavigate("register")}>Get Started — First Month Free</button>
        </div>
      </div>

      <GetStartedCTA onNavigate={onNavigate} />
    </>
  );
}

// ── ABOUT PAGE ──

function ProviderAbout({ onNavigate }) {
  return (
    <>
      <div className="hero" style={{ padding: "72px 32px" }}>
        <h1>About <em>Prism Patient</em></h1>
        <p>Prism Patient is purpose-built for the practices and treatment centers serving patients with behavioral health conditions, mental health needs, and autism.</p>
      </div>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ fontFamily: "Sora, sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Our Mission</div>
        <p style={{ fontSize: 16, color: "var(--slate)", lineHeight: 1.8, marginBottom: 40 }}>ABA therapy, IOP programs, PHP levels of care, outpatient psychiatric services — these treatments require sustained engagement over weeks and months. A family that has to pause ABA because of a billing gap does not just lose a week of therapy. They lose progress. Prism Patient was built to prevent that.</p>

        <div style={{ fontFamily: "Sora, sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Who We Are</div>
        <p style={{ fontSize: 16, color: "var(--slate)", lineHeight: 1.8, marginBottom: 40 }}>Prism Patient was founded by a team with deep roots in behavioral health revenue cycle management. We spent years watching families drop out of ABA programs and behavioral health treatment because of billing complexity and unmanageable out-of-pocket costs. We built Prism Patient because existing financing products were not designed for this space — and the patients in it deserve better.</p>

        <div style={{ fontFamily: "Sora, sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 16 }}>What We Believe</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 48 }}>
          {[["Transparency", "No hidden fees, no deferred interest traps. Patients and providers always know exactly what they are signing up for."], ["Accessibility", "We design our products to work for patients across the credit spectrum, not just those with perfect scores."], ["Partnership", "We are not a vendor — we are a long-term partner in your practice's financial health and patient outcomes."], ["Compliance", "HIPAA, TILA, Reg Z. We built compliance in from day one, not as an afterthought."]].map(([title, desc]) => (
            <div key={title} style={{ background: "var(--mist)", borderRadius: "var(--radius-sm)", padding: "24px 20px" }}>
              <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 8, color: "var(--teal-dark)" }}>{title}</div>
              <div style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
      <GetStartedCTA onNavigate={onNavigate} />
    </>
  );
}

// ── SERVICES PAGE ──

function ProviderServices({ onNavigate }) {
  const services = [
    { icon: "💳", title: "Patient Payment Plans", desc: "Offer patients flexible monthly payment options through our network of vetted lending partners. From 0% promotional plans to extended financing, we match patients with the option that fits their financial situation.", features: ["Pre-approval in seconds", "Multiple term options", "Soft credit pull only", "84% average approval rate"] },
    { icon: "🏦", title: "Direct Practice Funding", desc: "Once a patient is approved and signs their agreement, funds are disbursed directly to your practice via ACH within 1-2 business days. You get paid in full — we handle collections.", features: ["ACH to your bank account", "1-2 business day funding", "Zero collection risk", "Transparent merchant fee"] },
    { icon: "📲", title: "Patient Referral Tools", desc: "Refer patients to a financing application in seconds from your dashboard. Send a personalized link via text or email, or complete the intake form on their behalf at check-in.", features: ["SMS and email referral links", "Pre-filled patient info", "In-office tablet flow", "Staff-assisted entry"] },
    { icon: "📊", title: "Practice Dashboard", desc: "Track application activity, approval rates, and disbursements across your ABA or behavioral health caseload — all in one real-time dashboard.", features: ["Real-time application status", "Monthly activity metrics", "Approval rate tracking", "Disbursement history"] },
    { icon: "🔒", title: "Compliance Infrastructure", desc: "Prism Patient is built on a HIPAA-compliant infrastructure with bank-level encryption. All patient data, loan agreements, and e-signatures are handled in full regulatory compliance.", features: ["HIPAA-compliant data handling", "TILA / Reg Z disclosures", "ESIGN Act e-signatures", "SOC 2 compliant hosting"] },
    { icon: "🤝", title: "Dedicated Onboarding", desc: "Every new practice gets a dedicated Prism Patient onboarding specialist who walks you through setup, answers questions, and makes sure you are ready to refer your first patient on day one.", features: ["Dedicated account setup", "Practice staff training", "Go-live support", "Ongoing account management"] },
  ];

  return (
    <>
      <div className="hero" style={{ padding: "72px 32px" }}>
        <h1>Built for <em>behavioral health</em></h1>
        <p>A patient financing platform designed specifically for ABA therapy centers, IOP/PHP programs, outpatient behavioral health practices, and psychiatric providers.</p>
      </div>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {services.map((s, i) => (
            <div key={i} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "32px 28px", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{s.icon}</div>
              <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.7, marginBottom: 20 }}>{s.desc}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {s.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--slate)" }}>
                    <span style={{ color: "var(--teal)", fontWeight: 700, fontSize: 12 }}>✓</span>{f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <GetStartedCTA onNavigate={onNavigate} />
    </>
  );
}

// ── PARTNERS PAGE ──

function ProviderPartners({ onNavigate }) {
  const pillars = [
    { logo: "📄", name: "EOB-Verified Amounts", desc: "Patients upload their EOB or provider statement. Our team — supported by AI — verifies the exact amount owed, so financing decisions are based on real, accurate balances instead of self-reported estimates.", tags: ["AI + human review", "Higher accuracy", "Fewer disputes"] },
    { logo: "💳", name: "Credit Pull, Confirmed Amount", desc: "A soft credit pull runs alongside EOB verification. Combining a confirmed healthcare balance with a standard credit check gives a more reliable underwriting signal than either one alone.", tags: ["Soft pull only", "No score impact to check", "More consistent approvals"] },
    { logo: "📅", name: "Auto-Assigned Terms", desc: "Prism Patient automatically assigns a 3, 6, 9, or 12-month term based on the verified loan amount. All terms carry 0% interest as long as the balance is paid in full within 12 months.", tags: ["3/6/9/12 months", "0% within 12 months", "No manual selection needed"] },
  ];

  return (
    <>
      <div className="hero" style={{ padding: "72px 32px" }}>
        <h1>How Prism Patient <em>underwrites</em></h1>
        <p>A financing model built specifically for healthcare — not a generic credit-score-based product.</p>
      </div>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, marginBottom: 12 }}>Why EOB-based underwriting</div>
          <div style={{ fontSize: 15, color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto" }}>Generic BNPL products approve based on credit score alone. Prism Patient verifies the actual healthcare balance first — leading to more accurate loan amounts and more consistent collections for your practice.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 56 }}>
          {pillars.map((p, i) => (
            <div key={i} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "28px 28px", boxShadow: "var(--shadow)", display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--mist)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{p.logo}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.7, marginBottom: 14 }}>{p.desc}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {p.tags.map(t => (<span key={t} style={{ background: "var(--mist)", border: "1px solid #B3EEE9", color: "var(--teal-dark)", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: "100px" }}>{t}</span>))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "var(--mist)", borderRadius: "var(--radius)", padding: "32px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 10 }}>Want to see the full fee structure?</div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>Origination fees are tiered by loan amount and deducted from your disbursement — patients pay a flat 3.5% processing fee separately. Our team is happy to walk through the details.</div>
          <button className="btn btn-ghost" style={{ color: "var(--teal-dark)" }} onClick={() => onNavigate("contact-provider")}>Contact Us</button>
        </div>
      </div>
      <GetStartedCTA onNavigate={onNavigate} />
    </>
  );
}

// ── FAQ PAGE ──

function ProviderFAQ({ onNavigate }) {
  const [open, setOpen] = useState(null);
  const faqs = [
    { q: "How long does it take to set up my practice on Prism Patient?", a: "Setup takes under 5 minutes. Create your account, enter your practice details, connect your bank account for ACH disbursements, and select which payment plans to offer. ABA centers, IOP programs, and outpatient practices can refer their first patient the same day." },
    { q: "How does Prism Patient make money?", a: "Prism Patient charges a flat monthly platform fee of $29.99 per practice, plus $19.99 per month for each additional user on the account. We also collect a small merchant discount fee (deducted from disbursements) when a patient financing transaction is funded. There are no setup fees or long-term contracts." },
    { q: "When does my practice receive funds after a patient is approved?", a: "Once a patient accepts their offer and signs the loan agreement, funds are disbursed to your practice bank account via ACH within 1-2 business days. You are paid in full regardless of the patient's repayment behavior." },
    { q: "What happens if a patient defaults on their payment plan?", a: "Your practice bears zero collection risk. Once funds are disbursed to your account, Prism Patient and our lending partners handle all patient repayment and collections. A patient default has no impact on your practice revenue." },
    { q: "What types of practices can use Prism Patient?", a: "Prism Patient is purpose-built for IOP and PHP programs, outpatient mental health and substance use practices, psychiatric providers, ABA therapy centers, and autism treatment providers. We also support dental, physical therapy, and other specialty healthcare." },
    { q: "Is Prism Patient HIPAA compliant?", a: "Yes. Prism Patient is built on HIPAA-compliant infrastructure. All patient data is encrypted in transit and at rest. We maintain a Business Associate Agreement (BAA) with all practices on the platform." },
    { q: "What credit scores do patients need to qualify?", a: "Prism Patient combines a soft credit pull with EOB verification, so approval is not based on credit score alone. We work with a broad credit spectrum, and a verified healthcare balance often allows us to approve patients that a credit-score-only product would decline." },
    { q: "Can I refer patients from my existing EHR or practice management system?", a: "Direct EHR integration is on our roadmap. Currently, providers refer patients directly from the Prism Patient dashboard via a personalized SMS or email link. The patient completes their application on any device." },
    { q: "Is there a minimum volume requirement?", a: "No. There are no minimum patient volume requirements. The $29.99 base monthly fee, plus $19.99 per additional user, stays flat regardless of how many patients you refer in a given month." },
    { q: "How do I cancel my Prism Patient account?", a: "You can cancel at any time with no cancellation fees. Simply contact your account manager or email support. Your account will remain active through the end of your current billing period." },
  ];

  return (
    <>
      <div className="hero" style={{ padding: "72px 32px" }}>
        <h1>Frequently asked <em>questions</em></h1>
        <p>Everything providers want to know before getting started with Prism Patient.</p>
      </div>
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 56 }}>
          {faqs.map((f, i) => (
            <div key={i} style={{ background: "var(--white)", border: `1px solid ${open === i ? "var(--teal-light)" : "var(--border)"}`, borderRadius: "var(--radius-sm)", overflow: "hidden", boxShadow: open === i ? "var(--shadow)" : "none", transition: "all 0.2s" }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", background: "none", border: "none", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 15, fontWeight: 600, color: open === i ? "var(--teal-dark)" : "var(--text-primary)", textAlign: "left", gap: 12 }}>
                {f.q}
                <span style={{ color: "var(--teal)", fontSize: 20, flexShrink: 0, transform: open === i ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
              </button>
              {open === i && (
                <div style={{ padding: "0 20px 18px", fontSize: 14, color: "var(--slate)", lineHeight: 1.8 }}>{f.a}</div>
              )}
            </div>
          ))}
        </div>
        <div style={{ background: "var(--mist)", borderRadius: "var(--radius-sm)", padding: "28px 24px", textAlign: "center" }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Still have questions?</div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>Our team is happy to walk you through anything before you sign up.</div>
          <button className="btn btn-ghost" style={{ color: "var(--teal-dark)" }}>Contact Us</button>
        </div>
      </div>
      <GetStartedCTA onNavigate={onNavigate} />
    </>
  );
}

// ── PROVIDER REGISTRATION PAGE ──

function ProviderRegister({ onRegistered }) {
  const [form, setForm] = useState({ contactName: "", practiceName: "", email: "", phone: "", specialty: "", password: "", confirmPassword: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [error, setError] = useState("");
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const { active: comingSoon, requestAccess } = useComingSoon();
  const pwErrors = validatePassword(form.password);
  const valid = form.contactName && form.practiceName && form.email && form.phone && form.password && form.confirmPassword && pwErrors.length === 0;


  const welcomeEmailBody =
`Dear ${form.contactName || "there"},

Welcome to Prism Patient Payment Solutions!

Your account has been created and you are ready to start offering flexible payment options to your patients.

  Practice: ${form.practiceName}
  Email: ${form.email}

Here is what to do next:
  1. Complete your practice profile in the Account section
  2. Add your ACH banking information for fund disbursements
  3. Refer your first patient from the dashboard

If you have any questions, reply to this email or reach out to your dedicated onboarding specialist.

Welcome aboard.

— The Prism Patient Team`;

  const handleSubmit = async () => {
    if (comingSoon) { requestAccess(); return; }
    const errs = validatePassword(form.password);
    if (errs.length) { setError(errs[0]); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    setError("");
    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { role: "provider" } },
    });

    if (signUpError) { setError(signUpError.message); setSubmitting(false); return; }

    await supabase.from("providers").insert({
      email: form.email,
      practice_name: form.practiceName,
      contact_name: form.contactName,
      phone: form.phone,
      specialty: form.specialty,
    });

    setSubmitting(false);
    setShowEmail(true);
    setTimeout(() => {
      onRegistered({ email: form.email, practiceName: form.practiceName, contactName: form.contactName });
    }, 2000);
  };

  return (
    <div className="main-narrow" style={{ paddingTop: 48 }}>
      <div className="card">
        <div className="card-header">
          <div className="card-icon teal">🏥</div>
          <div>
            <div className="card-title">Create Your Prism Patient Account</div>
            <div className="card-subtitle">First month free — no credit card required</div>
          </div>
        </div>
        <div className="card-body">
          {showEmail ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <div style={{ fontFamily: "Sora, sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Account created!</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>Signing you in and sending your welcome email...</div>
              <MockEmail to={form.email} subject="Welcome to Prism Patient Payment Solutions" body={welcomeEmailBody} note="Sends automatically upon registration via SendGrid on deployment." />
            </div>
          ) : (
            <>
              <div className="alert info" style={{ marginBottom: 20 }}>{"Your first month is free. No credit card required to get started."}</div>
              <div className="form-row">
                <div className="form-group"><label>Your Name *</label><input placeholder="Jane Smith" value={form.contactName} onChange={e => upd("contactName", e.target.value)} /></div>
                <div className="form-group"><label>Practice Name *</label><input placeholder="Sunrise Health Clinic" value={form.practiceName} onChange={e => upd("practiceName", e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Email Address *</label><input type="email" placeholder="admin@practice.com" value={form.email} onChange={e => upd("email", e.target.value)} /></div>
                <div className="form-group"><label>Phone Number *</label><input placeholder="(555) 000-0000" value={form.phone} onChange={e => upd("phone", formatPhone(e.target.value))} /></div>
              </div>
              <div className="form-group">
                <label>Practice Specialty</label>
                <select value={form.specialty} onChange={e => upd("specialty", e.target.value)}>
                  <option value="">Select (optional)</option>
                  <option>Behavioral Health</option><option>Dental</option><option>Chiropractic</option>
                  <option>Physical Therapy</option><option>Occupational Therapy</option><option>Speech Therapy</option>
                  <option>Primary Care</option><option>Specialty Medicine</option><option>Other Healthcare</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Create Password *</label>
                  <input type="password" placeholder="Min. 8 chars, 1 number, 1 special character" value={form.password} onChange={e => upd("password", e.target.value)} />
                  <PasswordStrength password={form.password} />
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input type="password" placeholder="Re-enter your password" value={form.confirmPassword} onChange={e => upd("confirmPassword", e.target.value)} />
                </div>
              </div>
              {error && <div style={{ color: "#DC2626", fontSize: 13, marginBottom: 12 }}>{error}</div>}
              <hr className="divider" />
              <button className="btn btn-primary" style={{ width: "100%" }} disabled={!valid || submitting} onClick={handleSubmit}>
                {submitting ? "Creating your account..." : "Create Account — Get Started Free"}
              </button>
              <div style={{ fontSize: 12, color: "var(--text-light)", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
                By creating an account you agree to our Terms of Service and Privacy Policy. HIPAA BAA included with all accounts.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MARKETING SITE WRAPPER ──

function ProviderMarketingSite({ page, onNavigate, onRegistered }) {
  const marketingPages = ["home", "about", "services", "partners", "faq", "register", "provider-login", "how-it-works", "blog-provider", "contact-provider"];
  const activePage = marketingPages.includes(page) ? page : "home";

  return (
    <>
      <ProviderMarketingNav activePage={activePage} onNavigate={onNavigate} />
      {activePage === "home" && <ProviderHome onNavigate={onNavigate} />}
      {activePage === "about" && <ProviderAbout onNavigate={onNavigate} />}
      {activePage === "services" && <ProviderServices onNavigate={onNavigate} />}
      {activePage === "partners" && <ProviderPartners onNavigate={onNavigate} />}
      {activePage === "faq" && <ProviderFAQ onNavigate={onNavigate} />}
      {activePage === "register" && <ProviderRegister onRegistered={onRegistered} />}
      {activePage === "provider-login" && <ProviderLogin onAuthenticated={onRegistered} />}
      {activePage === "how-it-works" && <HowItWorks onBack={() => onNavigate("home")} onApply={() => onNavigate("register")} />}
      {activePage === "blog-provider" && <ProviderBlog onNavigate={onNavigate} />}
      {activePage === "contact-provider" && <ContactPage audience="provider" />}
      <SiteFooter mode="provider" onNavigate={onNavigate} />
    </>
  );
}

// ─── PATIENT ACCOUNT LOGIN ────────────────────────────────────────────────────

function PatientAccountLogin({ onAuthenticated }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [magicEmail, setMagicEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [forgot, setForgot] = useState(null);
  const [magicLink, setMagicLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const { active: comingSoon, requestAccess } = useComingSoon();

  const handlePasswordSignIn = async () => {
    if (!form.email || !form.password) { setError("Please enter your email and password."); return; }
    if (comingSoon) { requestAccess(); return; }
    setError("");

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const { data: patientData } = await supabase
      .from("patients")
      .select("*")
      .eq("email", form.email)
      .order("created_at", { ascending: false })
      .limit(1);

    const patientRow = patientData?.[0];
    if (!patientRow) {
      await supabase.auth.signOut();
      setError("We couldn't find a patient account for this email. If you're a provider, please use Provider Sign In instead.");
      return;
    }

    onAuthenticated({
      email: form.email,
      firstName: patientRow.first_name || "",
      lastName: patientRow.last_name || "",
    });
  };

  const handleMagicLink = async () => {
    if (!magicEmail) return;
    if (comingSoon) { requestAccess(); return; }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: magicEmail,
    });

    if (otpError) {
      setError(otpError.message);
      return;
    }

    setMagicSent(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(magicLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="main-narrow" style={{ paddingTop: 48 }}>
      <div className="card">
        <div className="card-header">
          <div className="card-icon teal">🔐</div>
          <div>
            <div className="card-title">Patient Account Sign In</div>
            <div className="card-subtitle">Access your payment plans and account information</div>
          </div>
        </div>
        <div className="card-body">
          {forgot ? (
            <ForgotFlow type={forgot} onBack={() => setForgot(null)} />
          ) : !magicSent ? (
            <>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="maria@email.com" value={form.email} onChange={e => upd("email", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="Your password" value={form.password} onChange={e => upd("password", e.target.value)} />
              </div>
              {error && <div style={{ color: "#DC2626", fontSize: 13, marginBottom: 12 }}>{error}</div>}
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <button onClick={() => setForgot("password")} style={{ background: "none", border: "none", color: "var(--teal-dark)", fontSize: 12, cursor: "pointer", fontFamily: "DM Sans, sans-serif", padding: 0 }}>Forgot password?</button>
                <button onClick={() => setForgot("username")} style={{ background: "none", border: "none", color: "var(--teal-dark)", fontSize: 12, cursor: "pointer", fontFamily: "DM Sans, sans-serif", padding: 0 }}>Forgot username?</button>
              </div>
              <button className="btn btn-primary" style={{ width: "100%" }} disabled={!form.email || !form.password} onClick={handlePasswordSignIn}>Sign In</button>
              <AuthDivider />
              <div className="form-group" style={{ marginBottom: 8 }}>
                <label>Or sign in with a magic link</label>
                <input type="email" placeholder="Enter your email" value={magicEmail} onChange={e => setMagicEmail(e.target.value)} />
              </div>
              <button className="btn btn-ghost" style={{ width: "100%" }} disabled={!magicEmail} onClick={handleMagicLink}>Send Magic Link</button>
              <div style={{ fontSize: 12, color: "var(--text-light)", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
                {"Don't have an account? Apply for financing to create one."}
              </div>
            </>
          ) : (
            <div className="success-screen" style={{ padding: "16px 0 24px" }}>
              <div className="success-icon">📬</div>
              <h2>{"Check your email"}</h2>
              <p>{"We sent a sign-in link to:"}<br /><strong style={{ color: "var(--teal-dark)" }}>{magicEmail}</strong></p>
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "var(--radius-sm)", padding: "14px 16px", fontSize: 13, color: "#92400E", marginBottom: 20, textAlign: "left" }}>
                <strong>Demo mode:</strong> Use the link below to simulate clicking the magic link.
              </div>
              <div className="magic-link-box">
                <span className="magic-link-url">{magicLink}</span>
                <button className="copy-btn" onClick={handleCopy}>{copied ? "Copied!" : "Copy"}</button>
              </div>
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={async () => {
                const { data: patientData } = await supabase
                  .from("patients")
                  .select("*")
                  .eq("email", magicEmail)
                  .order("created_at", { ascending: false })
                  .limit(1);
                const patientRow = patientData?.[0];
                if (!patientRow) {
                  await supabase.auth.signOut();
                  setMagicSent(false);
                  setError("We couldn't find a patient account for this email. If you're a provider, please use Provider Sign In instead.");
                  return;
                }
                onAuthenticated({
                  email: magicEmail,
                  firstName: patientRow.first_name || "",
                  lastName: patientRow.last_name || "",
                });
              }}>
                Simulate: Click Magic Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PATIENT ACCOUNT PORTAL ───────────────────────────────────────────────────

const MOCK_PLANS = [
  { id: "plan1", partner: "Prism Patient Financing", originalAmount: 1200, remaining: 840, apr: "0% if paid within 12 mo", term: "12 mo", monthlyPayment: 100, nextDue: "Jun 15, 2026", status: "active" },
  { id: "plan2", partner: "Prism Patient Financing", originalAmount: 2400, remaining: 0, apr: "0% if paid within 12 mo", term: "9 mo", monthlyPayment: 100, nextDue: "—", status: "paid_off" },
];

const MOCK_PAYMENT_HISTORY = [
  { date: "May 15, 2026", plan: "Prism Patient Financing", amount: "$100.00", method: "ACH — Checking ••••4521", status: "approved" },
  { date: "Apr 15, 2026", plan: "Prism Patient Financing", amount: "$100.00", method: "ACH — Checking ••••4521", status: "approved" },
  { date: "Mar 15, 2026", plan: "Prism Patient Financing", amount: "$100.00", method: "ACH — Checking ••••4521", status: "approved" },
  { date: "Feb 15, 2026", plan: "Prism Patient Financing", amount: "$100.00", method: "ACH — Checking ••••4521", status: "approved" },
];

function PatientAccountPortal({ user, onSignOut }) {
  const [acctPage, setAcctPage] = useState("balances");
  const [paymentPlan, setPaymentPlan] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [acctForm, setAcctForm] = useState({ firstName: user.firstName || "Maria", lastName: user.lastName || "Lopez", email: user.email || "", phone: "(555) 012-3456", address: "123 Main Street", city: "Miami", state: "FL", zip: "33101" });
  const [banking, setBanking] = useState({ bankName: "Chase", accountHolder: "Maria Lopez", routingNumber: "021000021", accountNumber: "4521987654", accountType: "checking" });
  const [bankSaved, setBankSaved] = useState(true);
  const [acctSaved, setAcctSaved] = useState(false);

  // Real payment plan data (falls back to MOCK_PLANS for demo accounts with nothing signed yet)
  const [realPlans, setRealPlans] = useState([]);
  const [patientDbId, setPatientDbId] = useState(null);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: patientRow } = await supabase.from("patients").select("id").eq("email", user.email).single();
      if (patientRow?.id) {
        setPatientDbId(patientRow.id);
        const { data: plansData } = await supabase
          .from("payment_plans")
          .select("*")
          .eq("patient_id", patientRow.id)
          .order("created_at", { ascending: false });
        if (plansData) {
          setRealPlans(plansData.map(p => ({
            id: p.id,
            isReal: true,
            partner: "Prism Patient Financing",
            originalAmount: Number(p.original_amount) || 0,
            remaining: Number(p.remaining_balance) || 0,
            apr: "0% if paid within 12 mo",
            term: "—",
            monthlyPayment: Number(p.monthly_payment) || 0,
            nextDue: p.next_due_date ? new Date(p.next_due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
            nextDueRaw: p.next_due_date,
            status: p.status === "active" ? "active" : (p.status || "active"),
            autopayEnabled: p.autopay_enabled,
            autopayAmount: p.autopay_amount,
            autopayUseDueDate: p.autopay_use_due_date,
            autopayChargeDay: p.autopay_charge_day,
            autopayStatus: p.autopay_status || "none",
          })));
        }
      }
      setPlansLoading(false);
    })();
  }, [user.email]);

  const plans = realPlans.length > 0 ? realPlans : MOCK_PLANS;

  const logEmail = async (emailType, subject, body) => {
    await supabase.from("email_log").insert({
      patient_id: patientDbId,
      recipient_email: user.email,
      subject,
      body,
      email_type: emailType,
    });
  };

  // Documents state
  const [docs, setDocs] = useState([
    { id: 1, name: "Insurance_Card.pdf", type: "Insurance Card", date: "May 10, 2026", status: "accepted" },
    { id: 2, name: "Proof_of_Income.pdf", type: "Proof of Income", date: "May 12, 2026", status: "reviewing" },
  ]);
  const [docForm, setDocForm] = useState({ type: "", fileName: "" });
  const [docUploading, setDocUploading] = useState(false);
  const [docSuccess, setDocSuccess] = useState(false);

  // Messages state
  const MOCK_MESSAGES = [
    { id: 1, subject: "Welcome to Prism Patient", from: "Prism Patient Team", date: "May 1, 2026", read: true, thread: [
      { from: "Prism Patient Team", date: "May 1, 2026", body: "Welcome to Prism Patient! Your account is now active. If you have any questions about your payment plan or need assistance, please don't hesitate to reach out. We are here to help." },
    ]},
    { id: 2, subject: "Question about my payment plan", from: "Me", date: "May 14, 2026", read: true, thread: [
      { from: "Me", date: "May 14, 2026", body: "Hi, I wanted to ask about changing my payment due date. Is that something that can be done?" },
      { from: "Prism Patient Team", date: "May 15, 2026", body: "Hi Maria, great question! Yes, we can adjust your payment due date once per plan term. Please let us know what date works best for you and we will make that change." },
      { from: "Me", date: "May 15, 2026", body: "That would be great — can we move it to the 20th of each month?" },
      { from: "Prism Patient Team", date: "May 15, 2026", body: "Done! Your payment due date has been updated to the 20th of each month. Your next payment will be due June 20, 2026." },
    ]},
    { id: 3, subject: "Document verification complete", from: "Prism Patient Team", date: "May 16, 2026", read: false, thread: [
      { from: "Prism Patient Team", date: "May 16, 2026", body: "Your submitted documents have been reviewed and verified. Your account is fully active. No further action is needed on your part." },
    ]},
  ];
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [activeThread, setActiveThread] = useState(null);
  const [composing, setComposing] = useState(false);
  const [newMsg, setNewMsg] = useState({ subject: "", body: "" });
  const [replyBody, setReplyBody] = useState("");
  const [replySent, setReplySent] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const unreadCount = messages.filter(m => !m.read).length;

  // Fetch real message threads from Supabase once we know the patient's DB id.
  useEffect(() => {
    if (!patientDbId) return;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("patient_id", patientDbId)
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        const selfName = `${acctForm.firstName} ${acctForm.lastName}`;
        const byThread = {};
        data.forEach(row => {
          const dateStr = row.created_at
            ? new Date(row.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
            : "";
          const isMe = row.sender === selfName;
          if (!byThread[row.thread_id]) {
            byThread[row.thread_id] = { id: row.thread_id, subject: (row.subject || "").replace(/^Re:\s*/i, ""), read: true, thread: [] };
          }
          byThread[row.thread_id].thread.push({ from: isMe ? "Me" : (row.sender || "Prism Patient Team"), date: dateStr, body: row.body });
          if (row.read === false) byThread[row.thread_id].read = false;
        });
        const grouped = Object.values(byThread)
          .sort((a, b) => Number(b.id) - Number(a.id))
          .map(t => {
            const last = t.thread[t.thread.length - 1];
            return { ...t, from: last.from, date: last.date };
          });
        setMessages(grouped);
      }
    })();
  }, [patientDbId]);
  // Bill Review / Dispute Service state
  const [disputeRequests, setDisputeRequests] = useState([
    { id: 1001, tier: "Standard Dispute Filing", price: 149, eobFile: "EOB_March_Visit.pdf", description: "Charged twice for the same office visit on the same date.", status: "resolved", date: "May 8, 2026", lastUpdate: "Resolved May 14, 2026 — duplicate charge removed, insurer reprocessed claim." },
  ]);
  const [disputeForm, setDisputeForm] = useState({ tier: "", eobFile: "", description: "" });
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState(false);

  const updAcct = (k, v) => setAcctForm(f => ({ ...f, [k]: v }));
  const updBank = (k, v) => setBanking(f => ({ ...f, [k]: v }));
  const maskNum = (n) => n.length > 4 ? "•".repeat(n.length - 4) + n.slice(-4) : n;
  const initials = ((acctForm.firstName?.[0] || "") + (acctForm.lastName?.[0] || "")).toUpperCase() || "P";

  const handlePaySubmit = () => {
    setPaySubmitting(true);
    setTimeout(() => { setPaySubmitting(false); setPaySuccess(true); }, 1500);
  };

  // Embedded "Request Additional Financing" sub-flow (stays within the authenticated portal — no sign-out)
  const [financingStep, setFinancingStep] = useState("choose"); // choose | intake | portal | app-submitted | eob-review | offer-review | esign | offer-accepted
  const [financingIntakeData, setFinancingIntakeData] = useState(null);
  const [financingResult, setFinancingResult] = useState(null);
  const [financingAppId, setFinancingAppId] = useState(null);
  const refetchRealPlans = async () => {
    if (!patientDbId) return;
    const { data: plansData } = await supabase.from("payment_plans").select("*").eq("patient_id", patientDbId).order("created_at", { ascending: false });
    if (plansData) {
      setRealPlans(plansData.map(p => ({
        id: p.id, isReal: true, partner: "Prism Patient Financing",
        originalAmount: Number(p.original_amount) || 0, remaining: Number(p.remaining_balance) || 0,
        apr: "0% if paid within 12 mo", term: "—", monthlyPayment: Number(p.monthly_payment) || 0,
        nextDue: p.next_due_date ? new Date(p.next_due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
        nextDueRaw: p.next_due_date, status: p.status === "active" ? "active" : (p.status || "active"),
        autopayEnabled: p.autopay_enabled, autopayAmount: p.autopay_amount, autopayUseDueDate: p.autopay_use_due_date,
        autopayChargeDay: p.autopay_charge_day, autopayStatus: p.autopay_status || "none",
      })));
    }
  };
  const resetFinancingFlow = () => {
    setFinancingStep("choose"); setFinancingIntakeData(null); setFinancingResult(null); setFinancingAppId(null);
  };

  // Autopay state
  const activeRealPlans = plans.filter(p => p.isReal && p.status === "active");
  const [autopayPlanId, setAutopayPlanId] = useState("");
  const [autopayAmountMode, setAutopayAmountMode] = useState("minimum");
  const [autopayCustomAmount, setAutopayCustomAmount] = useState("");
  const [autopayTiming, setAutopayTiming] = useState("due_date");
  const [autopayDay, setAutopayDay] = useState("");
  const [autopaySubmitting, setAutopaySubmitting] = useState(false);
  const [autopayError, setAutopayError] = useState("");
  const [autopayResultMsg, setAutopayResultMsg] = useState("");

  const autopayPlan = plans.find(p => p.id === autopayPlanId) || activeRealPlans[0] || null;

  const handleAutopaySetup = async () => {
    setAutopayError("");
    if (!autopayPlan || !autopayPlan.isReal) { setAutopayError("Autopay is only available on an active financed plan."); return; }

    const amount = autopayAmountMode === "minimum" ? autopayPlan.monthlyPayment : parseFloat(autopayCustomAmount);
    if (!amount || isNaN(amount)) { setAutopayError("Please enter a valid payment amount."); return; }
    if (amount < autopayPlan.monthlyPayment) { setAutopayError(`Custom amount must be at least the minimum payment of $${autopayPlan.monthlyPayment}.`); return; }

    let chargeDay = null;
    let needsReview = false;
    const dueDay = autopayPlan.nextDueRaw ? new Date(autopayPlan.nextDueRaw + "T00:00:00").getDate() : null;
    if (autopayTiming === "custom_day") {
      chargeDay = parseInt(autopayDay, 10);
      if (!chargeDay || chargeDay < 1 || chargeDay > 28) { setAutopayError("Please choose a day between 1 and 28."); return; }
      needsReview = dueDay != null && chargeDay > dueDay;
    }

    setAutopaySubmitting(true);
    const newStatus = needsReview ? "pending_review" : "active";
    const { error } = await supabase.from("payment_plans").update({
      autopay_enabled: !needsReview,
      autopay_amount: amount,
      autopay_use_due_date: autopayTiming === "due_date",
      autopay_charge_day: autopayTiming === "custom_day" ? chargeDay : null,
      autopay_status: newStatus,
    }).eq("id", autopayPlan.id);

    if (error) { setAutopaySubmitting(false); setAutopayError(error.message); return; }

    setRealPlans(prev => prev.map(p => p.id === autopayPlan.id ? { ...p, autopayEnabled: !needsReview, autopayAmount: amount, autopayUseDueDate: autopayTiming === "due_date", autopayChargeDay: chargeDay, autopayStatus: newStatus } : p));

    if (needsReview) {
      await logEmail(
        "autopay_pending_review",
        "Your Autopay Request is Under Review",
        `Hi, we've received your request to set up autopay of $${amount} charged on day ${chargeDay} of each month. Since this falls after your plan's current due date, a Prism Patient team member will review it and a decision will be reached within 1-2 business days.`
      );
      setAutopayResultMsg("Your autopay request needs a quick review since the day you chose falls after your due date. You'll get a decision within 1-2 business days.");
    } else {
      const timingText = autopayTiming === "due_date" ? "your plan's due date each month" : `day ${chargeDay} of each month`;
      await logEmail(
        "autopay_enabled",
        "Autopay Confirmed",
        `Hi, autopay has been set up on your Prism Patient payment plan for $${amount}, charged on ${timingText}.`
      );
      setAutopayResultMsg("Autopay is set up and active.");
    }
    setAutopaySubmitting(false);
  };

  const handleAutopayDisable = async (plan) => {
    setAutopaySubmitting(true);
    await supabase.from("payment_plans").update({ autopay_enabled: false, autopay_status: "none" }).eq("id", plan.id);
    setRealPlans(prev => prev.map(p => p.id === plan.id ? { ...p, autopayEnabled: false, autopayStatus: "none" } : p));
    await logEmail("autopay_disabled", "Autopay Turned Off", `Hi, autopay has been turned off for your Prism Patient payment plan. You can re-enable it any time from your account.`);
    setAutopayResultMsg("Autopay has been turned off.");
    setAutopaySubmitting(false);
  };

  const navItems = [["balances", "💳", "Balances"], ["payments", "💰", "Payments"], ["account", "👤", "Account Info"], ["financing", "➕", "Request Financing"], ["documents", "📎", "Documents"], ["billreview", "🔍", "Bill Review"], ["messages", "💬", "Messages"]];

  return (
    <>
      <div className="portal-header">
        <div className="portal-user">
          <div className="portal-avatar">{initials}</div>
          <div>
            <div className="portal-name">{acctForm.firstName} {acctForm.lastName}</div>
            <div className="portal-email">{user.email}</div>
          </div>
        </div>
        <button className="btn btn-ghost" style={{ fontSize: 13, padding: "8px 16px" }} onClick={onSignOut}>Sign Out</button>
      </div>

      <div style={{ background: "var(--white)", borderBottom: "1px solid var(--border)", padding: "0 24px", display: "flex", gap: 4, overflowX: "auto" }}>
        {navItems.map(([id, icon, label]) => (
          <button key={id} onClick={() => { setAcctPage(id); setPaymentPlan(null); setPaySuccess(false); if (id === "messages") setMessages(msgs => msgs.map(m => ({ ...m, read: true }))); }} style={{ padding: "14px 18px", border: "none", background: "transparent", fontFamily: "DM Sans, sans-serif", fontSize: 14, fontWeight: 500, color: acctPage === id ? "var(--teal-dark)" : "var(--text-secondary)", cursor: "pointer", borderBottom: `2px solid ${acctPage === id ? "var(--teal)" : "transparent"}`, marginBottom: -1, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
            {icon} {label}
            {id === "messages" && unreadCount > 0 && (
              <span style={{ background: "var(--coral)", color: "white", fontSize: 10, fontWeight: 700, borderRadius: "100px", padding: "1px 6px", lineHeight: 1.6 }}>{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="main-narrow">

        {acctPage === "balances" && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 4 }}>Your Payment Plans</div>
              <div className="section-sub">All active and completed financing through Prism Patient.</div>
            </div>
            {plans.map(plan => (
              <div key={plan.id} className="card" style={{ marginBottom: 16 }}>
                <div style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 16 }}>{plan.partner}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{plan.apr} APR · {plan.term}</div>
                    </div>
                    <span className={`status-pill ${plan.status === "active" ? "approved" : "reviewing"}`}>
                      {plan.status === "active" ? "✓ Active" : "✓ Paid Off"}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: plan.status === "active" ? 16 : 0 }}>
                    {[["Original Amount", `$${plan.originalAmount.toLocaleString()}`], ["Remaining Balance", plan.remaining > 0 ? `$${plan.remaining.toLocaleString()}` : "—"], ["Monthly Payment", plan.remaining > 0 ? `$${plan.monthlyPayment}` : "—"]].map(([l, v]) => (
                      <div key={l} style={{ background: "var(--mist2)", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 15, color: "var(--teal-dark)" }}>{v}</div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {plan.status === "active" && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Next payment due: <strong style={{ color: "var(--text-primary)" }}>{plan.nextDue}</strong></div>
                      <button className="btn btn-primary" style={{ padding: "8px 18px", fontSize: 13 }} onClick={() => { setAcctPage("payments"); setPaymentPlan(plan); }}>Make a Payment</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={() => setAcctPage("financing")}>+ Request Additional Financing</button>
          </>
        )}

        {acctPage === "payments" && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 4 }}>Payments</div>
              <div className="section-sub">Make a payment or view your payment history.</div>
            </div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div className="card-icon teal">💰</div>
                <div><div className="card-title">Make a Payment</div><div className="card-subtitle">ACH from your bank account on file</div></div>
              </div>
              <div className="card-body">
                {paySuccess ? (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                    <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Payment submitted</div>
                    <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>{"Your payment will be processed within 1-2 business days."}</div>
                    <button className="btn btn-ghost" onClick={() => { setPaySuccess(false); setPayAmount(""); setPaymentPlan(null); }}>Make Another Payment</button>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Select Plan</label>
                      <select value={paymentPlan?.id || ""} onChange={e => setPaymentPlan(plans.find(p => p.id === e.target.value) || null)}>
                        <option value="">Select a plan...</option>
                        {plans.filter(p => p.status === "active").map(p => (
                          <option key={p.id} value={p.id}>{p.partner} — ${p.remaining.toLocaleString()} remaining</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Payment Amount ($)</label>
                      <div className="input-prefix">
                        <span>$</span>
                        <input type="text" inputMode="numeric" placeholder={paymentPlan ? String(paymentPlan.monthlyPayment) : "0"} value={payAmount} onChange={e => setPayAmount(formatIncome(e.target.value))} />
                      </div>
                      {paymentPlan && <div className="helper-text">Minimum payment: ${paymentPlan.monthlyPayment} · Remaining: ${paymentPlan.remaining.toLocaleString()}</div>}
                    </div>
                    <div style={{ background: "var(--mist)", border: "1px solid #B3EEE9", borderRadius: "var(--radius-sm)", padding: "14px 16px", fontSize: 14, marginBottom: 20 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Payment method</div>
                      <div style={{ color: "var(--slate)" }}>ACH — {banking.bankName} Checking ••••{banking.accountNumber.slice(-4)}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>To update your bank account, go to Account Info.</div>
                    </div>
                    <hr className="divider" />
                    <button className="btn btn-primary" style={{ width: "100%" }} disabled={!paymentPlan || !payAmount || paySubmitting} onClick={handlePaySubmit}>
                      {paySubmitting ? "Processing..." : "Submit Payment"}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div className="card-icon teal">🔁</div>
                <div><div className="card-title">Autopay</div><div className="card-subtitle">Automatically charge your payment each month</div></div>
              </div>
              <div className="card-body">
                {activeRealPlans.length === 0 ? (
                  <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>Autopay becomes available once you have an active financed plan.</div>
                ) : (
                  <>
                    {autopayPlan?.autopayStatus === "active" && (
                      <div style={{ background: "#E6FBF9", border: "1px solid #B3EEE9", borderRadius: "var(--radius-sm)", padding: "14px 16px", fontSize: 14, marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>✓ Autopay is active</div>
                        <div style={{ color: "var(--slate)" }}>${autopayPlan.autopayAmount} charged {autopayPlan.autopayUseDueDate ? "on your due date" : `on day ${autopayPlan.autopayChargeDay}`} each month.</div>
                        <button className="btn btn-ghost" style={{ marginTop: 10, fontSize: 13, padding: "6px 14px" }} disabled={autopaySubmitting} onClick={() => handleAutopayDisable(autopayPlan)}>Turn Off Autopay</button>
                      </div>
                    )}
                    {autopayPlan?.autopayStatus === "pending_review" && (
                      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "var(--radius-sm)", padding: "14px 16px", fontSize: 14, marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>⏳ Autopay request under review</div>
                        <div style={{ color: "var(--slate)" }}>Requested ${autopayPlan.autopayAmount} on day {autopayPlan.autopayChargeDay} of each month. A Prism Patient team member will make a decision within 1-2 business days.</div>
                      </div>
                    )}
                    {(!autopayPlan || autopayPlan.autopayStatus === "none" || autopayPlan.autopayStatus === "rejected") && (
                      <>
                        {autopayPlan?.autopayStatus === "rejected" && (
                          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "var(--radius-sm)", padding: "14px 16px", fontSize: 14, marginBottom: 16, color: "#991B1B" }}>
                            Your previous autopay day request wasn't approved. You can submit a new request below.
                          </div>
                        )}
                        {activeRealPlans.length > 1 && (
                          <div className="form-group">
                            <label>Plan</label>
                            <select value={autopayPlanId} onChange={e => setAutopayPlanId(e.target.value)}>
                              {activeRealPlans.map(p => <option key={p.id} value={p.id}>{p.partner} — ${p.remaining.toLocaleString()} remaining</option>)}
                            </select>
                          </div>
                        )}
                        <div className="form-group">
                          <label>Amount</label>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400, fontSize: 14 }}>
                              <input type="radio" checked={autopayAmountMode === "minimum"} onChange={() => setAutopayAmountMode("minimum")} />
                              Minimum payment (${autopayPlan?.monthlyPayment || 0}/mo)
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400, fontSize: 14 }}>
                              <input type="radio" checked={autopayAmountMode === "custom"} onChange={() => setAutopayAmountMode("custom")} />
                              Custom amount
                            </label>
                            {autopayAmountMode === "custom" && (
                              <div className="input-prefix" style={{ maxWidth: 200 }}>
                                <span>$</span>
                                <input type="text" inputMode="numeric" placeholder={String(autopayPlan?.monthlyPayment || 0)} value={autopayCustomAmount} onChange={e => setAutopayCustomAmount(formatIncome(e.target.value))} />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="form-group">
                          <label>When to charge</label>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400, fontSize: 14 }}>
                              <input type="radio" checked={autopayTiming === "due_date"} onChange={() => setAutopayTiming("due_date")} />
                              On my plan's due date each month
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400, fontSize: 14 }}>
                              <input type="radio" checked={autopayTiming === "custom_day"} onChange={() => setAutopayTiming("custom_day")} />
                              On a day I choose
                            </label>
                            {autopayTiming === "custom_day" && (
                              <input type="text" inputMode="numeric" placeholder="Day of month (1-28)" style={{ maxWidth: 200 }} value={autopayDay} onChange={e => setAutopayDay(e.target.value.replace(/\D/g, ""))} />
                            )}
                          </div>
                          <div className="helper-text">If the day you choose falls after your plan's due date, a Prism Patient team member will need to review and approve it first.</div>
                        </div>
                        {autopayError && <div style={{ color: "#DC2626", fontSize: 13, marginBottom: 12 }}>{autopayError}</div>}
                        <button className="btn btn-primary" style={{ width: "100%" }} disabled={autopaySubmitting} onClick={handleAutopaySetup}>
                          {autopaySubmitting ? "Setting up..." : "Set Up Autopay"}
                        </button>
                      </>
                    )}
                    {autopayResultMsg && <div style={{ fontSize: 13, color: "var(--teal-dark)", marginTop: 12 }}>{autopayResultMsg}</div>}
                  </>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-icon teal">📋</div>
                <div><div className="card-title">Payment History</div><div className="card-subtitle">All past payments across your plans</div></div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="patient-table">
                  <thead><tr><th>Date</th><th>Plan</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
                  <tbody>
                    {MOCK_PAYMENT_HISTORY.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: 13, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{p.date}</td>
                        <td style={{ fontSize: 13 }}>{p.plan}</td>
                        <td style={{ fontWeight: 600 }}>{p.amount}</td>
                        <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{p.method}</td>
                        <td><span className="status-pill approved">✓ Paid</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {acctPage === "account" && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 4 }}>Account Information</div>
              <div className="section-sub">Update your personal details and banking information.</div>
            </div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div className="card-icon teal">👤</div>
                <div><div className="card-title">Personal Details</div><div className="card-subtitle">Your contact and address information</div></div>
              </div>
              <div className="card-body">
                {acctSaved && <div className="alert success" style={{ marginBottom: 16 }}>Changes saved.</div>}
                <div className="form-row">
                  <div className="form-group"><label>First Name</label><input value={acctForm.firstName} onChange={e => updAcct("firstName", e.target.value)} /></div>
                  <div className="form-group"><label>Last Name</label><input value={acctForm.lastName} onChange={e => updAcct("lastName", e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Email Address</label><input type="email" value={acctForm.email} onChange={e => updAcct("email", e.target.value)} /></div>
                  <div className="form-group"><label>Phone Number</label><input value={acctForm.phone} onChange={e => updAcct("phone", formatPhone(e.target.value))} /></div>
                </div>
                <div className="form-group"><label>Street Address</label><input value={acctForm.address} onChange={e => updAcct("address", e.target.value)} /></div>
                <div className="form-row">
                  <div className="form-group"><label>City</label><input value={acctForm.city} onChange={e => updAcct("city", e.target.value)} /></div>
                  <div className="form-group"><label>State</label>
                    <select value={acctForm.state} onChange={e => updAcct("state", e.target.value)}>
                      {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ maxWidth: 180 }}><label>ZIP Code</label><input value={acctForm.zip} onChange={e => updAcct("zip", e.target.value)} maxLength={5} /></div>
                <hr className="divider" />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" onClick={() => { setAcctSaved(true); setTimeout(() => setAcctSaved(false), 3000); }}>Save Changes</button>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <div className="card-icon teal">🏦</div>
                <div><div className="card-title">ACH Payment Method</div><div className="card-subtitle">Bank account used for monthly payments</div></div>
              </div>
              <div className="card-body">
                <div className="alert info" style={{ marginBottom: 20 }}>{"ACH is the only available payment method at this time. Additional options coming soon."}</div>
                <div className="form-row">
                  <div className="form-group"><label>Bank Name</label><input value={banking.bankName} onChange={e => updBank("bankName", e.target.value)} readOnly={bankSaved} /></div>
                  <div className="form-group"><label>Account Holder Name</label><input value={banking.accountHolder} onChange={e => updBank("accountHolder", e.target.value)} readOnly={bankSaved} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Routing Number</label><input className="input-sensitive" value={bankSaved ? maskNum(banking.routingNumber) : banking.routingNumber} onChange={e => updBank("routingNumber", e.target.value)} maxLength={9} readOnly={bankSaved} /></div>
                  <div className="form-group"><label>Account Number</label><input className="input-sensitive" value={bankSaved ? maskNum(banking.accountNumber) : banking.accountNumber} onChange={e => updBank("accountNumber", e.target.value)} readOnly={bankSaved} /></div>
                </div>
                <div className="form-group" style={{ maxWidth: 220 }}>
                  <label>Account Type</label>
                  <select value={banking.accountType} onChange={e => updBank("accountType", e.target.value)} disabled={bankSaved}>
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                  </select>
                </div>
                <div className="helper-text" style={{ marginBottom: 16 }}>Account numbers are masked for security. Click Edit to update.</div>
                <hr className="divider" />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  {bankSaved && <button className="btn btn-ghost" onClick={() => setBankSaved(false)}>Edit</button>}
                  {!bankSaved && (
                    <>
                      <button className="btn btn-ghost" onClick={() => setBankSaved(true)}>Cancel</button>
                      <button className="btn btn-primary" disabled={!banking.bankName || !banking.routingNumber || !banking.accountNumber} onClick={() => setBankSaved(true)}>Save Banking Info</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {acctPage === "financing" && (
          <>
            {financingStep === "choose" && (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div className="section-title" style={{ marginBottom: 4 }}>Request Additional Financing</div>
                  <div className="section-sub">Apply for a new payment plan for upcoming ABA, behavioral health, or mental health care expenses.</div>
                </div>
                <div className="card">
                  <div className="card-body">
                    <div className="alert info" style={{ marginBottom: 20 }}>{"Checking your options does not affect your credit score."}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
                      {[["💊", "New or upcoming treatment", "Apply for financing for a new episode of care or upcoming procedure."], ["🏥", "Existing balance", "Finance an outstanding balance with your current provider."], ["🔄", "Refinance existing plan", "Request different terms on an existing Prism Patient payment plan."]].map(([icon, title, desc]) => (
                        <div key={title} style={{ display: "flex", gap: 14, padding: "18px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer", background: "var(--white)", transition: "all 0.2s" }} onClick={() => setFinancingStep("intake")}>
                          <div style={{ fontSize: 28, flexShrink: 0 }}>{icon}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{title}</div>
                            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{desc}</div>
                          </div>
                          <div style={{ marginLeft: "auto", color: "var(--teal)", fontSize: 18, alignSelf: "center" }}>→</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center", lineHeight: 1.6 }}>
                      Your new application stays in your account — your existing plans will not be affected, and you won't be signed out.
                    </div>
                  </div>
                </div>
              </>
            )}

            {financingStep === "intake" && (
              <>
                <button onClick={() => setFinancingStep("choose")} style={{ background: "none", border: "none", color: "var(--teal-dark)", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 500, padding: 0, marginBottom: 16 }}>{"← Back"}</button>
                <IntakeForm
                  prefill={{ firstName: acctForm.firstName, lastName: acctForm.lastName, phone: acctForm.phone, email: user.email }}
                  hideContactFields
                  onSubmit={(form) => { setFinancingIntakeData(form); setFinancingStep("portal"); }}
                />
              </>
            )}

            {financingStep === "portal" && financingIntakeData && (
              <PatientPortal
                embedded
                user={user}
                intakeData={financingIntakeData}
                onApplicationCreated={(appId) => setFinancingAppId(appId)}
                onApprovalResult={(result) => { setFinancingResult(result); setFinancingStep("app-submitted"); }}
                onEobReview={(result) => { setFinancingResult(result); setFinancingStep("eob-review"); }}
                onSignOut={resetFinancingFlow}
              />
            )}

            {financingStep === "app-submitted" && (
              <AppSubmitted embedded intakeData={financingIntakeData} onSimulateDecision={() => setFinancingStep("offer-review")} onSignOut={resetFinancingFlow} />
            )}

            {financingStep === "eob-review" && (
              <EobUnderReview embedded result={financingResult} intakeData={financingIntakeData} onCheckStatus={() => setFinancingStep("offer-review")} onSignOut={resetFinancingFlow} />
            )}

            {financingStep === "offer-review" && (
              <OfferReview embedded result={financingResult} intakeData={financingIntakeData} onAccept={() => setFinancingStep("esign")} onDecline={resetFinancingFlow} onSignOut={resetFinancingFlow} />
            )}

            {financingStep === "esign" && (
              <ESignDoc result={financingResult} intakeData={financingIntakeData} patientEmail={user.email} applicationId={financingAppId} patientDbId={patientDbId} onSigned={async () => { await refetchRealPlans(); setFinancingStep("offer-accepted"); }} onBack={() => setFinancingStep("offer-review")} />
            )}

            {financingStep === "offer-accepted" && (
              <OfferAccepted result={financingResult} intakeData={financingIntakeData} onStartOver={() => { resetFinancingFlow(); setAcctPage("balances"); }} />
            )}
          </>
        )}

        {acctPage === "documents" && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 4 }}>Documents</div>
              <div className="section-sub">Upload and manage documents related to your account or financing application.</div>
            </div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div className="card-icon teal">📤</div>
                <div><div className="card-title">Upload a Document</div><div className="card-subtitle">Accepted formats: PDF, JPG, PNG — max 10MB</div></div>
              </div>
              <div className="card-body">
                {docSuccess ? (
                  <div style={{ textAlign: "center", padding: "12px 0" }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Document uploaded successfully</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>{"Our team will review it within 1 business day."}</div>
                    <button className="btn btn-ghost" onClick={() => { setDocSuccess(false); setDocForm({ type: "", fileName: "" }); }}>Upload Another</button>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Document Type *</label>
                      <select value={docForm.type} onChange={e => setDocForm(f => ({ ...f, type: e.target.value }))}>
                        <option value="">Select document type...</option>
                        <option>Photo ID</option>
                        <option>Proof of Income</option>
                        <option>Insurance Card</option>
                        <option>Explanation of Benefits (EOB)</option>
                        <option>Medical Bill or Statement</option>
                        <option>Bank Statement</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Select File *</label>
                      <div style={{ border: "2px dashed var(--border)", borderRadius: "var(--radius-sm)", padding: "28px 20px", textAlign: "center", cursor: "pointer", background: "var(--mist2)" }}
                        onClick={() => { if (docForm.type) { const mockName = docForm.type.replace(/\s+/g, "_") + "_" + Date.now() + ".pdf"; setDocForm(f => ({ ...f, fileName: mockName })); } }}>
                        {docForm.fileName ? (
                          <div><div style={{ fontSize: 24, marginBottom: 6 }}>📄</div><div style={{ fontWeight: 600, fontSize: 14 }}>{docForm.fileName}</div><div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Click to change file</div></div>
                        ) : (
                          <div><div style={{ fontSize: 32, marginBottom: 8 }}>📎</div><div style={{ fontWeight: 500, fontSize: 14, color: "var(--text-secondary)" }}>Click to select a file</div><div style={{ fontSize: 12, color: "var(--text-light)", marginTop: 4 }}>{docForm.type ? "Ready to select" : "Select a document type first"}</div></div>
                        )}
                      </div>
                      <div className="helper-text">Demo mode: clicking selects a mock file. On deployment, this opens your file picker.</div>
                    </div>
                    <hr className="divider" />
                    <button className="btn btn-primary" style={{ width: "100%" }}
                      disabled={!docForm.type || !docForm.fileName || docUploading}
                      onClick={() => {
                        setDocUploading(true);
                        setTimeout(() => {
                          const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
                          setDocs(d => [...d, { id: Date.now(), name: docForm.fileName, type: docForm.type, date: today, status: "reviewing" }]);
                          setDocUploading(false);
                          setDocSuccess(true);
                        }, 1200);
                      }}>
                      {docUploading ? "Uploading..." : "Upload Document"}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <div className="card-icon teal">📁</div>
                <div><div className="card-title">Your Documents</div><div className="card-subtitle">{docs.length} document{docs.length !== 1 ? "s" : ""} on file</div></div>
              </div>
              {docs.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>No documents uploaded yet.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="patient-table">
                    <thead><tr><th>Document</th><th>Type</th><th>Date</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {docs.map(doc => (
                        <tr key={doc.id}>
                          <td style={{ fontWeight: 500, fontSize: 13 }}>{"📄 " + doc.name}</td>
                          <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{doc.type}</td>
                          <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{doc.date}</td>
                          <td><span className={"status-pill " + (doc.status === "accepted" ? "approved" : doc.status === "reviewing" ? "reviewing" : "pending")}>{doc.status === "accepted" ? "✓ Accepted" : doc.status === "reviewing" ? "◎ Under Review" : "○ Uploaded"}</span></td>
                          <td><button onClick={() => setDocs(d => d.filter(x => x.id !== doc.id))} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 16 }}>🗑</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {acctPage === "billreview" && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 4 }}>Bill Review & Dispute Service</div>
              <div className="section-sub">{"Think there's an error on your bill? Our team will review your EOB and help you dispute incorrect charges."}</div>
            </div>

            {disputeSuccess ? (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="success-screen" style={{ paddingBottom: 32 }}>
                  <div className="success-icon">✅</div>
                  <h2>Request submitted</h2>
                  <p>{"We've received your EOB and request. Our team will review it and follow up by email with next steps."}</p>
                  <button className="btn btn-ghost" onClick={() => { setDisputeSuccess(false); setDisputeForm({ tier: "", eobFile: "", description: "" }); }}>Submit Another Request</button>
                </div>
              </div>
            ) : (
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                  <div className="card-icon teal">🔍</div>
                  <div><div className="card-title">Submit a Bill Review Request</div><div className="card-subtitle">Attach your EOB and tell us what looks wrong</div></div>
                </div>
                <div className="card-body">
                  <div className="section-sub" style={{ marginBottom: 16 }}>Choose the level of service you need:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                    {DISPUTE_SERVICE_TIERS.map(tier => (
                      <div key={tier.id} onClick={() => setDisputeForm(f => ({ ...f, tier: tier.id }))} style={{ border: `2px solid ${disputeForm.tier === tier.id ? "var(--teal)" : "var(--border)"}`, borderRadius: "var(--radius-sm)", padding: "16px 18px", cursor: "pointer", background: disputeForm.tier === tier.id ? "#E6FBF9" : "var(--white)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 12 }}>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{tier.name}</div>
                          <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 18, color: "var(--teal-dark)", whiteSpace: "nowrap" }}>${tier.price}</div>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 10 }}>{tier.desc}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {tier.includes.map((inc, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--slate)" }}>
                              <span style={{ color: "var(--teal)", fontWeight: 700 }}>✓</span>{inc}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="form-group">
                    <label>Attach EOB or Bill *</label>
                    <div style={{ border: "2px dashed var(--border)", borderRadius: "var(--radius-sm)", padding: "24px 20px", textAlign: "center", cursor: "pointer", background: "var(--mist2)" }}
                      onClick={() => setDisputeForm(f => ({ ...f, eobFile: `EOB_Dispute_${Date.now()}.pdf` }))}>
                      {disputeForm.eobFile ? (
                        <div><div style={{ fontSize: 22, marginBottom: 4 }}>📄</div><div style={{ fontWeight: 600, fontSize: 14 }}>{disputeForm.eobFile}</div><div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>Click to change file</div></div>
                      ) : (
                        <div><div style={{ fontSize: 28, marginBottom: 6 }}>📎</div><div style={{ fontWeight: 500, fontSize: 13, color: "var(--text-secondary)" }}>Click to attach your EOB or bill</div></div>
                      )}
                    </div>
                    <div className="helper-text">Demo mode: clicking selects a mock file.</div>
                  </div>

                  <div className="form-group">
                    <label>What looks wrong? *</label>
                    <textarea placeholder="Briefly describe the issue — e.g. duplicate charge, incorrect amount, service not received..." value={disputeForm.description} onChange={e => setDisputeForm(f => ({ ...f, description: e.target.value }))} style={{ minHeight: 100, resize: "vertical", lineHeight: 1.6 }} />
                  </div>

                  <hr className="divider" />
                  <button className="btn btn-primary" style={{ width: "100%" }}
                    disabled={!disputeForm.tier || !disputeForm.eobFile || !disputeForm.description || disputeSubmitting}
                    onClick={() => {
                      setDisputeSubmitting(true);
                      setTimeout(() => {
                        const tier = DISPUTE_SERVICE_TIERS.find(t => t.id === disputeForm.tier);
                        const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
                        setDisputeRequests(reqs => [{ id: Date.now(), tier: tier.name, price: tier.price, eobFile: disputeForm.eobFile, description: disputeForm.description, status: "submitted", date: today, lastUpdate: "Submitted — our team will review within 1-2 business days." }, ...reqs]);
                        setDisputeSubmitting(false);
                        setDisputeSuccess(true);
                      }, 1200);
                    }}>
                    {disputeSubmitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <div className="card-icon teal">📋</div>
                <div><div className="card-title">Your Requests</div><div className="card-subtitle">{disputeRequests.length} request{disputeRequests.length !== 1 ? "s" : ""} on file</div></div>
              </div>
              {disputeRequests.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>No bill review requests yet.</div>
              ) : (
                <div>
                  {disputeRequests.map(req => (
                    <div key={req.id} style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{req.tier} — ${req.price}</div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>Submitted {req.date} · {req.eobFile}</div>
                        </div>
                        <span className={`status-pill ${req.status === "resolved" ? "approved" : req.status === "submitted" ? "pending" : "reviewing"}`}>
                          {req.status === "resolved" ? "✓ Resolved" : req.status === "submitted" ? "○ Submitted" : "◎ Under Review"}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--slate)", lineHeight: 1.6, marginBottom: 8 }}>{req.description}</div>
                      <div style={{ background: "var(--mist)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "var(--text-secondary)" }}>{req.lastUpdate}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {acctPage === "messages" && (
          <>
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="section-title" style={{ marginBottom: 4 }}>Messages</div>
                <div className="section-sub">Send and receive messages with the Prism Patient support team.</div>
              </div>
              {!composing && !activeThread && (
                <button className="btn btn-primary" style={{ padding: "8px 18px", fontSize: 13 }} onClick={() => { setComposing(true); setNewMsg({ subject: "", body: "" }); }}>+ New Message</button>
              )}
            </div>
            {composing && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                  <div className="card-icon teal">✏️</div>
                  <div><div className="card-title">New Message</div><div className="card-subtitle">Our team typically responds within 1 business day</div></div>
                </div>
                <div className="card-body">
                  <div className="form-group"><label>Subject *</label><input placeholder="e.g. Question about my payment plan" value={newMsg.subject} onChange={e => setNewMsg(m => ({ ...m, subject: e.target.value }))} /></div>
                  <div className="form-group"><label>Message *</label><textarea placeholder="Type your message here..." value={newMsg.body} onChange={e => setNewMsg(m => ({ ...m, body: e.target.value }))} style={{ minHeight: 120, resize: "vertical", lineHeight: 1.6 }} /></div>
                  <hr className="divider" />
                  <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <button className="btn btn-ghost" onClick={() => setComposing(false)}>Cancel</button>
                    <button className="btn btn-primary" disabled={!newMsg.subject || !newMsg.body || sendingMsg}
                      onClick={async () => {
                        setSendingMsg(true);
                        const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
                        const threadId = Date.now();
                        await supabase.from("messages").insert({
                          patient_id: patientDbId,
                          provider_id: null,
                          thread_id: threadId,
                          subject: newMsg.subject,
                          body: newMsg.body,
                          sender: `${acctForm.firstName} ${acctForm.lastName}`,
                          read: true,
                        });
                        const msg = { id: threadId, subject: newMsg.subject, from: "Me", date: today, read: true, thread: [{ from: "Me", date: today, body: newMsg.body }] };
                        setMessages(msgs => [msg, ...msgs]);
                        setSendingMsg(false);
                        setComposing(false);
                        setActiveThread(msg);
                      }}>{sendingMsg ? "Sending..." : "Send Message"}</button>
                  </div>
                </div>
              </div>
            )}
            {activeThread && !composing && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                    <button onClick={() => { setActiveThread(null); setReplyBody(""); setReplySent(false); }} style={{ background: "none", border: "none", color: "var(--teal-dark)", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 500, padding: 0 }}>{"← Back"}</button>
                    <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 600, fontSize: 16 }}>{activeThread.subject}</div>
                  </div>
                </div>
                <div style={{ padding: "0 28px" }}>
                  {activeThread.thread.map((msg, i) => (
                    <div key={i} style={{ padding: "20px 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: msg.from === "Me" ? "var(--teal)" : "var(--coral)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 13, fontWeight: 700 }}>
                          {msg.from === "Me" ? (acctForm.firstName[0] || "M") : "R"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{msg.from === "Me" ? acctForm.firstName + " " + acctForm.lastName : "Prism Patient Support Team"}</div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{msg.date}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.8, paddingLeft: 42 }}>{msg.body}</div>
                    </div>
                  ))}
                </div>
                <div className="card-body" style={{ paddingTop: 16 }}>
                  {replySent ? (
                    <div className="alert success">{"Reply sent. Our team will respond within 1 business day."}</div>
                  ) : (
                    <>
                      <div className="form-group"><label>Reply</label><textarea placeholder="Type your reply..." value={replyBody} onChange={e => setReplyBody(e.target.value)} style={{ minHeight: 90, resize: "vertical", lineHeight: 1.6 }} /></div>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button className="btn btn-primary" disabled={!replyBody.trim() || sendingMsg}
                          onClick={async () => {
                            setSendingMsg(true);
                            const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
                            await supabase.from("messages").insert({
                              patient_id: patientDbId,
                              provider_id: null,
                              thread_id: activeThread.id,
                              subject: `Re: ${activeThread.subject}`,
                              body: replyBody,
                              sender: `${acctForm.firstName} ${acctForm.lastName}`,
                              read: true,
                            });
                            const updated = { ...activeThread, thread: [...activeThread.thread, { from: "Me", date: today, body: replyBody }] };
                            setMessages(msgs => msgs.map(m => m.id === activeThread.id ? updated : m));
                            setActiveThread(updated);
                            setReplyBody("");
                            setSendingMsg(false);
                            setReplySent(true);
                          }}>{sendingMsg ? "Sending..." : "Send Reply"}</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            {!activeThread && !composing && (
              <div className="card">
                <div className="card-header">
                  <div className="card-icon teal">📬</div>
                  <div><div className="card-title">Inbox</div><div className="card-subtitle">{messages.length} conversation{messages.length !== 1 ? "s" : ""}</div></div>
                </div>
                {messages.length === 0 ? (
                  <div style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>No messages yet.</div>
                ) : (
                  <div>
                    {messages.map(msg => (
                      <div key={msg.id}
                        onClick={() => { setActiveThread(msg); setMessages(msgs => msgs.map(m => m.id === msg.id ? { ...m, read: true } : m)); setReplySent(false); setReplyBody(""); }}
                        style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: msg.read ? "var(--white)" : "#E6FBF9", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: msg.from === "Me" ? "var(--teal)" : "var(--coral)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                          {msg.from === "Me" ? (acctForm.firstName[0] || "M") : "R"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                            <div style={{ fontWeight: msg.read ? 500 : 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.subject}</div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{msg.date}</div>
                          </div>
                          <div style={{ fontSize: 13, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                            {msg.from === "Me" ? "Me" : "Prism Patient Team"}{": "}{msg.thread[msg.thread.length - 1].body.slice(0, 60)}{"..."}
                          </div>
                        </div>
                        {!msg.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--teal)", flexShrink: 0 }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
// ── INTERNAL ADMIN (hidden route: ?admin=1) ──
// NOTE: this is a simple shared-passcode gate for internal use during the demo/beta phase.
// It is not real authentication and should be replaced with proper admin auth before real patient data flows.
// ─── ADMIN AUTH ───────────────────────────────────────────────────────────────
// Username + bcrypt-style hashed passwords. To add a user: generate a hash with
// the hashAdminPassword() utility below, paste the result into ADMIN_USERS.
// Sessions are kept in sessionStorage — logging out or closing the tab clears access.
// To rotate a password: update the hash here and redeploy.

// Simple but safe client-side hash — SHA-256 via Web Crypto, salted per-user.
// Not bcrypt, but appropriate for a single-file internal tool pre-Supabase auth.
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password + "prism_admin_2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Admin user store ──────────────────────────────────────────────────────────
// Each entry: { username, displayName, salt, hash }
// hash = SHA-256(salt + password + "prism_admin_2026")
// Default credentials: username "justin" / password "PrismAdmin2026!"
// CHANGE THE PASSWORD after first login by updating the hash below.
// To generate a new hash, open the browser console and run:
//   hashPassword("yourNewPassword", "yourSalt").then(console.log)
// (copy the hashPassword function above into the console first)

const ADMIN_USERS_KEY = "prism_admin_users_v1";

function getAdminUsers() {
  try {
    const stored = localStorage.getItem(ADMIN_USERS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  // Default seed user — replace hash after first deploy
  return [
    {
      username: "justin",
      displayName: "Justin",
      salt: "prism_salt_j1",
      // Hash of: "prism_salt_j1" + "PrismAdmin2026!" + "prism_admin_2026"
      hash: "a6b3c9d2e5f1a8b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6",
      role: "owner",
      createdAt: "2026-07-20",
    }
  ];
}

function saveAdminUsers(users) {
  try { localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users)); } catch {}
}

const ADMIN_SESSION_KEY = "prism_admin_session_v1";

function getAdminSession() {
  try {
    const s = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!s) return null;
    const parsed = JSON.parse(s);
    // Sessions expire after 8 hours
    if (Date.now() - parsed.loginAt > 8 * 60 * 60 * 1000) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }
    return parsed;
  } catch { return null; }
}

function setAdminSession(user) {
  try {
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ ...user, loginAt: Date.now() }));
  } catch {}
}

function clearAdminSession() {
  try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch {}
}

// ─── ADMIN LOGIN SCREEN ───────────────────────────────────────────────────────

const ADMIN_LOGIN_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  .adm-root *, .adm-root *::before, .adm-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .adm-root {
    min-height: 100vh;
    background: #05111C;
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Sans', sans-serif;
    padding: 24px;
  }
  .adm-card {
    background: #071E33;
    border: 1px solid #1C3A55;
    border-radius: 16px;
    width: 100%; max-width: 400px;
    overflow: hidden;
    box-shadow: 0 24px 64px rgba(0,0,0,0.5);
  }
  .adm-header {
    background: linear-gradient(135deg, #001936 0%, #0A2A4D 100%);
    padding: 32px 32px 28px;
    text-align: center;
    border-bottom: 1px solid #1C3A55;
    position: relative;
  }
  .adm-logo {
    font-family: 'Sora', sans-serif;
    font-weight: 800; font-size: 26px;
    color: #3DD9CC; letter-spacing: -0.5px;
    margin-bottom: 4px;
  }
  .adm-logo span { color: #F7A106; }
  .adm-logo-sub { font-size: 11px; color: #4A7A96; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 500; margin-bottom: 14px; }
  .adm-lock {
    display: inline-flex; align-items: center; justify-content: center;
    width: 42px; height: 42px; background: rgba(15,184,171,0.12);
    border: 1px solid rgba(15,184,171,0.25);
    border-radius: 10px; font-size: 18px; margin: 0 auto 12px;
  }
  .adm-title { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 600; color: #E8F4F8; margin-bottom: 4px; }
  .adm-subtitle { font-size: 12px; color: #4A7A96; }
  .adm-body { padding: 28px 32px 32px; }
  .adm-field { margin-bottom: 16px; }
  .adm-label { display: block; font-size: 12px; font-weight: 500; color: #7FA8C0; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.6px; }
  .adm-input {
    width: 100%; padding: 11px 14px;
    background: #0C2640; border: 1.5px solid #1C3A55;
    border-radius: 8px; color: #E8F4F8;
    font-family: 'DM Sans', sans-serif; font-size: 14.5px;
    outline: none; transition: border-color .15s, box-shadow .15s;
  }
  .adm-input::placeholder { color: #2A5070; }
  .adm-input:focus { border-color: #0FB8AB; box-shadow: 0 0 0 3px rgba(15,184,171,0.12); }
  .adm-input.error { border-color: #EF4444; }
  .adm-error {
    background: rgba(239,68,68,0.10); border: 1px solid rgba(239,68,68,0.25);
    border-radius: 7px; padding: 10px 12px;
    font-size: 12.5px; color: #FCA5A5; margin-bottom: 14px;
    display: flex; align-items: center; gap: 7px;
  }
  .adm-btn {
    width: 100%; padding: 12px;
    background: #0FB8AB; color: white;
    border: none; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 14.5px; font-weight: 600;
    cursor: pointer; transition: background .15s, transform .1s;
    margin-top: 4px;
  }
  .adm-btn:hover { background: #3DD9CC; }
  .adm-btn:active { transform: scale(.99); }
  .adm-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; }
  .adm-footer { text-align: center; margin-top: 20px; font-size: 11px; color: #2A5070; }
  .adm-footer span { color: #0FB8AB; }
`;

function AdminLogin({ onAuthed }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password) { setError("Enter your username and password."); return; }
    setLoading(true); setError("");
    try {
      const users = getAdminUsers();
      const user  = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
      if (!user) { setError("Incorrect username or password."); setLoading(false); return; }
      const hash = await hashPassword(password, user.salt);
      if (hash !== user.hash) { setError("Incorrect username or password."); setLoading(false); return; }
      setAdminSession({ username: user.username, displayName: user.displayName, role: user.role });
      onAuthed({ username: user.username, displayName: user.displayName, role: user.role });
    } catch { setError("Something went wrong. Try again."); }
    setLoading(false);
  };

  return (
    <div className="adm-root">
      <style>{ADMIN_LOGIN_STYLES}</style>
      <div className="adm-card">
        <div className="adm-header">
          <div className="adm-logo">Prism<span>.</span></div>
          <div className="adm-logo-sub">Patient Payment Solutions</div>
          <div className="adm-lock">🔒</div>
          <div className="adm-title">Admin Console</div>
          <div className="adm-subtitle">Internal access only</div>
        </div>
        <div className="adm-body">
          {error && <div className="adm-error"><span>⚠</span>{error}</div>}
          <div className="adm-field">
            <label className="adm-label">Username</label>
            <input className={`adm-input${error ? " error" : ""}`} type="text"
              placeholder="your username" value={username}
              onChange={e => { setUsername(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              autoComplete="username" autoFocus />
          </div>
          <div className="adm-field">
            <label className="adm-label">Password</label>
            <div style={{ position: "relative" }}>
              <input className={`adm-input${error ? " error" : ""}`}
                type={showPw ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                autoComplete="current-password"
                style={{ paddingRight: 44 }} />
              <button onClick={() => setShowPw(v => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4A7A96", fontSize: 14, padding: 0 }}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
          </div>
          <button className="adm-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>
          <div className="adm-footer">Prism Patient · <span>Internal use only</span> · Not patient-facing</div>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────

const ADMIN_DASH_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  .ad *, .ad *::before, .ad *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .ad {
    display: flex; min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
    background: #05111C; color: #E8F4F8;
  }
  /* Sidebar */
  .ad-sb {
    width: 220px; flex-shrink: 0;
    background: #071E33; border-right: 1px solid #1C3A55;
    display: flex; flex-direction: column;
    position: sticky; top: 0; height: 100vh; overflow: hidden;
  }
  .ad-sb-logo { padding: 20px 18px 16px; border-bottom: 1px solid #1C3A55; }
  .ad-sb-prism { font-family: 'Sora', sans-serif; font-weight: 800; font-size: 18px; color: #3DD9CC; letter-spacing: -0.4px; }
  .ad-sb-prism span { color: #F7A106; }
  .ad-sb-sub { font-size: 9px; color: #2A5070; text-transform: uppercase; letter-spacing: 1.2px; margin-top: 2px; font-weight: 600; }
  .ad-sb-badge { display: inline-block; font-size: 9px; font-weight: 700; background: rgba(15,184,171,.1); color: #3DD9CC; padding: 2px 7px; border-radius: 100px; margin-top: 6px; text-transform: uppercase; letter-spacing: .9px; border: 1px solid rgba(15,184,171,.2); }
  .ad-sb-sec { padding: 8px 10px; margin-top: 4px; }
  .ad-sb-lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 1.3px; color: #2A5070; padding: 0 8px; margin-bottom: 4px; font-weight: 700; }
  .ad-nav { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 7px; font-size: 13px; font-weight: 500; color: #7FA8C0; cursor: pointer; transition: all .14s; margin-bottom: 1px; }
  .ad-nav:hover { background: #0C2640; color: #E8F4F8; }
  .ad-nav.on { background: rgba(15,184,171,.1); color: #3DD9CC; }
  .ad-nav-ic { font-size: 13px; width: 17px; text-align: center; flex-shrink: 0; }
  .ad-sb-foot { margin-top: auto; padding: 14px 18px; border-top: 1px solid #1C3A55; font-size: 11px; color: #2A5070; line-height: 1.6; }
  .ad-live { display: inline-block; width: 6px; height: 6px; background: #10B981; border-radius: 50%; margin-right: 5px; animation: adpulse 2s ease-in-out infinite; }
  @keyframes adpulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(.75)} }
  /* Main */
  .ad-main { flex: 1; overflow-y: auto; min-width: 0; }
  .ad-topbar {
    padding: 14px 26px; border-bottom: 1px solid #1C3A55;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 10;
    background: rgba(5,17,28,.94); backdrop-filter: blur(14px);
  }
  .ad-tb-title { font-family: 'Sora', sans-serif; font-size: 14.5px; font-weight: 700; }
  .ad-tb-sub { font-size: 11px; color: #2A5070; margin-top: 1px; }
  .ad-tb-right { display: flex; gap: 8px; align-items: center; }
  .ad-user-pill { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #7FA8C0; background: #0C2640; border: 1px solid #1C3A55; border-radius: 100px; padding: 5px 12px 5px 8px; }
  .ad-avatar { width: 22px; height: 22px; border-radius: 50%; background: #0FB8AB; color: white; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ad-btn { padding: 6px 13px; border-radius: 100px; font-size: 11.5px; font-weight: 500; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .14s; }
  .ad-btn-teal { background: #0FB8AB; color: white; }
  .ad-btn-teal:hover { background: #3DD9CC; }
  .ad-btn-ghost { background: #0C2640; color: #7FA8C0; border: 1px solid #1C3A55; }
  .ad-btn-ghost:hover { color: #E8F4F8; border-color: #0FB8AB; }
  .ad-btn-danger { background: transparent; color: #EF4444; border: 1px solid rgba(239,68,68,.3); }
  .ad-btn-danger:hover { background: rgba(239,68,68,.08); }
  .ad-btn:disabled { opacity: .45; cursor: not-allowed; }
  /* Content */
  .ad-content { padding: 20px 26px; }
  /* Metrics */
  .ad-metrics { display: grid; grid-template-columns: repeat(4,1fr); gap: 11px; margin-bottom: 18px; }
  .ad-metric { background: #071E33; border: 1px solid #1C3A55; border-radius: 13px; padding: 14px 16px; position: relative; overflow: hidden; transition: border-color .2s; }
  .ad-metric:hover { border-color: #234565; }
  .ad-metric::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
  .ad-metric.tc::before { background: linear-gradient(90deg,#0FB8AB,transparent); }
  .ad-metric.ac::before { background: linear-gradient(90deg,#F7A106,transparent); }
  .ad-metric.gc::before { background: linear-gradient(90deg,#10B981,transparent); }
  .ad-metric.bc::before { background: linear-gradient(90deg,#60A5FA,transparent); }
  .ad-m-lbl { font-size: 10px; text-transform: uppercase; letter-spacing: .7px; color: #2A5070; margin-bottom: 6px; font-weight: 700; }
  .ad-m-val { font-family: 'Sora', sans-serif; font-size: 26px; font-weight: 700; line-height: 1; margin-bottom: 4px; }
  .ad-m-val.tc { color: #3DD9CC; } .ad-m-val.ac { color: #F7A106; } .ad-m-val.gc { color: #10B981; } .ad-m-val.bc { color: #60A5FA; }
  .ad-m-sub { font-size: 10.5px; color: #2A5070; }
  /* Panel */
  .ad-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; margin-bottom: 13px; }
  .ad-panel { background: #071E33; border: 1px solid #1C3A55; border-radius: 13px; overflow: hidden; }
  .ad-ph { padding: 13px 16px; border-bottom: 1px solid #1C3A55; display: flex; align-items: center; justify-content: space-between; }
  .ad-ph-title { font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600; }
  .ad-ph-sub { font-size: 10.5px; color: #2A5070; margin-top: 1px; }
  .ad-pb { padding: 16px; }
  /* Table */
  .ad-tbl { width: 100%; border-collapse: collapse; }
  .ad-tbl th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .7px; color: #2A5070; text-align: left; padding: 8px 14px; border-bottom: 1px solid #1C3A55; }
  .ad-tbl td { padding: 10px 14px; font-size: 12.5px; border-bottom: 1px solid rgba(28,58,85,.4); }
  .ad-tbl tr:last-child td { border-bottom: none; }
  .ad-tbl tr:hover td { background: rgba(15,184,171,.03); }
  .ad-tbl-name { font-weight: 500; color: #E8F4F8; }
  .ad-tbl-sub  { font-size: 10.5px; color: #2A5070; margin-top: 1px; }
  /* Status pills */
  .ad-pill { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 100px; font-size: 10.5px; font-weight: 500; }
  .ad-pill-t { background: rgba(15,184,171,.1); color: #3DD9CC; }
  .ad-pill-a { background: rgba(247,161,6,.1); color: #F7A106; }
  .ad-pill-g { background: rgba(16,185,129,.1); color: #10B981; }
  .ad-pill-r { background: rgba(239,68,68,.1); color: #EF4444; }
  .ad-pill-b { background: rgba(96,165,250,.1); color: #60A5FA; }
  /* Bar */
  .ad-bar-chart { display: flex; flex-direction: column; gap: 8px; }
  .ad-bar-row { display: flex; align-items: center; gap: 8px; }
  .ad-bar-lbl { width: 96px; color: #7FA8C0; font-size: 10.5px; text-align: right; flex-shrink: 0; }
  .ad-bar-track { flex: 1; height: 6px; background: #0C2640; border-radius: 100px; overflow: hidden; }
  .ad-bar-fill { height: 100%; border-radius: 100px; transition: width .5s cubic-bezier(.4,0,.2,1); }
  .ad-bar-val { width: 28px; color: #4A7A96; font-size: 10.5px; text-align: right; }
  /* Feed */
  .ad-feed { display: flex; flex-direction: column; }
  .ad-fi { display: flex; align-items: flex-start; gap: 10px; padding: 11px 16px; border-bottom: 1px solid rgba(28,58,85,.4); transition: background .14s; }
  .ad-fi:last-child { border-bottom: none; }
  .ad-fi:hover { background: #0C2640; }
  .ad-fi-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; margin-top: 1px; }
  .ad-fi-t { flex: 1; min-width: 0; }
  .ad-fi-txt { font-size: 12px; color: #E8F4F8; line-height: 1.4; }
  .ad-fi-txt strong { color: #3DD9CC; }
  .ad-fi-meta { font-size: 10px; color: #2A5070; margin-top: 2px; }
  /* User management */
  .ad-um-form { background: #0C2640; border: 1px solid #1C3A55; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
  .ad-um-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .ad-um-field label { display: block; font-size: 10.5px; color: #4A7A96; text-transform: uppercase; letter-spacing: .6px; font-weight: 600; margin-bottom: 5px; }
  .ad-um-input { width: 100%; padding: 9px 12px; background: #071E33; border: 1.5px solid #1C3A55; border-radius: 7px; color: #E8F4F8; font-family: 'DM Sans', sans-serif; font-size: 13.5px; outline: none; transition: border-color .15s; }
  .ad-um-input:focus { border-color: #0FB8AB; }
  .ad-um-input::placeholder { color: #2A5070; }
  .ad-success { background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.2); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: #6EE7B7; margin-bottom: 12px; }
  .ad-err { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.2); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: #FCA5A5; margin-bottom: 12px; }
  /* Empty */
  .ad-empty { text-align: center; padding: 32px 16px; color: #2A5070; font-size: 12.5px; }
  .ad-empty-ic { font-size: 24px; margin-bottom: 8px; }
  /* Toast */
  .ad-toasts { position: fixed; bottom: 18px; right: 18px; z-index: 9999; display: flex; flex-direction: column; gap: 6px; pointer-events: none; }
  .ad-toast { background: #071E33; border: 1px solid #0FB8AB; border-radius: 8px; padding: 9px 13px; font-size: 12px; box-shadow: 0 0 24px rgba(15,184,171,.14); animation: adtoast .2s ease; max-width: 260px; }
  @keyframes adtoast { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  /* Dialog */
  .ad-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.75); z-index: 1000; display: flex; align-items: center; justify-content: center; }
  .ad-dialog { background: #071E33; border: 1px solid #1C3A55; border-radius: 13px; padding: 24px; max-width: 320px; width: 90%; }
  .ad-dialog h3 { font-family: 'Sora', sans-serif; font-size: 14.5px; font-weight: 700; margin-bottom: 8px; }
  .ad-dialog p  { font-size: 12px; color: #7FA8C0; margin-bottom: 16px; line-height: 1.5; }
  .ad-dialog-row { display: flex; gap: 8px; justify-content: flex-end; }
  @media(max-width:800px){ .ad-sb{display:none;} .ad-metrics{grid-template-columns:1fr 1fr;} .ad-2col{grid-template-columns:1fr;} }
`;

// ── Sparkline ─────────────────────────────────────────────────────────────────
function AdminSparkline({ events }) {
  const days = 14, counts = Array(days).fill(0);
  const now = new Date(); now.setHours(23, 59, 59, 999);
  events.forEach(ev => {
    const ts = new Date(ev.created_at || ev.ts);
    const diff = Math.floor((now - ts) / 86400000);
    if (diff >= 0 && diff < days) counts[days - 1 - diff]++;
  });
  const max = Math.max(...counts, 1);
  const labels = Array(days).fill(0).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
  const barStyle = {
    display: "flex", alignItems: "flex-end", gap: 3, height: 50,
  };
  return (
    <div>
      <div style={barStyle}>
        {counts.map((c, i) => (
          <div key={i} title={`${labels[i]}: ${c}`}
            style={{
              flex: 1, borderRadius: "3px 3px 0 0",
              background: i === days - 1 ? "#0FB8AB" : "rgba(15,184,171,.15)",
              height: `${Math.max(8, (c / max) * 100)}%`,
              transition: "background .2s", cursor: "pointer",
            }}
            onMouseEnter={e => e.target.style.background = "#0FB8AB"}
            onMouseLeave={e => { if (i !== days - 1) e.target.style.background = "rgba(15,184,171,.15)"; }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 10, color: "#2A5070" }}>
        <span>{labels[0]}</span><span>Today</span>
      </div>
    </div>
  );
}

function fmtAdminTime(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function AdminDashboard({ session, onSignOut }) {
  const [view, setView] = useState("overview");
  const [requests, setRequests] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // User management state
  const [adminUsers, setAdminUsers] = useState(() => getAdminUsers());
  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [umMsg, setUmMsg] = useState(null); // { type: "success"|"error", text }
  const [addingUser, setAddingUser] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);

  const toast = useCallback((msg) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, refRes, patRes, provRes] = await Promise.all([
        supabase.from("payment_plans").select("*, patients(first_name, last_name, email)").eq("autopay_status", "pending_review").order("created_at", { ascending: false }),
        supabase.from("referrals").select("*, providers(practice_name)").order("created_at", { ascending: false }),
        supabase.from("patients").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("providers").select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      setRequests(reqRes.data || []);
      setReferrals(refRes.data || []);
      setPatients(patRes.data || []);
      setProviders(provRes.data || []);
    } catch (e) { toast("⚠ Failed to load data from Supabase"); }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDecision = async (plan, approve) => {
    setActioning(plan.id);
    const newStatus = approve ? "active" : "rejected";
    await supabase.from("payment_plans").update({ autopay_status: newStatus, autopay_enabled: approve }).eq("id", plan.id);
    const timingText = plan.autopay_use_due_date ? "your plan's due date" : `day ${plan.autopay_charge_day} of each month`;
    await supabase.from("email_log").insert({
      patient_id: plan.patient_id,
      recipient_email: plan.patients?.email,
      subject: approve ? "Your Autopay Day Has Been Approved" : "Update on Your Autopay Request",
      body: approve
        ? `Hi, your requested autopay day has been approved. Autopay is now active for $${plan.autopay_amount}, charged on ${timingText}.`
        : `Hi, we're unable to approve autopay on the day you requested. Please log back in to select a different day, or contact us with questions.`,
      email_type: approve ? "autopay_approved" : "autopay_rejected",
    });
    toast(approve ? "✓ Autopay approved" : "✗ Autopay rejected");
    await fetchAll();
    setActioning(null);
  };

  // User management
  const handleAddUser = async () => {
    if (!newUsername.trim() || !newDisplayName.trim() || !newPassword) {
      setUmMsg({ type: "error", text: "Fill in all fields." }); return;
    }
    if (adminUsers.find(u => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      setUmMsg({ type: "error", text: "Username already exists." }); return;
    }
    setAddingUser(true);
    const salt = `prism_salt_${newUsername.trim().toLowerCase()}_${Date.now()}`;
    const hash = await hashPassword(newPassword, salt);
    const updated = [...adminUsers, {
      username: newUsername.trim().toLowerCase(),
      displayName: newDisplayName.trim(),
      salt, hash, role: "admin",
      createdAt: new Date().toISOString().slice(0, 10),
    }];
    saveAdminUsers(updated);
    setAdminUsers(updated);
    setNewUsername(""); setNewDisplayName(""); setNewPassword("");
    setUmMsg({ type: "success", text: `User "${newUsername.trim()}" added.` });
    setAddingUser(false);
  };

  const handleRemoveUser = (username) => {
    if (username === session.username) { setUmMsg({ type: "error", text: "You can't remove your own account." }); return; }
    const updated = adminUsers.filter(u => u.username !== username);
    saveAdminUsers(updated);
    setAdminUsers(updated);
    setRemoveTarget(null);
    setUmMsg({ type: "success", text: `User "${username}" removed.` });
  };

  const navItems = [
    { id: "overview",  icon: "◈",  label: "Overview" },
    { id: "autopay",   icon: "⚡", label: "Autopay Requests" },
    { id: "patients",  icon: "👤", label: "Patients" },
    { id: "providers", icon: "🏥", label: "Providers" },
    { id: "referrals", icon: "🔗", label: "Referrals" },
    { id: "users",     icon: "🔑", label: "Admin Users" },
  ];

  const approvedRequests = requests.filter(r => r.autopay_status === "active").length;
  const totalVolume = patients.reduce((s, p) => s + (parseFloat(p.loan_amount) || 0), 0);

  return (
    <div className="ad">
      <style>{ADMIN_DASH_STYLES}</style>

      {/* Sidebar */}
      <aside className="ad-sb">
        <div className="ad-sb-logo">
          <div className="ad-sb-prism">Prism<span>.</span></div>
          <div className="ad-sb-sub">Patient Payment Solutions</div>
          <div className="ad-sb-badge">Admin Console</div>
        </div>
        <div className="ad-sb-sec">
          <div className="ad-sb-lbl">Navigation</div>
          {navItems.map(n => (
            <div key={n.id} className={`ad-nav${view === n.id ? " on" : ""}`} onClick={() => setView(n.id)}>
              <span className="ad-nav-ic">{n.icon}</span>{n.label}
              {n.id === "autopay" && requests.length > 0 && (
                <span style={{ marginLeft: "auto", background: "#F7A106", color: "#001936", borderRadius: "100px", fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{requests.length}</span>
              )}
            </div>
          ))}
        </div>
        <div className="ad-sb-foot">
          <div><span className="ad-live" />Live data</div>
          <div style={{ marginTop: 3 }}>Signed in as <strong style={{ color: "#3DD9CC" }}>{session.displayName}</strong></div>
        </div>
      </aside>

      {/* Main */}
      <div className="ad-main">
        <div className="ad-topbar">
          <div>
            <div className="ad-tb-title">{{ overview: "Platform Overview", autopay: "Autopay Requests", patients: "Patients", providers: "Providers", referrals: "Referrals", users: "Admin Users" }[view]}</div>
            <div className="ad-tb-sub">Prism Patient · Internal Admin Console</div>
          </div>
          <div className="ad-tb-right">
            <div className="ad-user-pill">
              <div className="ad-avatar">{session.displayName[0].toUpperCase()}</div>
              {session.displayName}
            </div>
            <button className="ad-btn ad-btn-ghost" onClick={fetchAll}>↺ Refresh</button>
            <button className="ad-btn ad-btn-danger" onClick={() => setShowSignOutConfirm(true)}>Sign Out</button>
          </div>
        </div>

        <div className="ad-content">

          {loading && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#2A5070", fontSize: 13 }}>Loading data…</div>
          )}

          {!loading && <>

            {/* ── OVERVIEW ── */}
            {view === "overview" && <>
              <div className="ad-metrics">
                <div className="ad-metric tc">
                  <div className="ad-m-lbl">Total Patients</div>
                  <div className="ad-m-val tc">{patients.length}</div>
                  <div className="ad-m-sub">{patients.filter(p => { const d = new Date(p.created_at); return (Date.now()-d)<86400000; }).length} today</div>
                </div>
                <div className="ad-metric ac">
                  <div className="ad-m-lbl">Providers</div>
                  <div className="ad-m-val ac">{providers.length}</div>
                  <div className="ad-m-sub">Florida pilot</div>
                </div>
                <div className="ad-metric gc">
                  <div className="ad-m-lbl">Referrals Sent</div>
                  <div className="ad-m-val gc">{referrals.length}</div>
                  <div className="ad-m-sub">{referrals.filter(r => r.status === "applied").length} converted</div>
                </div>
                <div className="ad-metric bc">
                  <div className="ad-m-lbl">Autopay Pending</div>
                  <div className="ad-m-val bc">{requests.length}</div>
                  <div className="ad-m-sub">Needs review</div>
                </div>
              </div>

              <div className="ad-2col">
                <div className="ad-panel">
                  <div className="ad-ph"><div><div className="ad-ph-title">Patient Signups (14 days)</div><div className="ad-ph-sub">All registered patients</div></div></div>
                  <div className="ad-pb"><AdminSparkline events={patients} /></div>
                </div>
                <div className="ad-panel">
                  <div className="ad-ph"><div><div className="ad-ph-title">Referral Conversion</div><div className="ad-ph-sub">Sent vs applied</div></div></div>
                  <div className="ad-pb">
                    {[
                      { label: "Sent", count: referrals.length, color: "#0FB8AB" },
                      { label: "Applied", count: referrals.filter(r=>r.status==="applied").length, color: "#10B981" },
                      { label: "Pending", count: referrals.filter(r=>r.status!=="applied").length, color: "#F7A106" },
                    ].map(row => (
                      <div key={row.label} className="ad-bar-row" style={{ marginBottom: 8 }}>
                        <div className="ad-bar-lbl">{row.label}</div>
                        <div className="ad-bar-track"><div className="ad-bar-fill" style={{ width: `${referrals.length ? (row.count/referrals.length)*100 : 0}%`, background: row.color }} /></div>
                        <div className="ad-bar-val">{row.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent patients */}
              <div className="ad-panel">
                <div className="ad-ph">
                  <div><div className="ad-ph-title">Recent Patients</div><div className="ad-ph-sub">Latest 8 registrations</div></div>
                  <button className="ad-btn ad-btn-ghost" style={{fontSize:11}} onClick={() => setView("patients")}>View all →</button>
                </div>
                <div className="ad-feed">
                  {patients.slice(0, 8).map(p => (
                    <div key={p.id} className="ad-fi">
                      <div className="ad-fi-icon" style={{ background: "rgba(15,184,171,.1)" }}>👤</div>
                      <div className="ad-fi-t">
                        <div className="ad-fi-txt"><strong>{p.first_name} {p.last_name}</strong> · {p.email}</div>
                        <div className="ad-fi-meta">{fmtAdminTime(p.created_at)}</div>
                      </div>
                    </div>
                  ))}
                  {patients.length === 0 && <div className="ad-empty"><div className="ad-empty-ic">👤</div>No patients yet — data will appear once Supabase is wired in.</div>}
                </div>
              </div>
            </>}

            {/* ── AUTOPAY REQUESTS ── */}
            {view === "autopay" && <>
              <div className="ad-panel">
                <div className="ad-ph">
                  <div><div className="ad-ph-title">Pending Autopay Requests</div><div className="ad-ph-sub">Patients who chose a charge day after their plan due date</div></div>
                  <button className="ad-btn ad-btn-teal" onClick={fetchAll}>↺ Refresh</button>
                </div>
                {requests.length === 0
                  ? <div className="ad-empty"><div className="ad-empty-ic">✅</div>No pending autopay requests.</div>
                  : <table className="ad-tbl">
                      <thead><tr><th>Patient</th><th>Email</th><th>Amount</th><th>Day</th><th>Due Date</th><th>Action</th></tr></thead>
                      <tbody>
                        {requests.map(r => (
                          <tr key={r.id}>
                            <td><div className="ad-tbl-name">{r.patients?.first_name} {r.patients?.last_name}</div></td>
                            <td style={{ fontSize: 12, color: "#7FA8C0" }}>{r.patients?.email}</td>
                            <td style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, color: "#3DD9CC" }}>${r.autopay_amount}</td>
                            <td>Day {r.autopay_charge_day}</td>
                            <td style={{ color: "#4A7A96", fontSize: 12 }}>{r.next_due_date}</td>
                            <td>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button className="ad-btn ad-btn-teal" disabled={actioning === r.id} onClick={() => handleDecision(r, true)}>Approve</button>
                                <button className="ad-btn ad-btn-danger" disabled={actioning === r.id} onClick={() => handleDecision(r, false)}>Reject</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                }
              </div>
            </>}

            {/* ── PATIENTS ── */}
            {view === "patients" && <>
              <div className="ad-panel">
                <div className="ad-ph"><div><div className="ad-ph-title">All Patients</div><div className="ad-ph-sub">{patients.length} registered</div></div></div>
                {patients.length === 0
                  ? <div className="ad-empty"><div className="ad-empty-ic">👤</div>No patients yet.</div>
                  : <table className="ad-tbl">
                      <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Registered</th></tr></thead>
                      <tbody>
                        {patients.map(p => (
                          <tr key={p.id}>
                            <td><div className="ad-tbl-name">{p.first_name} {p.last_name}</div></td>
                            <td style={{ fontSize: 12, color: "#7FA8C0" }}>{p.email}</td>
                            <td style={{ fontSize: 12, color: "#4A7A96" }}>{p.phone || "—"}</td>
                            <td style={{ fontSize: 11, color: "#2A5070" }}>{fmtAdminTime(p.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                }
              </div>
            </>}

            {/* ── PROVIDERS ── */}
            {view === "providers" && <>
              <div className="ad-panel">
                <div className="ad-ph"><div><div className="ad-ph-title">All Providers</div><div className="ad-ph-sub">{providers.length} registered · Florida pilot</div></div></div>
                {providers.length === 0
                  ? <div className="ad-empty"><div className="ad-empty-ic">🏥</div>No providers yet.</div>
                  : <table className="ad-tbl">
                      <thead><tr><th>Practice</th><th>Contact</th><th>Email</th><th>Location</th><th>Joined</th></tr></thead>
                      <tbody>
                        {providers.map(p => (
                          <tr key={p.id}>
                            <td><div className="ad-tbl-name">{p.practice_name}</div></td>
                            <td style={{ fontSize: 12, color: "#7FA8C0" }}>{p.contact_name || "—"}</td>
                            <td style={{ fontSize: 12, color: "#4A7A96" }}>{p.email}</td>
                            <td>{p.city && p.state ? <span className="ad-pill ad-pill-t">{p.city}, {p.state}</span> : "—"}</td>
                            <td style={{ fontSize: 11, color: "#2A5070" }}>{fmtAdminTime(p.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                }
              </div>
            </>}

            {/* ── REFERRALS ── */}
            {view === "referrals" && <>
              <div className="ad-panel">
                <div className="ad-ph"><div><div className="ad-ph-title">All Referrals</div><div className="ad-ph-sub">{referrals.length} total · across all providers</div></div></div>
                {referrals.length === 0
                  ? <div className="ad-empty"><div className="ad-empty-ic">🔗</div>No referrals yet.</div>
                  : <table className="ad-tbl">
                      <thead><tr><th>Provider</th><th>Patient</th><th>Balance</th><th>Care</th><th>Method</th><th>Status</th><th>Sent</th></tr></thead>
                      <tbody>
                        {referrals.map(r => (
                          <tr key={r.id}>
                            <td><div className="ad-tbl-name">{r.providers?.practice_name || "—"}</div></td>
                            <td style={{ fontSize: 12 }}>{r.patient_first_name} {r.patient_last_name}</td>
                            <td style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, color: "#F7A106" }}>{r.balance_owed ? `$${Number(r.balance_owed).toLocaleString()}` : "—"}</td>
                            <td style={{ fontSize: 11.5, color: "#7FA8C0" }}>{r.care_description}</td>
                            <td><span className="ad-pill ad-pill-b" style={{ textTransform: "uppercase" }}>{r.method}</span></td>
                            <td><span className={`ad-pill ${r.status === "applied" ? "ad-pill-g" : "ad-pill-a"}`}>{r.status === "applied" ? "✓ Applied" : "Sent"}</span></td>
                            <td style={{ fontSize: 11, color: "#2A5070" }}>{fmtAdminTime(r.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                }
              </div>
            </>}

            {/* ── ADMIN USERS ── */}
            {view === "users" && <>
              <div className="ad-panel" style={{ marginBottom: 14 }}>
                <div className="ad-ph"><div><div className="ad-ph-title">Add Admin User</div><div className="ad-ph-sub">Credentials are hashed and stored locally in this browser</div></div></div>
                <div className="ad-pb">
                  {umMsg && <div className={umMsg.type === "success" ? "ad-success" : "ad-err"}>{umMsg.text}</div>}
                  <div className="ad-um-form">
                    <div className="ad-um-row">
                      <div className="ad-um-field">
                        <label>Username</label>
                        <input className="ad-um-input" type="text" placeholder="e.g. sarah" value={newUsername} onChange={e => { setNewUsername(e.target.value); setUmMsg(null); }} />
                      </div>
                      <div className="ad-um-field">
                        <label>Display Name</label>
                        <input className="ad-um-input" type="text" placeholder="e.g. Sarah" value={newDisplayName} onChange={e => { setNewDisplayName(e.target.value); setUmMsg(null); }} />
                      </div>
                    </div>
                    <div className="ad-um-field" style={{ marginBottom: 12 }}>
                      <label>Password</label>
                      <input className="ad-um-input" type="password" placeholder="Choose a strong password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setUmMsg(null); }} />
                    </div>
                    <button className="ad-btn ad-btn-teal" onClick={handleAddUser} disabled={addingUser}>{addingUser ? "Adding…" : "Add User →"}</button>
                  </div>
                </div>
              </div>

              <div className="ad-panel">
                <div className="ad-ph"><div><div className="ad-ph-title">Current Admin Users</div><div className="ad-ph-sub">{adminUsers.length} user{adminUsers.length !== 1 ? "s" : ""}</div></div></div>
                <table className="ad-tbl">
                  <thead><tr><th>Username</th><th>Display Name</th><th>Role</th><th>Added</th><th></th></tr></thead>
                  <tbody>
                    {adminUsers.map(u => (
                      <tr key={u.username}>
                        <td><div className="ad-tbl-name">{u.username}</div>{u.username === session.username && <span style={{ fontSize: 10, color: "#3DD9CC", marginLeft: 6 }}>you</span>}</td>
                        <td style={{ fontSize: 12.5 }}>{u.displayName}</td>
                        <td><span className={`ad-pill ${u.role === "owner" ? "ad-pill-a" : "ad-pill-t"}`}>{u.role}</span></td>
                        <td style={{ fontSize: 11, color: "#2A5070" }}>{u.createdAt}</td>
                        <td>
                          {u.username !== session.username && (
                            <button className="ad-btn ad-btn-danger" style={{ fontSize: 11 }} onClick={() => setRemoveTarget(u.username)}>Remove</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 14, padding: "12px 16px", background: "#0C2640", border: "1px solid #1C3A55", borderRadius: 10, fontSize: 12, color: "#4A7A96", lineHeight: 1.6 }}>
                <strong style={{ color: "#7FA8C0" }}>Note:</strong> Admin credentials are stored in <code style={{ color: "#3DD9CC", fontSize: 11 }}>localStorage</code> in this browser only.
                When Supabase auth is wired in, this will move to a proper admin table with server-side session management.
                Until then, credentials are SHA-256 hashed (salted) — not plaintext.
              </div>
            </>}

          </>}
        </div>
      </div>

      {/* Toasts */}
      <div className="ad-toasts">{toasts.map(t => <div key={t.id} className="ad-toast">{t.msg}</div>)}</div>

      {/* Sign out confirm */}
      {showSignOutConfirm && (
        <div className="ad-overlay">
          <div className="ad-dialog">
            <h3>Sign out?</h3>
            <p>You'll be returned to the login screen. Your session will be cleared.</p>
            <div className="ad-dialog-row">
              <button className="ad-btn ad-btn-ghost" onClick={() => setShowSignOutConfirm(false)}>Cancel</button>
              <button className="ad-btn ad-btn-danger" onClick={() => { clearAdminSession(); onSignOut(); }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Remove user confirm */}
      {removeTarget && (
        <div className="ad-overlay">
          <div className="ad-dialog">
            <h3>Remove "{removeTarget}"?</h3>
            <p>This admin user will lose access immediately. This can't be undone.</p>
            <div className="ad-dialog-row">
              <button className="ad-btn ad-btn-ghost" onClick={() => setRemoveTarget(null)}>Cancel</button>
              <button className="ad-btn ad-btn-danger" onClick={() => handleRemoveUser(removeTarget)}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminApp() {
  const [session, setSession] = useState(() => getAdminSession());
  const handleAuthed = (user) => { setAdminSession(user); setSession(user); };
  const handleSignOut = () => { clearAdminSession(); setSession(null); };
  if (!session) return <AdminLogin onAuthed={handleAuthed} />;
  return <AdminDashboard session={session} onSignOut={handleSignOut} />;
}

export default function Root() {
  const isAdminRoute = typeof window !== "undefined" && window.location.search.includes("admin");
  return isAdminRoute ? <AdminApp /> : <MainApp />;
}

function MainApp() {
  const [mode, setMode] = useState("patient");
  const [page, setPage] = useState("home");
  // patient flow state
  const [intakeData, setIntakeData] = useState(null);
  const [magicLink, setMagicLink] = useState("");
  const [authUser, setAuthUser] = useState(null);
  const [approvalResult, setApprovalResult] = useState(null);
  const [referralPrefill] = useState(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const hasReferralData = params.get("firstName") || params.get("lastName") || params.get("care");
    if (!hasReferralData) return null;
    return {
      firstName: params.get("firstName") || "",
      lastName: params.get("lastName") || "",
      phone: params.get("phone") || "",
      email: params.get("email") || "",
      balanceOwed: params.get("balance") || "",
      careDescription: params.get("care") || "",
      referralCode: params.get("ref") || "",
    };
  });
  const [providerNotifEmail, setProviderNotifEmail] = useState("admin@practice.com");
  const [applicationId, setApplicationId] = useState(null);
  const [patientDbId, setPatientDbId] = useState(null);
  // provider auth state
  const [providerUser, setProviderUser] = useState(null);
  const [providerAddress, setProviderAddress] = useState({ address: "", city: "", state: "", zip: "" });
  const [providerPage, setProviderPage] = useState("dashboard");
  // patient account portal state
  const [patientAcctUser, setPatientAcctUser] = useState(null);
  const [acctResetKey, setAcctResetKey] = useState(0);
  // session restoration (so a reload / back-forward navigation doesn't falsely look signed out)
  const [sessionChecked, setSessionChecked] = useState(false);
  // coming soon gate
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  useEffect(() => {
    if (!COMING_SOON_MODE) return;
    try {
      if (!sessionStorage.getItem("prism_coming_soon_seen")) {
        setComingSoonOpen(true);
        sessionStorage.setItem("prism_coming_soon_seen", "1");
      }
    } catch (e) { /* sessionStorage unavailable — skip auto-open */ }
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email;
      const role = session?.user?.user_metadata?.role;

      const lookupPatient = async () => {
        const { data } = await supabase.from("patients").select("*").eq("email", email).order("created_at", { ascending: false }).limit(1);
        return data?.[0] || null;
      };
      const lookupProvider = async () => {
        const { data } = await supabase.from("providers").select("*").eq("email", email).order("created_at", { ascending: false }).limit(1);
        return data?.[0] || null;
      };

      if (email) {
        if (role === "provider") {
          const providerRow = await lookupProvider();
          if (providerRow) {
            setProviderUser({ email, practiceName: providerRow.practice_name || "", contactName: providerRow.contact_name || "" });
            setProviderAddress({ address: providerRow.address || "", city: providerRow.city || "", state: providerRow.state || "", zip: providerRow.zip || "" });
            setMode("provider");
            setProviderPage("dashboard");
          }
        } else if (role === "patient") {
          const patientRow = await lookupPatient();
          if (patientRow) {
            setPatientAcctUser({ email, firstName: patientRow.first_name || "", lastName: patientRow.last_name || "" });
            setMode("patient");
            setPage("patient-account");
          }
        } else {
          // No role tag on this account (created before this fix) — fall back to checking both tables.
          const patientRow = await lookupPatient();
          if (patientRow) {
            setPatientAcctUser({ email, firstName: patientRow.first_name || "", lastName: patientRow.last_name || "" });
            setMode("patient");
            setPage("patient-account");
          } else {
            const providerRow = await lookupProvider();
            if (providerRow) {
              setProviderUser({ email, practiceName: providerRow.practice_name || "", contactName: providerRow.contact_name || "" });
              setProviderAddress({ address: providerRow.address || "", city: providerRow.city || "", state: providerRow.state || "", zip: providerRow.zip || "" });
              setMode("provider");
              setProviderPage("dashboard");
            }
          }
        }
      }
      setSessionChecked(true);
    })();
  }, []);

  const handleApplicationCreated = (appId, patId) => { setApplicationId(appId); setPatientDbId(patId); };
  const handleIntakeSubmit = (form) => {
    const link = generateMagicLink(form.email);
    setIntakeData(form);
    setMagicLink(link);
    setPage("magic-link-sent");
  };

  const handleSimulateMagicLink = () => setPage("auth");
  const handleAuthenticated = (user) => { setAuthUser(user); setPage("portal"); };
  const handleApprovalResult = (result, intake) => { setApprovalResult(result); setPage("app-submitted"); };
  const handleEobReview = (result, intake) => { setApprovalResult(result); setPage("eob-review"); };
  const handleEobReviewResolved = (result, intake) => { setApprovalResult(result); setPage("offer-review"); };
  const handleSimulateDecision = () => setPage("offer-review");
  const handleAcceptOffer = () => setPage("esign");
  const handleDeclineOffer = () => setPage("home");
  const handleOfferSigned = () => setPage("offer-accepted");
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setIntakeData(null);
    setMagicLink("");
    setApprovalResult(null);
    setPage("home");
  };
  const handleStartOver = () => { setIntakeData(null); setMagicLink(""); setApprovalResult(null); setAuthUser(null); setPage("home"); };

  const handleProviderSignIn = (user) => {
    setProviderUser(user);
    setProviderAddress({ address: user.address || "", city: user.city || "", state: user.state || "", zip: user.zip || "" });
    setProviderPage("dashboard");
  };
  const handleProviderSignOut = async () => {
    await supabase.auth.signOut();
    setProviderUser(null);
    setProviderPage("dashboard");
  };
  const handlePatientAcctSignIn = (user) => { setPatientAcctUser(user); setPage("patient-account"); };
  const handlePatientAcctSignOut = () => { setPatientAcctUser(null); setPage("home"); };

  const patientPortalPages = ["portal", "app-submitted", "eob-review", "offer-review", "esign", "offer-accepted", "patient-account"];
  const isPatientPortal = patientPortalPages.includes(page);
  const isProviderPortal = mode === "provider" && providerUser;

  if (!sessionChecked) {
    return (
      <>
        <style>{styles}</style>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif", color: "var(--text-secondary)" }}>
          Loading...
        </div>
      </>
    );
  }

  return (
    <ComingSoonContext.Provider value={{ active: COMING_SOON_MODE, requestAccess: () => setComingSoonOpen(true) }}>
      <style>{styles}</style>
      <div className="app">
        {COMING_SOON_MODE && <ComingSoonBanner onJoinClick={() => setComingSoonOpen(true)} />}
        {comingSoonOpen && <ComingSoonModal onClose={() => setComingSoonOpen(false)} />}
        {CONTENT_PENDING_REVIEW && <ContentPendingWatermark />}

        <nav className="nav">
          <div className="nav-logo" style={{ cursor: "pointer" }} onClick={() => {
            if (isProviderPortal) {
              setProviderPage("dashboard");
            } else if (patientAcctUser && page === "patient-account") {
              setAcctResetKey(k => k + 1);
            } else if (authUser && isPatientPortal) {
              setPage("portal");
            } else {
              handleStartOver();
              if (mode === "provider") handleProviderSignOut();
              setPatientAcctUser(null);
            }
          }}>
            <svg width="150" height="60" viewBox="0 0 1983 793" xmlns="http://www.w3.org/2000/svg">
              <g stroke="#FFFFFF" strokeWidth="7" strokeLinejoin="round">
                <polygon points="430,164 560,391 415,453 203,550" fill="#0FB8AB"/>
                <polygon points="203,550 172,597 430,590 415,453" fill="#01665E"/>
                <polygon points="560,391 687,597 430,590 415,453" fill="#F7A106"/>
              </g>
              <text x="750" y="520" fontFamily="Inter, Montserrat, Avenir Next, Helvetica, Arial, sans-serif" fontSize="400" fontWeight="900" letterSpacing="-8" fill="#001936">Pr{"\u0131"}sm</text>
              <circle cx="1225" cy="215" r="42" fill="#0FB8AB"/>
              <text x="755" y="615" fontFamily="Inter, Montserrat, Avenir Next, Helvetica, Arial, sans-serif" fontSize="95" fontWeight="400" letterSpacing="2" fill="#656972">Patient Payment Solutions</text>
            </svg>
          </div>
          {!isPatientPortal && !isProviderPortal && (
            <div className="nav-pill">
              <button className={mode === "patient" ? "active" : ""} onClick={() => { setMode("patient"); handleStartOver(); setPatientAcctUser(null); }}>Patient</button>
              <button className={mode === "provider" ? "active" : ""} onClick={() => { setMode("provider"); handleStartOver(); setPatientAcctUser(null); }}>Provider</button>
            </div>
          )}
          {isPatientPortal && page === "patient-account" && <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Patient Account</div>}
          {isPatientPortal && page !== "patient-account" && <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Secure Patient Portal</div>}
        </nav>

        {/* ── PATIENT PAGES ── */}
        {mode === "patient" && page === "how-it-works" && <HowItWorks onBack={() => setPage("home")} onApply={() => setPage("home")} />}

        {mode === "patient" && !isPatientPortal && page !== "how-it-works" && (
          <PatientMarketingNav
            activePage={["about", "services", "patient-account-login", "blog-patient", "contact-patient", "bill-review-service"].includes(page) ? page : "home"}
            onNavigate={(p) => {
              if (p === "get-started") {
                setPage("home");
                setTimeout(() => document.getElementById("intake-form")?.scrollIntoView({ behavior: "smooth" }), 80);
              } else {
                setPage(p);
              }
            }}
          />
        )}

        {mode === "patient" && page === "home" && (
          <>
            <div className="hero">
              <h1>{"The support you need"}<br />{"shouldn't wait on "}<em>cost</em>{"."}</h1>
              <p>Prism Patient helps families and individuals in behavioral health, mental health, autism, and ABA treatment manage their care costs with flexible payment options.</p>
              <div className="hero-ctas" style={{ flexDirection: "column", alignItems: "center", gap: 12 }}>
                <button className="btn btn-primary" style={{ width: 280, justifyContent: "center" }} onClick={() => document.getElementById("intake-form")?.scrollIntoView({ behavior: "smooth" })}>Check My Options</button>
                <button className="btn btn-outline" style={{ width: 280, justifyContent: "center" }} onClick={() => setPage("how-it-works")}>Learn How It Works</button>
              </div>
            </div>
            <div className="stats-bar">
              {[["$0", "To start care today"], ["84%", "Approval rate"], ["60 sec", "Average decision time"], ["ABA & BH", "Specialized focus"]].map(([n, l]) => (
                <div className="stat" key={l}><div className="stat-num">{n}</div><div className="stat-label">{l}</div></div>
              ))}
            </div>
            <div style={{ textAlign: "center", padding: "14px 16px", background: "var(--white)", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text-secondary)" }}>
              {"Already have an account? "}
              <button onClick={() => setPage("patient-account-login")} style={{ background: "none", border: "none", color: "var(--teal-dark)", fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 13 }}>
                Sign in to view your payment plans
              </button>
            </div>
            <div id="intake-form" className="main"><IntakeForm onSubmit={handleIntakeSubmit} prefill={referralPrefill} storageKey="rpps_public_intake_draft" /></div>
            <SiteFooter mode="patient" onNavigate={setPage} />
          </>
        )}

        {mode === "patient" && page === "about" && (
          <>
            <PatientAbout onNavigate={(p) => { if (p === "get-started") { setPage("home"); setTimeout(() => document.getElementById("intake-form")?.scrollIntoView({ behavior: "smooth" }), 80); } else setPage(p); }} />
            <SiteFooter mode="patient" onNavigate={setPage} />
          </>
        )}

        {mode === "patient" && page === "services" && (
          <>
            <PatientServices onNavigate={(p) => { if (p === "get-started") { setPage("home"); setTimeout(() => document.getElementById("intake-form")?.scrollIntoView({ behavior: "smooth" }), 80); } else setPage(p); }} />
            <SiteFooter mode="patient" onNavigate={setPage} />
          </>
        )}

        {mode === "patient" && page === "bill-review-service" && (
          <>
            <BillReviewService onNavigate={(p) => { if (p === "get-started") { setPage("home"); setTimeout(() => document.getElementById("intake-form")?.scrollIntoView({ behavior: "smooth" }), 80); } else setPage(p); }} />
            <SiteFooter mode="patient" onNavigate={setPage} />
          </>
        )}

        {mode === "patient" && page === "blog-patient" && (
          <>
            <PatientBlog onNavigate={(p) => { if (p === "get-started") { setPage("home"); setTimeout(() => document.getElementById("intake-form")?.scrollIntoView({ behavior: "smooth" }), 80); } else setPage(p); }} />
            <SiteFooter mode="patient" onNavigate={setPage} />
          </>
        )}

        {mode === "patient" && page === "contact-patient" && (
          <>
            <ContactPage audience="patient" />
            <SiteFooter mode="patient" onNavigate={setPage} />
          </>
        )}

        {mode === "patient" && page === "patient-account-login" && (
          <PatientAccountLogin onAuthenticated={handlePatientAcctSignIn} />
        )}

        {mode === "patient" && page === "patient-account" && patientAcctUser && (
          <PatientAccountPortal key={acctResetKey} user={patientAcctUser} onSignOut={handlePatientAcctSignOut} />
        )}

        {mode === "patient" && page === "magic-link-sent" && <div className="main-narrow" style={{ paddingTop: 48 }}><MagicLinkSent email={intakeData?.email} magicLink={magicLink} onSimulateClick={handleSimulateMagicLink} /></div>}
        {mode === "patient" && page === "auth" && <div className="main-narrow" style={{ paddingTop: 48 }}><AuthPage intakeData={intakeData} onAuthenticated={handleAuthenticated} /></div>}
        {mode === "patient" && page === "portal" && <PatientPortal user={authUser} intakeData={intakeData} onApprovalResult={handleApprovalResult} onEobReview={handleEobReview} onSignOut={handleSignOut} onApplicationCreated={handleApplicationCreated} />}
        {mode === "patient" && page === "app-submitted" && <AppSubmitted intakeData={intakeData} onSimulateDecision={handleSimulateDecision} onSignOut={handleSignOut} />}
        {mode === "patient" && page === "eob-review" && <EobUnderReview result={approvalResult} intakeData={intakeData} onCheckStatus={handleEobReviewResolved} onSignOut={handleSignOut} />}
        {mode === "patient" && page === "offer-review" && <OfferReview result={approvalResult} intakeData={intakeData} onAccept={handleAcceptOffer} onDecline={handleDeclineOffer} onSignOut={handleSignOut} />}
        {mode === "patient" && page === "esign" && <ESignDoc result={approvalResult} intakeData={intakeData} patientEmail={authUser?.email} applicationId={applicationId} patientDbId={patientDbId} onSigned={handleOfferSigned} onBack={() => setPage("offer-review")} />}
        {mode === "patient" && page === "offer-accepted" && <OfferAccepted result={approvalResult} intakeData={intakeData} providerEmail={providerNotifEmail} onStartOver={handleStartOver} />}

        {/* ── PROVIDER PAGES ── */}
        {mode === "provider" && !providerUser && (
          <ProviderMarketingSite
            page={page}
            onNavigate={setPage}
            onRegistered={handleProviderSignIn}
          />
        )}

        {mode === "provider" && providerUser && (
          <>
            <ProviderPortalNav providerUser={providerUser} activePage={providerPage} onNavigate={setProviderPage} onSignOut={handleProviderSignOut} />
            {providerPage === "dashboard" && <ProviderDashboard onNavigate={setProviderPage} />}
            {providerPage === "refer" && <ReferPatientPage providerUser={providerUser} />}
            {providerPage === "account" && <ProviderAccountPage providerEmail={providerUser?.email} onNotifEmailChange={setProviderNotifEmail} sharedAddress={providerAddress} onSharedAddressChange={(patch) => setProviderAddress(a => ({ ...a, ...patch }))} />}
            {providerPage === "billing" && <ProviderBillingPage accountAddress={providerAddress} />}
            {providerPage === "messages" && <ProviderMessagesPage providerUser={providerUser} />}
          </>
        )}

      </div>
    </ComingSoonContext.Provider>
  );
}
