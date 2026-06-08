/* @ds-bundle: {"format":3,"namespace":"OtoGODesignSystem_f7ff63","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"design_handoff_sotogo_login/design-system/components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"ProgressBar","sourcePath":"components/core/ProgressBar.jsx"},{"name":"StatTile","sourcePath":"components/core/StatTile.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Input","sourcePath":"design_handoff_sotogo_login/design-system/components/forms/Input.jsx"},{"name":"SegmentedControl","sourcePath":"design_handoff_sotogo_login/design-system/components/forms/SegmentedControl.jsx"},{"name":"Switch","sourcePath":"design_handoff_sotogo_login/design-system/components/forms/Switch.jsx"},{"name":"AchievementBadge","sourcePath":"components/game/AchievementBadge.jsx"},{"name":"BottomNav","sourcePath":"components/game/BottomNav.jsx"},{"name":"ChallengeCard","sourcePath":"components/game/ChallengeCard.jsx"},{"name":"LevelRing","sourcePath":"components/game/LevelRing.jsx"},{"name":"VehicleCard","sourcePath":"components/game/VehicleCard.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"8b6205619b56","components/core/Badge.jsx":"e8ba9681f909","components/core/Button.jsx":"2e41f351bf0b","components/core/Card.jsx":"37f36171faad","components/core/IconButton.jsx":"b8aa0078bc88","components/core/ProgressBar.jsx":"0ff720f857cd","components/core/StatTile.jsx":"3c2efdd4af6e","components/core/Tag.jsx":"7ae58820e0d3","components/forms/Input.jsx":"a3c5c6a21a46","components/forms/SegmentedControl.jsx":"fcf152228779","components/forms/Switch.jsx":"b1e5e9bf15ce","components/game/AchievementBadge.jsx":"d95e569fa0a8","components/game/BottomNav.jsx":"66a5ad1074bc","components/game/ChallengeCard.jsx":"529429351eb5","components/game/LevelRing.jsx":"3b3e44042441","components/game/VehicleCard.jsx":"f1d306a65f48","design_handoff_sotogo_login/design-system/components/core/Button.jsx":"2e41f351bf0b","design_handoff_sotogo_login/design-system/components/forms/Input.jsx":"a3c5c6a21a46","design_handoff_sotogo_login/design-system/components/forms/SegmentedControl.jsx":"fcf152228779","design_handoff_sotogo_login/design-system/components/forms/Switch.jsx":"b1e5e9bf15ce","ui_kits/sotogo-app/CaptureSheet.jsx":"cc72997c370e","ui_kits/sotogo-app/MapScreen.jsx":"0ffb01f2cf64","ui_kits/sotogo-app/ParkScreen.jsx":"95d195cd8bfc","ui_kits/sotogo-app/ProfilScreen.jsx":"e8307f656a70","ui_kits/sotogo-app/TopBar.jsx":"d9d14597823d","ui_kits/sotogo-app/VyzvyScreen.jsx":"923a79891255","ui_kits/sotogo-app/app.jsx":"837e95124552","ui_kits/sotogo-app/data.js":"b915da18e231"},"inlinedExternals":[],"duplicateExports":[{"name":"Button","paths":["components/core/Button.jsx","design_handoff_sotogo_login/design-system/components/core/Button.jsx"]},{"name":"Input","paths":["components/forms/Input.jsx","design_handoff_sotogo_login/design-system/components/forms/Input.jsx"]},{"name":"SegmentedControl","paths":["components/forms/SegmentedControl.jsx","design_handoff_sotogo_login/design-system/components/forms/SegmentedControl.jsx"]},{"name":"Switch","paths":["components/forms/Switch.jsx","design_handoff_sotogo_login/design-system/components/forms/Switch.jsx"]}],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.OtoGODesignSystem_f7ff63 = window.OtoGODesignSystem_f7ff63 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-avatar { position: relative; display: inline-flex; flex: none; }
.sg-avatar__img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; background: var(--green-100); }
.sg-avatar__fallback {
  width: 100%; height: 100%; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-weight: 600; color: #fff;
  background: var(--brand);
}
.sg-avatar--ring .sg-avatar__img, .sg-avatar--ring .sg-avatar__fallback { box-shadow: 0 0 0 3px var(--surface-card), 0 0 0 5px var(--brand); }
.sg-avatar__level {
  position: absolute; bottom: -3px; right: -3px;
  background: var(--xp); color: #4a2d00;
  font-family: var(--font-display); font-weight: 700;
  border-radius: var(--radius-pill); border: 2px solid var(--surface-card);
  min-width: 22px; height: 22px; padding: 0 5px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; line-height: 1;
}
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-avatar-css')) {
  const s = document.createElement('style');
  s.id = 'sg-avatar-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
}
function Avatar({
  src,
  name = '',
  size = 44,
  level,
  ring = false,
  className = '',
  ...rest
}) {
  const cls = ['sg-avatar', ring ? 'sg-avatar--ring' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls,
    style: {
      width: size,
      height: size
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    className: "sg-avatar__img",
    src: src,
    alt: name
  }) : /*#__PURE__*/React.createElement("span", {
    className: "sg-avatar__fallback",
    style: {
      fontSize: size * 0.4
    }
  }, initials(name)), level != null && /*#__PURE__*/React.createElement("span", {
    className: "sg-avatar__level"
  }, level));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: var(--font-display); font-weight: 600; line-height: 1;
  border-radius: var(--radius-pill); white-space: nowrap;
}
.sg-badge--sm { font-size: 11px; padding: 4px 8px; }
.sg-badge--md { font-size: 13px; padding: 6px 11px; }
.sg-badge__dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.sg-badge svg { width: 1.05em; height: 1.05em; }
.sg-badge--mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; letter-spacing: -.01em; }

/* token tones */
.sg-badge--brand.is-solid { background: var(--brand); color: #fff; }
.sg-badge--brand.is-soft { background: var(--brand-subtle); color: var(--text-brand); }
.sg-badge--gold.is-solid { background: var(--xp); color: #4a2d00; }
.sg-badge--gold.is-soft { background: var(--xp-subtle); color: var(--gold-700); }
.sg-badge--neutral.is-solid { background: var(--slate-700); color: #fff; }
.sg-badge--neutral.is-soft { background: var(--surface-sunken); color: var(--text-secondary); }
.sg-badge--success.is-soft { background: var(--success-soft); color: var(--green-700); }
.sg-badge--warning.is-soft { background: var(--warning-soft); color: var(--gold-700); }
.sg-badge--danger.is-soft { background: var(--danger-soft); color: var(--danger-500); }
.sg-badge--danger.is-solid { background: var(--danger-500); color: #fff; }
.sg-badge--info.is-soft { background: var(--info-soft); color: var(--info-500); }
.sg-badge--outline { background: transparent; box-shadow: inset 0 0 0 1.5px var(--border-strong); color: var(--text-secondary); }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-badge-css')) {
  const s = document.createElement('style');
  s.id = 'sg-badge-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function Badge({
  children,
  tone = 'neutral',
  variant = 'soft',
  size = 'md',
  color,
  dot = false,
  icon,
  mono = false,
  className = '',
  ...rest
}) {
  // Custom color (category / rarity / metro line) overrides token tones via inline style.
  let style = {};
  if (color) {
    style = variant === 'solid' ? {
      background: color,
      color: '#fff'
    } : variant === 'outline' ? {
      boxShadow: `inset 0 0 0 1.5px ${color}`,
      color
    } : {
      background: `color-mix(in srgb, ${color} 14%, white)`,
      color
    };
  }
  const cls = ['sg-badge', `sg-badge--${size}`, color ? '' : `sg-badge--${tone}`, `is-${variant}`, variant === 'outline' ? 'sg-badge--outline' : '', mono ? 'sg-badge--mono' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls,
    style: style
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "sg-badge__dot"
  }), icon, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-btn {
  --_depth: var(--press-depth, 4px);
  font-family: var(--font-display);
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  white-space: nowrap;
  text-decoration: none;
  transition: transform .12s cubic-bezier(.3,1.2,.5,1), box-shadow .12s ease, background .12s ease;
  user-select: none;
}
.sg-btn:focus-visible { box-shadow: var(--focus-ring); }
.sg-btn--sm { height: 36px; padding: 0 14px; font-size: 14px; border-radius: var(--radius-sm); }
.sg-btn--md { height: 44px; padding: 0 18px; font-size: 15px; }
.sg-btn--lg { height: 54px; padding: 0 24px; font-size: 17px; }
.sg-btn--full { width: 100%; }
.sg-btn__icon { display: inline-flex; }
.sg-btn__icon svg { width: 1.15em; height: 1.15em; display: block; }

.sg-btn--primary { background: var(--brand); color: var(--text-on-brand); box-shadow: 0 var(--_depth) 0 var(--brand-shadow), var(--shadow-sm); }
.sg-btn--primary:hover { background: var(--brand-hover); }
.sg-btn--primary:active { transform: translateY(var(--_depth)); box-shadow: 0 0 0 var(--brand-shadow); }

.sg-btn--reward { background: var(--xp); color: #4a2d00; box-shadow: 0 var(--_depth) 0 var(--xp-shadow), var(--shadow-sm); }
.sg-btn--reward:hover { background: var(--gold-400); }
.sg-btn--reward:active { transform: translateY(var(--_depth)); box-shadow: 0 0 0 var(--xp-shadow); }

.sg-btn--danger { background: var(--danger-500); color: #fff; box-shadow: 0 var(--_depth) 0 #9c160f, var(--shadow-sm); }
.sg-btn--danger:active { transform: translateY(var(--_depth)); box-shadow: 0 0 0 #9c160f; }

.sg-btn--secondary { background: var(--surface-card); color: var(--text-primary); box-shadow: inset 0 0 0 1px var(--border-default), var(--shadow-sm); }
.sg-btn--secondary:hover { background: var(--surface-sunken); }
.sg-btn--secondary:active { transform: translateY(1px); }

.sg-btn--ghost { background: transparent; color: var(--text-brand); }
.sg-btn--ghost:hover { background: var(--brand-subtle); }

.sg-btn[disabled] { opacity: .45; cursor: not-allowed; box-shadow: none; transform: none; pointer-events: none; }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-btn-css')) {
  const s = document.createElement('style');
  s.id = 'sg-btn-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  as = 'button',
  className = '',
  ...rest
}) {
  const Tag = as;
  const cls = ['sg-btn', `sg-btn--${variant}`, `sg-btn--${size}`, fullWidth ? 'sg-btn--full' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls
  }, rest), leadingIcon && /*#__PURE__*/React.createElement("span", {
    className: "sg-btn__icon"
  }, leadingIcon), children, trailingIcon && /*#__PURE__*/React.createElement("span", {
    className: "sg-btn__icon"
  }, trailingIcon));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-card {
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: clip;
  transition: transform .15s cubic-bezier(.3,1,.5,1), box-shadow .15s ease;
}
.sg-card--bordered { box-shadow: inset 0 0 0 1px var(--border-subtle), var(--shadow-sm); }
.sg-card--flat { box-shadow: inset 0 0 0 1px var(--border-default); }
.sg-card--p0 { padding: 0; }
.sg-card--p-sm { padding: 14px; }
.sg-card--p-md { padding: 18px; }
.sg-card--p-lg { padding: 24px; }
.sg-card--interactive { cursor: pointer; }
.sg-card--interactive:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
.sg-card--interactive:active { transform: translateY(0); }
.sg-card--night { background: var(--surface-night); color: var(--text-on-night); box-shadow: var(--shadow-lg); }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-card-css')) {
  const s = document.createElement('style');
  s.id = 'sg-card-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function Card({
  children,
  padding = 'md',
  variant = 'raised',
  interactive = false,
  accentColor,
  as = 'div',
  className = '',
  style = {},
  ...rest
}) {
  const Tag = as;
  const cls = ['sg-card', `sg-card--p-${padding === 'none' ? '0' : padding}`, variant === 'bordered' ? 'sg-card--bordered' : '', variant === 'flat' ? 'sg-card--flat' : '', variant === 'night' ? 'sg-card--night' : '', interactive ? 'sg-card--interactive' : '', className].filter(Boolean).join(' ');
  // Optional colored frame (category / rarity).
  const frameStyle = accentColor ? {
    boxShadow: `inset 0 0 0 2px ${accentColor}`,
    ...style
  } : style;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls,
    style: frameStyle
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-iconbtn {
  display: inline-flex; align-items: center; justify-content: center;
  border: none; cursor: pointer; border-radius: var(--radius-md);
  transition: transform .12s ease, background .12s ease, box-shadow .12s ease;
  color: var(--text-primary); background: transparent;
}
.sg-iconbtn svg { width: 1.3em; height: 1.3em; display: block; }
.sg-iconbtn--round { border-radius: var(--radius-pill); }
.sg-iconbtn--sm { width: 36px; height: 36px; font-size: 16px; }
.sg-iconbtn--md { width: 44px; height: 44px; font-size: 20px; }
.sg-iconbtn--lg { width: 56px; height: 56px; font-size: 24px; }
.sg-iconbtn:focus-visible { box-shadow: var(--focus-ring); }
.sg-iconbtn:active { transform: scale(.92); }

.sg-iconbtn--solid { background: var(--brand); color: #fff; box-shadow: var(--shadow-brand); }
.sg-iconbtn--solid:hover { background: var(--brand-hover); }
.sg-iconbtn--soft { background: var(--brand-subtle); color: var(--text-brand); }
.sg-iconbtn--soft:hover { background: var(--green-100); }
.sg-iconbtn--ghost:hover { background: var(--surface-sunken); }
.sg-iconbtn--surface { background: var(--surface-card); color: var(--text-primary); box-shadow: var(--shadow-md); }
.sg-iconbtn--night { background: rgba(255,255,255,.12); color: #fff; backdrop-filter: blur(8px); }
.sg-iconbtn--night:hover { background: rgba(255,255,255,.2); }
.sg-iconbtn[disabled] { opacity: .4; pointer-events: none; }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-iconbtn-css')) {
  const s = document.createElement('style');
  s.id = 'sg-iconbtn-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function IconButton({
  children,
  icon,
  variant = 'ghost',
  size = 'md',
  round = false,
  className = '',
  ...rest
}) {
  const cls = ['sg-iconbtn', `sg-iconbtn--${variant}`, `sg-iconbtn--${size}`, round ? 'sg-iconbtn--round' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cls
  }, rest), icon || children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-progress { display: flex; flex-direction: column; gap: 6px; width: 100%; }
.sg-progress__head { display: flex; justify-content: space-between; align-items: baseline; }
.sg-progress__label { font-family: var(--font-display); font-weight: 600; font-size: 13px; color: var(--text-secondary); }
.sg-progress__value { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
.sg-progress__track { width: 100%; background: var(--surface-sunken); border-radius: var(--radius-pill); overflow: hidden; box-shadow: inset 0 1px 2px rgba(20,26,33,.08); }
.sg-progress__fill { height: 100%; border-radius: var(--radius-pill); transition: width .6s cubic-bezier(.2,.8,.2,1); position: relative; }
.sg-progress__fill::after { content:''; position:absolute; inset:0 0 auto 0; height:45%; border-radius: inherit; background: linear-gradient(rgba(255,255,255,.35), rgba(255,255,255,0)); }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-progress-css')) {
  const s = document.createElement('style');
  s.id = 'sg-progress-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function ProgressBar({
  value = 0,
  max = 100,
  color = 'var(--brand)',
  height = 10,
  label,
  valueText,
  showValue = false,
  className = '',
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['sg-progress', className].filter(Boolean).join(' ')
  }, rest), (label || showValue) && /*#__PURE__*/React.createElement("div", {
    className: "sg-progress__head"
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "sg-progress__label"
  }, label), showValue && /*#__PURE__*/React.createElement("span", {
    className: "sg-progress__value"
  }, valueText ?? `${value} / ${max}`)), /*#__PURE__*/React.createElement("div", {
    className: "sg-progress__track",
    style: {
      height
    },
    role: "progressbar",
    "aria-valuenow": value,
    "aria-valuemax": max
  }, /*#__PURE__*/React.createElement("div", {
    className: "sg-progress__fill",
    style: {
      width: `${pct}%`,
      background: color
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/core/StatTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-stat {
  display: flex; flex-direction: column; justify-content: center; gap: 4px;
  background: var(--surface-card); border-radius: var(--radius-lg);
  padding: 16px; box-shadow: inset 0 0 0 1px var(--border-subtle);
  min-width: 0;
}
.sg-stat__top { display: flex; align-items: center; gap: 8px; }
.sg-stat__icon { width: 30px; height: 30px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; flex: none; }
.sg-stat__icon svg { width: 18px; height: 18px; }
.sg-stat__value { font-family: var(--font-display); font-weight: 700; font-size: 28px; line-height: 1; color: var(--text-primary); font-variant-numeric: tabular-nums; }
.sg-stat__label { font-size: 12px; color: var(--text-muted); font-weight: 500; }
.sg-stat--center { align-items: center; text-align: center; }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-stat-css')) {
  const s = document.createElement('style');
  s.id = 'sg-stat-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function StatTile({
  value,
  label,
  icon,
  color = 'var(--brand)',
  center = false,
  className = '',
  ...rest
}) {
  const cls = ['sg-stat', center ? 'sg-stat--center' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "sg-stat__top"
  }, icon && /*#__PURE__*/React.createElement("span", {
    className: "sg-stat__icon",
    style: {
      background: `color-mix(in srgb, ${color} 14%, white)`,
      color
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    className: "sg-stat__value"
  }, value)), label && /*#__PURE__*/React.createElement("span", {
    className: "sg-stat__label"
  }, label));
}
Object.assign(__ds_scope, { StatTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatTile.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-tag {
  display: inline-flex; align-items: center; gap: 7px;
  font-family: var(--font-display); font-weight: 600; font-size: 14px;
  padding: 8px 14px; border-radius: var(--radius-pill); cursor: pointer;
  background: var(--surface-card); color: var(--text-secondary);
  box-shadow: inset 0 0 0 1px var(--border-default);
  transition: transform .1s ease, background .12s ease, box-shadow .12s ease, color .12s ease;
  white-space: nowrap; user-select: none;
}
.sg-tag svg { width: 1.15em; height: 1.15em; }
.sg-tag:hover { background: var(--surface-sunken); }
.sg-tag:active { transform: scale(.96); }
.sg-tag__count { font-family: var(--font-mono); font-size: 12px; opacity: .7; }
.sg-tag.is-selected { color: #fff; box-shadow: none; }
.sg-tag.is-selected .sg-tag__count { opacity: .85; }
.sg-tag:focus-visible { box-shadow: var(--focus-ring); }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-tag-css')) {
  const s = document.createElement('style');
  s.id = 'sg-tag-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function Tag({
  children,
  selected = false,
  color = 'var(--brand)',
  icon,
  count,
  className = '',
  ...rest
}) {
  const style = selected ? {
    background: color
  } : {};
  const cls = ['sg-tag', selected ? 'is-selected' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: cls,
    style: style,
    "aria-pressed": selected
  }, rest), icon, children, count != null && /*#__PURE__*/React.createElement("span", {
    className: "sg-tag__count"
  }, count));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-field { display: flex; flex-direction: column; gap: 6px; }
.sg-field__label { font-family: var(--font-display); font-weight: 600; font-size: 13px; color: var(--text-secondary); }
.sg-input {
  display: flex; align-items: center; gap: 10px;
  background: var(--surface-card); border-radius: var(--radius-md);
  box-shadow: inset 0 0 0 1.5px var(--border-default);
  padding: 0 14px; height: 48px;
  transition: box-shadow .12s ease, background .12s ease;
}
.sg-input:focus-within { box-shadow: inset 0 0 0 2px var(--brand), var(--focus-ring); }
.sg-input--error { box-shadow: inset 0 0 0 2px var(--danger-500); }
.sg-input__icon { color: var(--text-muted); display: inline-flex; }
.sg-input__icon svg { width: 20px; height: 20px; }
.sg-input input {
  border: none; outline: none; background: transparent; flex: 1; min-width: 0;
  font-family: var(--font-body); font-size: 16px; color: var(--text-primary);
}
.sg-input input::placeholder { color: var(--text-muted); }
.sg-input--mono input { font-family: var(--font-mono); font-variant-numeric: tabular-nums; letter-spacing: .02em; }
.sg-field__hint { font-size: 12px; color: var(--text-muted); }
.sg-field__hint--error { color: var(--danger-500); }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-input-css')) {
  const s = document.createElement('style');
  s.id = 'sg-input-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function Input({
  label,
  hint,
  error,
  leadingIcon,
  trailingIcon,
  mono = false,
  className = '',
  id,
  ...rest
}) {
  const fieldId = id || (label ? `f-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  return /*#__PURE__*/React.createElement("div", {
    className: ['sg-field', className].filter(Boolean).join(' ')
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "sg-field__label",
    htmlFor: fieldId
  }, label), /*#__PURE__*/React.createElement("div", {
    className: ['sg-input', error ? 'sg-input--error' : '', mono ? 'sg-input--mono' : ''].filter(Boolean).join(' ')
  }, leadingIcon && /*#__PURE__*/React.createElement("span", {
    className: "sg-input__icon"
  }, leadingIcon), /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId
  }, rest)), trailingIcon && /*#__PURE__*/React.createElement("span", {
    className: "sg-input__icon"
  }, trailingIcon)), (error || hint) && /*#__PURE__*/React.createElement("span", {
    className: ['sg-field__hint', error ? 'sg-field__hint--error' : ''].filter(Boolean).join(' ')
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-seg {
  display: inline-flex; background: var(--surface-sunken);
  border-radius: var(--radius-pill); padding: 4px; gap: 2px;
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}
.sg-seg--full { display: flex; width: 100%; }
.sg-seg__btn {
  flex: 1; border: none; cursor: pointer; background: transparent;
  font-family: var(--font-display); font-weight: 600; font-size: 14px;
  color: var(--text-secondary); padding: 8px 16px; border-radius: var(--radius-pill);
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  transition: color .12s ease, background .15s ease, box-shadow .15s ease;
  white-space: nowrap;
}
.sg-seg__btn svg { width: 16px; height: 16px; }
.sg-seg__btn:hover:not(.is-active) { color: var(--text-primary); }
.sg-seg__btn.is-active { background: var(--surface-card); color: var(--text-brand); box-shadow: var(--shadow-sm); }
.sg-seg__btn:focus-visible { box-shadow: var(--focus-ring); }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-seg-css')) {
  const s = document.createElement('style');
  s.id = 'sg-seg-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function SegmentedControl({
  options = [],
  value,
  onChange,
  fullWidth = false,
  className = '',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['sg-seg', fullWidth ? 'sg-seg--full' : '', className].filter(Boolean).join(' '),
    role: "tablist"
  }, rest), options.map(opt => {
    const active = opt.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: opt.value,
      type: "button",
      role: "tab",
      "aria-selected": active,
      className: ['sg-seg__btn', active ? 'is-active' : ''].filter(Boolean).join(' '),
      onClick: () => onChange && onChange(opt.value)
    }, opt.icon, opt.label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-switch { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
.sg-switch__track {
  width: 48px; height: 28px; border-radius: var(--radius-pill);
  background: var(--slate-300); position: relative; flex: none;
  transition: background .18s ease;
}
.sg-switch__thumb {
  position: absolute; top: 3px; left: 3px; width: 22px; height: 22px;
  border-radius: 50%; background: #fff; box-shadow: var(--shadow-sm);
  transition: transform .18s cubic-bezier(.3,1.3,.6,1);
}
.sg-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
.sg-switch input:checked + .sg-switch__track { background: var(--brand); }
.sg-switch input:checked + .sg-switch__track .sg-switch__thumb { transform: translateX(20px); }
.sg-switch input:focus-visible + .sg-switch__track { box-shadow: var(--focus-ring); }
.sg-switch input:disabled + .sg-switch__track { opacity: .5; }
.sg-switch__label { font-size: 15px; color: var(--text-primary); font-weight: 500; }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-switch-css')) {
  const s = document.createElement('style');
  s.id = 'sg-switch-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function Switch({
  checked,
  defaultChecked,
  onChange,
  label,
  disabled,
  className = '',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: ['sg-switch', className].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    checked: checked,
    defaultChecked: defaultChecked,
    onChange: onChange,
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "sg-switch__track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sg-switch__thumb"
  })), label && /*#__PURE__*/React.createElement("span", {
    className: "sg-switch__label"
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/game/AchievementBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-ach { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; width: 100%; }
.sg-ach__medal {
  position: relative; width: var(--_sz, 72px); height: var(--_sz, 72px); flex: none;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--_t) 30%, white), color-mix(in srgb, var(--_t) 12%, white));
  box-shadow: inset 0 0 0 2.5px var(--_t), 0 6px 14px color-mix(in srgb, var(--_t) 28%, transparent);
  color: var(--_t);
}
.sg-ach__medal svg { width: 44%; height: 44%; }
.sg-ach__count {
  position: absolute; bottom: -4px; right: -4px;
  background: var(--surface-card); color: var(--text-secondary);
  font-family: var(--font-mono); font-weight: 700; font-size: 11px; font-variant-numeric: tabular-nums;
  border-radius: var(--radius-pill); padding: 2px 7px; box-shadow: var(--shadow-sm);
}
.sg-ach__check {
  position: absolute; bottom: -4px; right: -4px; width: 24px; height: 24px;
  background: var(--green-500); border: 2.5px solid var(--surface-card); border-radius: 50%;
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.sg-ach__check svg { width: 13px; height: 13px; }
.sg-ach__title { font-family: var(--font-display); font-weight: 600; font-size: 13px; color: var(--text-primary); line-height: 1.2; }
.sg-ach__desc { font-size: 11px; color: var(--text-muted); line-height: 1.3; }

.sg-ach--locked .sg-ach__medal { background: var(--surface-sunken); box-shadow: inset 0 0 0 2px var(--border-default); color: var(--slate-300); filter: none; }
.sg-ach--locked .sg-ach__title { color: var(--text-secondary); }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-ach-css')) {
  const s = document.createElement('style');
  s.id = 'sg-ach-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
const TIER = {
  common: 'var(--rarity-common)',
  rare: 'var(--rarity-rare)',
  epic: 'var(--rarity-epic)',
  legendary: 'var(--rarity-legendary)'
};
function AchievementBadge({
  title,
  description,
  icon,
  tier = 'legendary',
  size = 72,
  unlocked = false,
  value,
  max,
  className = '',
  ...rest
}) {
  const color = TIER[tier] || tier;
  const showCount = !unlocked && value != null && max != null;
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['sg-ach', unlocked ? '' : 'sg-ach--locked', className].filter(Boolean).join(' '),
    style: {
      '--_t': color,
      '--_sz': `${size}px`
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "sg-ach__medal"
  }, unlocked ? icon : /*#__PURE__*/React.createElement("i", {
    "data-lucide": "lock"
  }), unlocked && /*#__PURE__*/React.createElement("span", {
    className: "sg-ach__check"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "check"
  })), showCount && /*#__PURE__*/React.createElement("span", {
    className: "sg-ach__count"
  }, value, "/", max)), title && /*#__PURE__*/React.createElement("span", {
    className: "sg-ach__title"
  }, title), description && /*#__PURE__*/React.createElement("span", {
    className: "sg-ach__desc"
  }, description));
}
Object.assign(__ds_scope, { AchievementBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/AchievementBadge.jsx", error: String((e && e.message) || e) }); }

// components/game/BottomNav.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-bnav {
  display: flex; align-items: flex-end; justify-content: space-around;
  background: var(--surface-card); height: var(--bottom-nav-h, 76px);
  box-shadow: 0 -2px 10px rgba(20,26,33,.07), inset 0 1px 0 var(--border-subtle);
  padding: 0 6px; position: relative;
}
.sg-bnav__item {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px; border: none; background: transparent; cursor: pointer; padding: 0;
  height: 100%; color: var(--text-muted); position: relative;
  transition: color .12s ease;
}
.sg-bnav__item svg { width: 24px; height: 24px; transition: transform .15s cubic-bezier(.3,1.3,.6,1); }
.sg-bnav__item span { font-family: var(--font-display); font-weight: 600; font-size: 11px; line-height: 1; }
.sg-bnav__item:hover { color: var(--text-secondary); }
.sg-bnav__item.is-active { color: var(--brand); }
.sg-bnav__item.is-active svg { transform: translateY(-1px) scale(1.08); }
.sg-bnav__badge {
  position: absolute; top: 12px; left: 50%; margin-left: 6px;
  min-width: 16px; height: 16px; padding: 0 4px; border-radius: var(--radius-pill);
  background: var(--danger-500); color: #fff; font-family: var(--font-display);
  font-weight: 700; font-size: 10px; display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--surface-card);
}

/* Elevated center FAB (camera) */
.sg-bnav__fab-slot { flex: 1; display: flex; justify-content: center; position: relative; }
.sg-bnav__fab {
  position: absolute; bottom: 16px; width: 62px; height: 62px; border-radius: 50%;
  border: none; cursor: pointer; background: var(--brand); color: #fff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 0 var(--brand-shadow), var(--shadow-brand);
  border: 4px solid var(--surface-card);
  transition: transform .12s cubic-bezier(.3,1.2,.5,1), box-shadow .12s ease, background .12s ease;
}
.sg-bnav__fab svg { width: 28px; height: 28px; }
.sg-bnav__fab:hover { background: var(--brand-hover); }
.sg-bnav__fab:active { transform: translateY(4px); box-shadow: 0 2px 0 var(--brand-shadow); }
.sg-bnav__fab-label { position: absolute; bottom: -2px; font-family: var(--font-display); font-weight: 600; font-size: 11px; color: var(--brand); }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-bnav-css')) {
  const s = document.createElement('style');
  s.id = 'sg-bnav-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function BottomNav({
  items = [],
  value,
  onChange,
  className = '',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    className: ['sg-bnav', className].filter(Boolean).join(' ')
  }, rest), items.map(it => {
    if (it.fab) {
      return /*#__PURE__*/React.createElement("div", {
        className: "sg-bnav__fab-slot",
        key: it.id
      }, /*#__PURE__*/React.createElement("button", {
        type: "button",
        className: "sg-bnav__fab",
        "aria-label": it.label,
        onClick: () => onChange && onChange(it.id)
      }, it.icon));
    }
    const active = it.id === value;
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      key: it.id,
      className: ['sg-bnav__item', active ? 'is-active' : ''].filter(Boolean).join(' '),
      "aria-current": active ? 'page' : undefined,
      onClick: () => onChange && onChange(it.id)
    }, it.icon, /*#__PURE__*/React.createElement("span", null, it.label), it.badge != null && /*#__PURE__*/React.createElement("span", {
      className: "sg-bnav__badge"
    }, it.badge));
  }));
}
Object.assign(__ds_scope, { BottomNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/BottomNav.jsx", error: String((e && e.message) || e) }); }

// components/game/ChallengeCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-quest {
  display: flex; align-items: center; gap: 13px;
  background: var(--surface-card); border-radius: var(--radius-lg);
  box-shadow: inset 0 0 0 1px var(--border-subtle), var(--shadow-sm);
  padding: 13px 14px; width: 100%; text-align: left; border: none; font-family: var(--font-body);
  transition: transform .12s ease, box-shadow .12s ease;
}
button.sg-quest { cursor: pointer; }
button.sg-quest:hover { box-shadow: inset 0 0 0 1px var(--border-default), var(--shadow-md); }
button.sg-quest:active { transform: scale(.99); }
.sg-quest__icon { width: 44px; height: 44px; flex: none; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--_c, var(--brand)) 14%, white); color: var(--_c, var(--brand)); }
.sg-quest__icon svg { width: 22px; height: 22px; }
.sg-quest__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 7px; }
.sg-quest__top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.sg-quest__title { font-family: var(--font-display); font-weight: 600; font-size: 15px; color: var(--text-primary); line-height: 1.2; }
.sg-quest__reward { display: inline-flex; align-items: center; gap: 3px; font-family: var(--font-display); font-weight: 700; font-size: 12px; color: var(--gold-700); background: var(--xp-subtle); padding: 3px 8px; border-radius: var(--radius-pill); flex: none; }
.sg-quest__reward svg { width: 12px; height: 12px; }
.sg-quest__progrow { display: flex; align-items: center; gap: 9px; }
.sg-quest__track { flex: 1; height: 8px; background: var(--surface-sunken); border-radius: var(--radius-pill); overflow: hidden; box-shadow: inset 0 1px 2px rgba(20,26,33,.08); }
.sg-quest__fill { height: 100%; border-radius: var(--radius-pill); background: var(--_c, var(--brand)); transition: width .6s cubic-bezier(.2,.8,.2,1); }
.sg-quest__count { font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary); font-variant-numeric: tabular-nums; flex: none; }

.sg-quest--done { box-shadow: inset 0 0 0 1.5px var(--success-soft), var(--shadow-sm); }
.sg-quest--done .sg-quest__icon { background: var(--success-soft); color: var(--green-600); }
.sg-quest--done .sg-quest__title { color: var(--text-secondary); }
.sg-quest__check { display: inline-flex; align-items: center; gap: 4px; font-family: var(--font-display); font-weight: 700; font-size: 12px; color: var(--green-600); flex:none; }
.sg-quest__check svg { width: 14px; height: 14px; }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-quest-css')) {
  const s = document.createElement('style');
  s.id = 'sg-quest-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function ChallengeCard({
  title,
  icon,
  color = 'var(--brand)',
  value = 0,
  max = 1,
  reward,
  done = false,
  as = 'div',
  className = '',
  ...rest
}) {
  const Tag = as;
  const pct = Math.max(0, Math.min(100, value / max * 100));
  const complete = done || value >= max;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: ['sg-quest', complete ? 'sg-quest--done' : '', className].filter(Boolean).join(' '),
    style: {
      '--_c': color
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "sg-quest__icon"
  }, complete ? /*#__PURE__*/React.createElement("i", {
    "data-lucide": "check"
  }) : icon), /*#__PURE__*/React.createElement("span", {
    className: "sg-quest__body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sg-quest__top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sg-quest__title"
  }, title), reward != null && /*#__PURE__*/React.createElement("span", {
    className: "sg-quest__reward"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "zap"
  }), "+", reward, " XP")), /*#__PURE__*/React.createElement("span", {
    className: "sg-quest__progrow"
  }, complete ? /*#__PURE__*/React.createElement("span", {
    className: "sg-quest__check"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "check-circle-2"
  }), "Spln\u011Bno") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "sg-quest__track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sg-quest__fill",
    style: {
      width: `${pct}%`
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "sg-quest__count"
  }, value, "/", max)))));
}
Object.assign(__ds_scope, { ChallengeCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/ChallengeCard.jsx", error: String((e && e.message) || e) }); }

// components/game/LevelRing.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-ring { position: relative; display: inline-flex; align-items: center; justify-content: center; flex: none; }
.sg-ring svg { transform: rotate(-90deg); display: block; }
.sg-ring__track { fill: none; stroke: var(--surface-sunken); }
.sg-ring__fill { fill: none; stroke-linecap: round; transition: stroke-dashoffset .7s cubic-bezier(.2,.8,.2,1); }
.sg-ring__center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; }
.sg-ring__eyebrow { font-family: var(--font-display); font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted); line-height: 1; }
.sg-ring__value { font-family: var(--font-display); font-weight: 700; color: var(--text-primary); line-height: 1; font-variant-numeric: tabular-nums; }
.sg-ring__sub { font-family: var(--font-mono); color: var(--text-muted); font-variant-numeric: tabular-nums; line-height: 1; }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-ring-css')) {
  const s = document.createElement('style');
  s.id = 'sg-ring-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function LevelRing({
  level,
  value = 0,
  max = 100,
  size = 96,
  stroke = 9,
  color = 'var(--xp)',
  label = 'Level',
  subText,
  className = '',
  ...rest
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const offset = c * (1 - pct);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['sg-ring', className].filter(Boolean).join(' '),
    style: {
      width: size,
      height: size
    }
  }, rest), /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size
  }, /*#__PURE__*/React.createElement("circle", {
    className: "sg-ring__track",
    cx: size / 2,
    cy: size / 2,
    r: r,
    strokeWidth: stroke
  }), /*#__PURE__*/React.createElement("circle", {
    className: "sg-ring__fill",
    cx: size / 2,
    cy: size / 2,
    r: r,
    strokeWidth: stroke,
    stroke: color,
    strokeDasharray: c,
    strokeDashoffset: offset
  })), /*#__PURE__*/React.createElement("div", {
    className: "sg-ring__center"
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "sg-ring__eyebrow",
    style: {
      fontSize: size * 0.11
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "sg-ring__value",
    style: {
      fontSize: size * 0.34
    }
  }, level), subText && /*#__PURE__*/React.createElement("span", {
    className: "sg-ring__sub",
    style: {
      fontSize: size * 0.11
    }
  }, subText)));
}
Object.assign(__ds_scope, { LevelRing });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/LevelRing.jsx", error: String((e && e.message) || e) }); }

// components/game/VehicleCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-vcard {
  position: relative; display: flex; flex-direction: column;
  background: var(--surface-card); border-radius: var(--radius-lg);
  box-shadow: inset 0 0 0 2px var(--_cat, var(--border-default)), var(--shadow-sm);
  overflow: clip; cursor: pointer; text-align: left; border: none; padding: 0;
  font-family: var(--font-body);
  transition: transform .14s cubic-bezier(.3,1,.5,1), box-shadow .14s ease;
}
.sg-vcard:hover { transform: translateY(-3px); box-shadow: inset 0 0 0 2px var(--_cat), var(--shadow-lg); }
.sg-vcard:active { transform: translateY(0); }
.sg-vcard__media { position: relative; aspect-ratio: 4 / 3; background: var(--surface-sunken); overflow: hidden; }
.sg-vcard__media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sg-vcard__media-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: color-mix(in srgb, var(--_cat) 55%, var(--slate-300)); background: color-mix(in srgb, var(--_cat) 8%, white); }
.sg-vcard__media-fallback svg { width: 42%; height: 42%; }
.sg-vcard__catchip {
  position: absolute; top: 10px; left: 10px;
  display: inline-flex; align-items: center; gap: 5px;
  background: var(--_cat); color: #fff; font-family: var(--font-display);
  font-weight: 600; font-size: 11px; padding: 4px 9px; border-radius: var(--radius-pill);
  box-shadow: var(--shadow-sm);
}
.sg-vcard__catchip svg { width: 13px; height: 13px; }
.sg-vcard__rarity {
  position: absolute; top: 10px; right: 10px; width: 22px; height: 22px;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: var(--_rarity, var(--rarity-common)); box-shadow: var(--shadow-sm);
}
.sg-vcard__rarity svg { width: 13px; height: 13px; color: #fff; }
.sg-vcard__new {
  position: absolute; bottom: 10px; left: 10px;
  background: var(--xp); color: #4a2d00; font-family: var(--font-display);
  font-weight: 700; font-size: 10px; letter-spacing: .04em; text-transform: uppercase;
  padding: 4px 8px; border-radius: var(--radius-pill); box-shadow: var(--shadow-gold);
}
.sg-vcard__body { padding: 12px 13px 14px; display: flex; flex-direction: column; gap: 3px; }
.sg-vcard__code { font-family: var(--font-mono); font-weight: 700; font-size: 16px; color: var(--text-primary); font-variant-numeric: tabular-nums; letter-spacing: -.01em; }
.sg-vcard__operator { font-size: 12px; color: var(--text-muted); }
.sg-vcard__meta { display: flex; align-items: center; gap: 5px; margin-top: 5px; font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }
.sg-vcard__meta svg { width: 12px; height: 12px; }

/* Locked / undiscovered */
.sg-vcard--locked { box-shadow: inset 0 0 0 2px var(--border-default); cursor: default; }
.sg-vcard--locked .sg-vcard__media { background: var(--surface-sunken); }
.sg-vcard--locked .sg-vcard__media-fallback { color: var(--slate-300); background: var(--surface-sunken); }
.sg-vcard--locked:hover { transform: none; box-shadow: inset 0 0 0 2px var(--border-default); }
.sg-vcard--locked .sg-vcard__lockwrap { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--slate-300); }
.sg-vcard--locked .sg-vcard__lockwrap svg { width: 30px; height: 30px; }
.sg-vcard__unknown { font-family: var(--font-mono); font-size: 14px; color: var(--text-muted); }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-vcard-css')) {
  const s = document.createElement('style');
  s.id = 'sg-vcard-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
const RARITY = {
  common: 'var(--rarity-common)',
  rare: 'var(--rarity-rare)',
  epic: 'var(--rarity-epic)',
  legendary: 'var(--rarity-legendary)'
};
function VehicleCard({
  type,
  number,
  operator,
  category = 'Tramvaj',
  categoryColor = 'var(--cat-tram)',
  categoryIcon,
  image,
  rarity,
  found,
  isNew = false,
  locked = false,
  className = '',
  ...rest
}) {
  const vars = {
    '--_cat': categoryColor,
    '--_rarity': rarity ? RARITY[rarity] || rarity : undefined
  };
  if (locked) {
    return /*#__PURE__*/React.createElement("div", _extends({
      className: ['sg-vcard', 'sg-vcard--locked', className].filter(Boolean).join(' '),
      style: vars
    }, rest), /*#__PURE__*/React.createElement("div", {
      className: "sg-vcard__media"
    }, /*#__PURE__*/React.createElement("div", {
      className: "sg-vcard__lockwrap"
    }, /*#__PURE__*/React.createElement("i", {
      "data-lucide": "lock"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "sg-vcard__body"
    }, /*#__PURE__*/React.createElement("span", {
      className: "sg-vcard__unknown"
    }, "??? #????"), /*#__PURE__*/React.createElement("span", {
      className: "sg-vcard__operator"
    }, "Zat\xEDm neobjeveno")));
  }
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: ['sg-vcard', className].filter(Boolean).join(' '),
    style: vars
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "sg-vcard__media"
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: `${type} ${number}`
  }) : /*#__PURE__*/React.createElement("div", {
    className: "sg-vcard__media-fallback"
  }, categoryIcon || /*#__PURE__*/React.createElement("i", {
    "data-lucide": "tram-front"
  })), /*#__PURE__*/React.createElement("span", {
    className: "sg-vcard__catchip"
  }, categoryIcon, category), rarity && /*#__PURE__*/React.createElement("span", {
    className: "sg-vcard__rarity"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "star"
  })), isNew && /*#__PURE__*/React.createElement("span", {
    className: "sg-vcard__new"
  }, "Nov\xFD objev!")), /*#__PURE__*/React.createElement("div", {
    className: "sg-vcard__body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sg-vcard__code"
  }, type, " #", number), operator && /*#__PURE__*/React.createElement("span", {
    className: "sg-vcard__operator"
  }, operator), found && /*#__PURE__*/React.createElement("span", {
    className: "sg-vcard__meta"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "calendar-check"
  }), found)));
}
Object.assign(__ds_scope, { VehicleCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/VehicleCard.jsx", error: String((e && e.message) || e) }); }

// design_handoff_sotogo_login/design-system/components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-btn {
  --_depth: var(--press-depth, 4px);
  font-family: var(--font-display);
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  white-space: nowrap;
  text-decoration: none;
  transition: transform .12s cubic-bezier(.3,1.2,.5,1), box-shadow .12s ease, background .12s ease;
  user-select: none;
}
.sg-btn:focus-visible { box-shadow: var(--focus-ring); }
.sg-btn--sm { height: 36px; padding: 0 14px; font-size: 14px; border-radius: var(--radius-sm); }
.sg-btn--md { height: 44px; padding: 0 18px; font-size: 15px; }
.sg-btn--lg { height: 54px; padding: 0 24px; font-size: 17px; }
.sg-btn--full { width: 100%; }
.sg-btn__icon { display: inline-flex; }
.sg-btn__icon svg { width: 1.15em; height: 1.15em; display: block; }

.sg-btn--primary { background: var(--brand); color: var(--text-on-brand); box-shadow: 0 var(--_depth) 0 var(--brand-shadow), var(--shadow-sm); }
.sg-btn--primary:hover { background: var(--brand-hover); }
.sg-btn--primary:active { transform: translateY(var(--_depth)); box-shadow: 0 0 0 var(--brand-shadow); }

.sg-btn--reward { background: var(--xp); color: #4a2d00; box-shadow: 0 var(--_depth) 0 var(--xp-shadow), var(--shadow-sm); }
.sg-btn--reward:hover { background: var(--gold-400); }
.sg-btn--reward:active { transform: translateY(var(--_depth)); box-shadow: 0 0 0 var(--xp-shadow); }

.sg-btn--danger { background: var(--danger-500); color: #fff; box-shadow: 0 var(--_depth) 0 #9c160f, var(--shadow-sm); }
.sg-btn--danger:active { transform: translateY(var(--_depth)); box-shadow: 0 0 0 #9c160f; }

.sg-btn--secondary { background: var(--surface-card); color: var(--text-primary); box-shadow: inset 0 0 0 1px var(--border-default), var(--shadow-sm); }
.sg-btn--secondary:hover { background: var(--surface-sunken); }
.sg-btn--secondary:active { transform: translateY(1px); }

.sg-btn--ghost { background: transparent; color: var(--text-brand); }
.sg-btn--ghost:hover { background: var(--brand-subtle); }

.sg-btn[disabled] { opacity: .45; cursor: not-allowed; box-shadow: none; transform: none; pointer-events: none; }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-btn-css')) {
  const s = document.createElement('style');
  s.id = 'sg-btn-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  as = 'button',
  className = '',
  ...rest
}) {
  const Tag = as;
  const cls = ['sg-btn', `sg-btn--${variant}`, `sg-btn--${size}`, fullWidth ? 'sg-btn--full' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls
  }, rest), leadingIcon && /*#__PURE__*/React.createElement("span", {
    className: "sg-btn__icon"
  }, leadingIcon), children, trailingIcon && /*#__PURE__*/React.createElement("span", {
    className: "sg-btn__icon"
  }, trailingIcon));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "design_handoff_sotogo_login/design-system/components/core/Button.jsx", error: String((e && e.message) || e) }); }

// design_handoff_sotogo_login/design-system/components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-field { display: flex; flex-direction: column; gap: 6px; }
.sg-field__label { font-family: var(--font-display); font-weight: 600; font-size: 13px; color: var(--text-secondary); }
.sg-input {
  display: flex; align-items: center; gap: 10px;
  background: var(--surface-card); border-radius: var(--radius-md);
  box-shadow: inset 0 0 0 1.5px var(--border-default);
  padding: 0 14px; height: 48px;
  transition: box-shadow .12s ease, background .12s ease;
}
.sg-input:focus-within { box-shadow: inset 0 0 0 2px var(--brand), var(--focus-ring); }
.sg-input--error { box-shadow: inset 0 0 0 2px var(--danger-500); }
.sg-input__icon { color: var(--text-muted); display: inline-flex; }
.sg-input__icon svg { width: 20px; height: 20px; }
.sg-input input {
  border: none; outline: none; background: transparent; flex: 1; min-width: 0;
  font-family: var(--font-body); font-size: 16px; color: var(--text-primary);
}
.sg-input input::placeholder { color: var(--text-muted); }
.sg-input--mono input { font-family: var(--font-mono); font-variant-numeric: tabular-nums; letter-spacing: .02em; }
.sg-field__hint { font-size: 12px; color: var(--text-muted); }
.sg-field__hint--error { color: var(--danger-500); }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-input-css')) {
  const s = document.createElement('style');
  s.id = 'sg-input-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function Input({
  label,
  hint,
  error,
  leadingIcon,
  trailingIcon,
  mono = false,
  className = '',
  id,
  ...rest
}) {
  const fieldId = id || (label ? `f-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  return /*#__PURE__*/React.createElement("div", {
    className: ['sg-field', className].filter(Boolean).join(' ')
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "sg-field__label",
    htmlFor: fieldId
  }, label), /*#__PURE__*/React.createElement("div", {
    className: ['sg-input', error ? 'sg-input--error' : '', mono ? 'sg-input--mono' : ''].filter(Boolean).join(' ')
  }, leadingIcon && /*#__PURE__*/React.createElement("span", {
    className: "sg-input__icon"
  }, leadingIcon), /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId
  }, rest)), trailingIcon && /*#__PURE__*/React.createElement("span", {
    className: "sg-input__icon"
  }, trailingIcon)), (error || hint) && /*#__PURE__*/React.createElement("span", {
    className: ['sg-field__hint', error ? 'sg-field__hint--error' : ''].filter(Boolean).join(' ')
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "design_handoff_sotogo_login/design-system/components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// design_handoff_sotogo_login/design-system/components/forms/SegmentedControl.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-seg {
  display: inline-flex; background: var(--surface-sunken);
  border-radius: var(--radius-pill); padding: 4px; gap: 2px;
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}
.sg-seg--full { display: flex; width: 100%; }
.sg-seg__btn {
  flex: 1; border: none; cursor: pointer; background: transparent;
  font-family: var(--font-display); font-weight: 600; font-size: 14px;
  color: var(--text-secondary); padding: 8px 16px; border-radius: var(--radius-pill);
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  transition: color .12s ease, background .15s ease, box-shadow .15s ease;
  white-space: nowrap;
}
.sg-seg__btn svg { width: 16px; height: 16px; }
.sg-seg__btn:hover:not(.is-active) { color: var(--text-primary); }
.sg-seg__btn.is-active { background: var(--surface-card); color: var(--text-brand); box-shadow: var(--shadow-sm); }
.sg-seg__btn:focus-visible { box-shadow: var(--focus-ring); }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-seg-css')) {
  const s = document.createElement('style');
  s.id = 'sg-seg-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function SegmentedControl({
  options = [],
  value,
  onChange,
  fullWidth = false,
  className = '',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['sg-seg', fullWidth ? 'sg-seg--full' : '', className].filter(Boolean).join(' '),
    role: "tablist"
  }, rest), options.map(opt => {
    const active = opt.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: opt.value,
      type: "button",
      role: "tab",
      "aria-selected": active,
      className: ['sg-seg__btn', active ? 'is-active' : ''].filter(Boolean).join(' '),
      onClick: () => onChange && onChange(opt.value)
    }, opt.icon, opt.label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "design_handoff_sotogo_login/design-system/components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// design_handoff_sotogo_login/design-system/components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.sg-switch { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
.sg-switch__track {
  width: 48px; height: 28px; border-radius: var(--radius-pill);
  background: var(--slate-300); position: relative; flex: none;
  transition: background .18s ease;
}
.sg-switch__thumb {
  position: absolute; top: 3px; left: 3px; width: 22px; height: 22px;
  border-radius: 50%; background: #fff; box-shadow: var(--shadow-sm);
  transition: transform .18s cubic-bezier(.3,1.3,.6,1);
}
.sg-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
.sg-switch input:checked + .sg-switch__track { background: var(--brand); }
.sg-switch input:checked + .sg-switch__track .sg-switch__thumb { transform: translateX(20px); }
.sg-switch input:focus-visible + .sg-switch__track { box-shadow: var(--focus-ring); }
.sg-switch input:disabled + .sg-switch__track { opacity: .5; }
.sg-switch__label { font-size: 15px; color: var(--text-primary); font-weight: 500; }
`;
if (typeof document !== 'undefined' && !document.getElementById('sg-switch-css')) {
  const s = document.createElement('style');
  s.id = 'sg-switch-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function Switch({
  checked,
  defaultChecked,
  onChange,
  label,
  disabled,
  className = '',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: ['sg-switch', className].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    checked: checked,
    defaultChecked: defaultChecked,
    onChange: onChange,
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "sg-switch__track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sg-switch__thumb"
  })), label && /*#__PURE__*/React.createElement("span", {
    className: "sg-switch__label"
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "design_handoff_sotogo_login/design-system/components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// ui_kits/sotogo-app/CaptureSheet.jsx
try { (() => {
/* global React */
const {
  Button: SGButton
} = window.OtoGODesignSystem_f7ff63;

/* CaptureSheet — the camera quick-add flow: aim → scanning → "Nový objev!" reward. */
function CaptureSheet({
  onClose,
  onCatch
}) {
  const [phase, setPhase] = React.useState('aim'); // aim | scan | reward
  const cat = window.SG_DATA.CATS.tram;
  const vehicle = {
    type: '15T',
    number: '9325',
    operator: 'DPP',
    cat: 'tram'
  };
  React.useEffect(() => {
    lucide.createIcons();
  });
  React.useEffect(() => {
    if (phase === 'scan') {
      const t = setTimeout(() => setPhase('reward'), 1700);
      return () => clearTimeout(t);
    }
  }, [phase]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      background: phase === 'reward' ? 'var(--surface-night)' : '#0B0F14'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 16px',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 15
    }
  }, phase === 'reward' ? 'Nový objev!' : 'Vyfoť vozidlo'), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: 'rgba(255,255,255,.14)',
      border: 'none',
      color: '#fff',
      width: 34,
      height: 34,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "x",
    style: {
      width: 18,
      height: 18
    }
  }))), phase !== 'reward' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(circle at 50% 42%, #2a3340, #0b0f14 75%)'
    }
  }), /*#__PURE__*/React.createElement("i", {
    "data-lucide": cat.icon,
    style: {
      width: 130,
      height: 130,
      color: 'rgba(255,255,255,.18)',
      position: 'relative'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      width: 230,
      height: 150,
      border: '3px solid rgba(255,255,255,.5)',
      borderRadius: 18,
      boxShadow: '0 0 0 9999px rgba(0,0,0,.35)'
    }
  }, ['nw', 'ne', 'sw', 'se'].map(c => /*#__PURE__*/React.createElement("span", {
    key: c,
    style: {
      position: 'absolute',
      width: 22,
      height: 22,
      borderTop: c[0] === 'n' ? '4px solid var(--brand)' : 'none',
      borderBottom: c[0] === 's' ? '4px solid var(--brand)' : 'none',
      borderLeft: c[1] === 'w' ? '4px solid var(--brand)' : 'none',
      borderRight: c[1] === 'e' ? '4px solid var(--brand)' : 'none',
      [c[0] === 'n' ? 'top' : 'bottom']: -3,
      [c[1] === 'w' ? 'left' : 'right']: -3,
      borderRadius: 6
    }
  })), phase === 'scan' && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 3,
      background: 'var(--brand)',
      boxShadow: '0 0 12px var(--brand)',
      animation: 'sgscan 1.5s ease-in-out infinite'
    }
  })), phase === 'scan' && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 24,
      color: '#fff',
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "scan-line",
    style: {
      width: 16,
      height: 16
    }
  }), " \u010Ctu eviden\u010Dn\xED \u010D\xEDslo\u2026")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 26px'
    }
  }, /*#__PURE__*/React.createElement(SGButton, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    leadingIcon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "camera"
    }),
    onClick: () => setPhase('scan'),
    disabled: phase === 'scan'
  }, phase === 'scan' ? 'Skenuji…' : 'Vyfotit'))), phase === 'reward' && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 24px 30px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sg-reward-pop",
    style: {
      width: 118,
      height: 118,
      borderRadius: '50%',
      background: 'color-mix(in srgb, var(--cat-tram) 22%, transparent)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 22,
      boxShadow: '0 0 0 8px color-mix(in srgb, var(--cat-tram) 12%, transparent)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 84,
      height: 84,
      borderRadius: '50%',
      background: 'var(--cat-tram)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": cat.icon,
    style: {
      width: 44,
      height: 44
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      color: 'var(--gold-300)',
      marginBottom: 8
    }
  }, "Nov\xFD objev!"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 30,
      color: '#fff',
      letterSpacing: '-.01em'
    }
  }, vehicle.type, " #", vehicle.number), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-on-night-muted)',
      marginTop: 4,
      marginBottom: 18
    }
  }, "Tramvaj \xB7 ", vehicle.operator), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 20,
      color: '#4a2d00',
      background: 'var(--xp)',
      padding: '8px 18px',
      borderRadius: 'var(--radius-pill)',
      marginBottom: 30
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "zap",
    style: {
      width: 20,
      height: 20
    }
  }), " +100 XP"), /*#__PURE__*/React.createElement(SGButton, {
    variant: "reward",
    size: "lg",
    fullWidth: true,
    leadingIcon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "plus"
    }),
    onClick: () => {
      onCatch && onCatch();
      onClose();
    }
  }, "P\u0159idat do parku")));
}
window.CaptureSheet = CaptureSheet;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/sotogo-app/CaptureSheet.jsx", error: String((e && e.message) || e) }); }

// ui_kits/sotogo-app/MapScreen.jsx
try { (() => {
/* global React, L */
const {
  Badge: SGMapBadge
} = window.OtoGODesignSystem_f7ff63;
const LINE_COLOR = {
  A: 'var(--line-a)',
  B: 'var(--line-b)',
  C: 'var(--line-c)'
};
const LINE_HEX = {
  A: '#00A562',
  B: '#F7A600',
  C: '#D9282F'
};
function MapScreen() {
  const D = window.SG_DATA;
  const mapEl = React.useRef(null);
  const [sheet, setSheet] = React.useState(D.STOPS[0]);
  React.useEffect(() => {
    const map = L.map(mapEl.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([50.0865, 14.4330], 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    // player location — pulsing green dot
    const player = L.divIcon({
      className: '',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      html: `<div class="sg-player-dot"></div>`
    });
    L.marker([50.0890, 14.4395], {
      icon: player,
      zIndexOffset: 1000
    }).addTo(map);

    // stop markers
    D.STOPS.forEach(s => {
      const c = LINE_HEX[s.lines[0]] || '#43B02A';
      const icon = L.divIcon({
        className: '',
        iconSize: [34, 42],
        iconAnchor: [17, 42],
        html: `<div class="sg-stop-pin" style="--pin:${c}">
                <div class="sg-stop-pin__head"><span>${s.lines[0]}</span></div>
              </div>`
      });
      L.marker([s.lat, s.lng], {
        icon
      }).addTo(map).on('click', () => setSheet(s));
    });
    setTimeout(() => map.invalidateSize(), 60);
    return () => map.remove();
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: mapEl,
    style: {
      position: 'absolute',
      inset: 0,
      background: '#e9eef2',
      zIndex: 0,
      isolation: 'isolate'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      left: 12,
      right: 12,
      zIndex: 5,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sg-hud",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      pointerEvents: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 34,
      height: 34,
      borderRadius: '50%',
      background: 'var(--xp)',
      color: '#4a2d00',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 14,
      flex: 'none'
    }
  }, "12"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      color: 'var(--text-on-night-muted)',
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", null, "LEVEL 12"), /*#__PURE__*/React.createElement("span", null, "2480 / 3000 XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      background: 'rgba(255,255,255,.16)',
      borderRadius: '999px',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '82%',
      height: '100%',
      background: 'var(--xp)',
      borderRadius: '999px'
    }
  })))), /*#__PURE__*/React.createElement("div", {
    className: "sg-hud",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      padding: '10px 14px',
      pointerEvents: 'auto'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "search",
    style: {
      width: 18,
      height: 18,
      color: 'var(--text-on-night-muted)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-on-night-muted)',
      fontSize: 14
    }
  }, "Hledat zast\xE1vku nebo linku\u2026"))), /*#__PURE__*/React.createElement("button", {
    className: "sg-locate",
    style: {
      zIndex: 5
    },
    "aria-label": "Moje poloha"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "locate-fixed",
    style: {
      width: 22,
      height: 22
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 14,
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-lg)',
      padding: '14px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, sheet.lines.map(l => /*#__PURE__*/React.createElement("span", {
    key: l,
    style: {
      width: 26,
      height: 26,
      borderRadius: 7,
      background: LINE_COLOR[l],
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 14
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 16,
      color: 'var(--text-primary)'
    }
  }, sheet.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "navigation",
    style: {
      width: 12,
      height: 12
    }
  }), sheet.dist, " odsud")), sheet.visited ? /*#__PURE__*/React.createElement(SGMapBadge, {
    tone: "success",
    variant: "soft",
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "check"
    })
  }, "Nav\u0161t\xEDveno") : /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 13,
      color: 'var(--gold-700)',
      background: 'var(--xp-subtle)',
      padding: '6px 11px',
      borderRadius: '999px'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "zap",
    style: {
      width: 14,
      height: 14
    }
  }), "+", sheet.xp, " XP")))));
}
window.MapScreen = MapScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/sotogo-app/MapScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/sotogo-app/ParkScreen.jsx
try { (() => {
/* global React */
const SGP = window.OtoGODesignSystem_f7ff63;
function VehicleDetail({
  v,
  onClose
}) {
  const cat = window.SG_DATA.CATS[v.cat];
  React.useEffect(() => {
    lucide.createIcons();
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 30,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(11,15,20,.45)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
      padding: '10px 18px 24px',
      boxShadow: 'var(--shadow-xl)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 5,
      borderRadius: 999,
      background: 'var(--border-strong)',
      margin: '0 auto 16px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '16/10',
      borderRadius: 'var(--radius-lg)',
      background: `color-mix(in srgb, ${cat.color} 10%, white)`,
      boxShadow: `inset 0 0 0 2px ${cat.color}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: cat.color,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": cat.icon,
    style: {
      width: 84,
      height: 84
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 24,
      letterSpacing: '-.01em'
    }
  }, v.type, " #", v.number), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, cat.label, " \xB7 ", v.operator)), /*#__PURE__*/React.createElement(SGP.Badge, {
    color: cat.color,
    variant: "solid",
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": cat.icon
    })
  }, cat.label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(SGP.StatTile, {
    value: v.rarity === 'legendary' ? '★★★★' : v.rarity === 'epic' ? '★★★' : v.rarity === 'rare' ? '★★' : '★',
    label: "Vz\xE1cnost",
    color: `var(--rarity-${v.rarity})`,
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "star"
    })
  }), /*#__PURE__*/React.createElement(SGP.StatTile, {
    value: v.found,
    label: "Nalezeno",
    color: "var(--brand)",
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "calendar-check"
    })
  }))));
}
function ParkScreen() {
  const D = window.SG_DATA;
  const [filter, setFilter] = React.useState('all');
  const [view, setView] = React.useState('mrizka');
  const [detail, setDetail] = React.useState(null);
  React.useEffect(() => {
    lucide.createIcons();
  });
  const cats = Object.values(D.CATS);
  const counts = {};
  cats.forEach(c => counts[c.key] = D.VEHICLES.filter(v => v.cat === c.key).length);
  const list = D.VEHICLES.filter(v => filter === 'all' || v.cat === filter);
  const locked = filter === 'all' ? 4 : D.LOCKED_COUNT[filter] || 0;
  const totalFound = D.VEHICLES.length,
    totalAll = totalFound + Object.values(D.LOCKED_COUNT).reduce((a, b) => a + b, 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(window.TopBar, {
    title: "Vozov\xFD park",
    subtitle: `${totalFound} z ${totalAll} vozidel`
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '14px 16px 90px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'inset 0 0 0 1px var(--border-subtle)',
      padding: 14,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(SGP.ProgressBar, {
    value: totalFound,
    max: totalAll,
    color: "var(--brand)",
    label: "Dokon\u010Den\xED sb\xEDrky",
    showValue: true,
    valueText: `${Math.round(totalFound / totalAll * 100)} %`
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      paddingBottom: 10,
      margin: '0 -16px',
      padding: '0 16px 10px'
    }
  }, /*#__PURE__*/React.createElement(SGP.Tag, {
    selected: filter === 'all',
    color: "var(--brand)",
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "layout-grid"
    }),
    count: totalFound,
    onClick: () => setFilter('all')
  }, "V\u0161e"), cats.map(c => /*#__PURE__*/React.createElement(SGP.Tag, {
    key: c.key,
    selected: filter === c.key,
    color: c.color,
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": c.icon
    }),
    count: counts[c.key],
    onClick: () => setFilter(c.key)
  }, c.plural))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      margin: '4px 0 12px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, filter === 'all' ? 'Všechna vozidla' : D.CATS[filter].plural), /*#__PURE__*/React.createElement(SGP.SegmentedControl, {
    value: view,
    onChange: setView,
    options: [{
      value: 'mrizka',
      icon: /*#__PURE__*/React.createElement("i", {
        "data-lucide": "layout-grid"
      })
    }, {
      value: 'seznam',
      icon: /*#__PURE__*/React.createElement("i", {
        "data-lucide": "list"
      })
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: view === 'mrizka' ? '1fr 1fr' : '1fr',
      gap: 12
    }
  }, list.map(v => {
    const c = D.CATS[v.cat];
    return /*#__PURE__*/React.createElement(SGP.VehicleCard, {
      key: v.type + v.number,
      type: v.type,
      number: v.number,
      operator: v.operator,
      category: c.label,
      categoryColor: c.color,
      categoryIcon: /*#__PURE__*/React.createElement("i", {
        "data-lucide": c.icon
      }),
      rarity: v.rarity,
      found: v.found,
      isNew: v.isNew,
      onClick: () => setDetail(v)
    });
  }), Array.from({
    length: locked
  }).map((_, i) => /*#__PURE__*/React.createElement(SGP.VehicleCard, {
    key: 'lock' + i,
    locked: true,
    categoryColor: filter === 'all' ? 'var(--cat-train)' : D.CATS[filter].color
  })))), detail && /*#__PURE__*/React.createElement(VehicleDetail, {
    v: detail,
    onClose: () => setDetail(null)
  }));
}
window.ParkScreen = ParkScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/sotogo-app/ParkScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/sotogo-app/ProfilScreen.jsx
try { (() => {
/* global React */
const SGPr = window.OtoGODesignSystem_f7ff63;
function ProfilScreen() {
  const D = window.SG_DATA;
  const P = D.PLAYER;
  const [push, setPush] = React.useState(true);
  const [sound, setSound] = React.useState(true);
  React.useEffect(() => {
    lucide.createIcons();
  });
  const recent = D.VEHICLES.slice(0, 4);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(window.TopBar, {
    title: "Profil"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '18px 16px 90px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(SGPr.LevelRing, {
    level: P.level,
    value: P.xp,
    max: P.xpMax,
    size: 92,
    subText: `${P.xp}/${P.xpMax}`
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 22,
      lineHeight: 1.1
    }
  }, P.name), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      marginBottom: 8
    }
  }, P.handle), /*#__PURE__*/React.createElement(SGPr.Badge, {
    tone: "brand",
    variant: "solid",
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "award"
    })
  }, "\u0160otou\u0161 \xB7 Level ", P.level))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 10,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(SGPr.StatTile, {
    value: P.vehicles,
    label: "Vozidel",
    color: "var(--cat-tram)",
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "tram-front"
    })
  }), /*#__PURE__*/React.createElement(SGPr.StatTile, {
    value: P.stops,
    label: "Zast\xE1vek",
    color: "var(--brand)",
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "map-pin"
    })
  }), /*#__PURE__*/React.createElement(SGPr.StatTile, {
    value: P.streak,
    label: "dn\xED v s\xE9rii",
    color: "var(--xp)",
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "flame"
    })
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "Posledn\xED \xFAlovky"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 13,
      color: 'var(--text-brand)'
    }
  }, "V\u0161e v parku")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginBottom: 24
    }
  }, recent.map(v => {
    const c = D.CATS[v.cat];
    return /*#__PURE__*/React.createElement("div", {
      key: v.type + v.number,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'inset 0 0 0 1px var(--border-subtle)',
        padding: '10px 12px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 38,
        height: 38,
        borderRadius: 'var(--radius-sm)',
        background: `color-mix(in srgb, ${c.color} 14%, white)`,
        color: c.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement("i", {
      "data-lucide": c.icon,
      style: {
        width: 20,
        height: 20
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: 15
      }
    }, v.type, " #", v.number), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--text-muted)'
      }
    }, c.label, " \xB7 ", v.operator)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-muted)'
      }
    }, v.found));
  })), /*#__PURE__*/React.createElement("span", {
    className: "eyebrow",
    style: {
      display: 'block',
      marginBottom: 12
    }
  }, "Nastaven\xED"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'inset 0 0 0 1px var(--border-subtle)',
      overflow: 'hidden'
    }
  }, [{
    icon: 'bell',
    label: 'Push notifikace',
    el: /*#__PURE__*/React.createElement(SGPr.Switch, {
      checked: push,
      onChange: e => setPush(e.target.checked)
    })
  }, {
    icon: 'volume-2',
    label: 'Zvuky a vibrace',
    el: /*#__PURE__*/React.createElement(SGPr.Switch, {
      checked: sound,
      onChange: e => setSound(e.target.checked)
    })
  }, {
    icon: 'map',
    label: 'Offline mapa',
    el: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "chevron-right",
      style: {
        width: 18,
        height: 18,
        color: 'var(--text-muted)'
      }
    })
  }, {
    icon: 'shield',
    label: 'Soukromí',
    el: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "chevron-right",
      style: {
        width: 18,
        height: 18,
        color: 'var(--text-muted)'
      }
    })
  }].map((row, i, arr) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '13px 14px',
      borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": row.icon,
    style: {
      width: 20,
      height: 20,
      color: 'var(--text-secondary)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontWeight: 500,
      fontSize: 15
    }
  }, row.label), row.el)))));
}
window.ProfilScreen = ProfilScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/sotogo-app/ProfilScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/sotogo-app/TopBar.jsx
try { (() => {
/* global React */
const {
  Avatar: SGAvatar,
  Badge: SGBadge
} = window.OtoGODesignSystem_f7ff63;
function TopBar({
  title,
  subtitle
}) {
  const P = window.SG_DATA.PLAYER;
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      background: 'var(--surface-card)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement(SGAvatar, {
    name: P.name,
    size: 38,
    level: P.level
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 18,
      lineHeight: 1.1,
      color: 'var(--text-primary)'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, subtitle)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 13,
      color: 'var(--gold-700)',
      background: 'var(--xp-subtle)',
      padding: '5px 10px',
      borderRadius: 'var(--radius-pill)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "flame",
    style: {
      width: 15,
      height: 15
    }
  }), P.streak), /*#__PURE__*/React.createElement(SGBadge, {
    tone: "gold",
    variant: "solid",
    mono: true
  }, P.xpTotal.toLocaleString('cs-CZ'), " XP")));
}
window.TopBar = TopBar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/sotogo-app/TopBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/sotogo-app/VyzvyScreen.jsx
try { (() => {
/* global React */
const SGV = window.OtoGODesignSystem_f7ff63;
function VyzvyScreen() {
  const D = window.SG_DATA;
  React.useEffect(() => {
    lucide.createIcons();
  });
  const doneCount = D.CHALLENGES.filter(c => c.done).length;
  const unlocked = D.ACHIEVEMENTS.filter(a => a.unlocked).length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(window.TopBar, {
    title: "V\xFDzvy",
    subtitle: `${doneCount}/${D.CHALLENGES.length} denních splněno`
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '14px 16px 90px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: 'var(--surface-night)',
      color: 'var(--text-on-night)',
      borderRadius: 'var(--radius-lg)',
      padding: '14px 16px',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 'var(--radius-md)',
      background: 'rgba(245,163,0,.18)',
      color: 'var(--gold-300)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "calendar-clock",
    style: {
      width: 22,
      height: 22
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 15
    }
  }, "Denn\xED v\xFDzvy"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-on-night-muted)'
    }
  }, "Obnov\xED se za 6 h 12 min")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 20,
      color: 'var(--gold-300)'
    }
  }, "+430"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      color: 'var(--text-on-night-muted)'
    }
  }, "XP k z\xEDsk\xE1n\xED"))), /*#__PURE__*/React.createElement("span", {
    className: "eyebrow",
    style: {
      display: 'block',
      marginBottom: 10
    }
  }, "Dne\u0161n\xED \xFAkoly"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginBottom: 24
    }
  }, D.CHALLENGES.map((c, i) => /*#__PURE__*/React.createElement(SGV.ChallengeCard, {
    key: i,
    title: c.title,
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": c.icon
    }),
    color: c.cat ? D.CATS[c.cat].color : 'var(--brand)',
    value: c.value,
    max: c.max,
    reward: c.reward,
    done: c.done
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "Achievementy"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, unlocked, "/", D.ACHIEVEMENTS.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '18px 8px',
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'inset 0 0 0 1px var(--border-subtle)',
      padding: '20px 12px'
    }
  }, D.ACHIEVEMENTS.map((a, i) => /*#__PURE__*/React.createElement(SGV.AchievementBadge, {
    key: i,
    title: a.title,
    description: a.desc,
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": a.icon
    }),
    tier: a.tier,
    unlocked: a.unlocked,
    value: a.value,
    max: a.max,
    size: 64
  })))));
}
window.VyzvyScreen = VyzvyScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/sotogo-app/VyzvyScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/sotogo-app/app.jsx
try { (() => {
/* global React, ReactDOM */
const {
  BottomNav: SGBottomNav
} = window.OtoGODesignSystem_f7ff63;
function StatusBar({
  dark
}) {
  const color = dark ? '#fff' : 'var(--text-primary)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 22px 4px',
      color,
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 14,
      position: 'relative',
      zIndex: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, "9:41"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "signal",
    style: {
      width: 16,
      height: 16
    }
  }), /*#__PURE__*/React.createElement("i", {
    "data-lucide": "wifi",
    style: {
      width: 16,
      height: 16
    }
  }), /*#__PURE__*/React.createElement("i", {
    "data-lucide": "battery-full",
    style: {
      width: 20,
      height: 20
    }
  })));
}
function App() {
  const [tab, setTab] = React.useState('mapa');
  const [capture, setCapture] = React.useState(false);
  React.useEffect(() => {
    lucide.createIcons();
  });
  const onNav = id => {
    if (id === 'kamera') {
      setCapture(true);
      return;
    }
    setTab(id);
  };
  const isMap = tab === 'mapa';
  const Screen = {
    mapa: window.MapScreen,
    park: window.ParkScreen,
    vyzvy: window.VyzvyScreen,
    profil: window.ProfilScreen
  }[tab];
  return /*#__PURE__*/React.createElement("div", {
    className: "sg-phone"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sg-phone__notch"
  }), /*#__PURE__*/React.createElement("div", {
    className: "sg-screen",
    style: {
      background: isMap ? '#e9eef2' : 'var(--bg-app)'
    }
  }, /*#__PURE__*/React.createElement(StatusBar, {
    dark: false
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 'var(--bottom-nav-h)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      top: 32
    }
  }, /*#__PURE__*/React.createElement(Screen, {
    key: tab
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0
    }
  }, /*#__PURE__*/React.createElement(SGBottomNav, {
    value: tab,
    onChange: onNav,
    items: [{
      id: 'mapa',
      label: 'Mapa',
      icon: /*#__PURE__*/React.createElement("i", {
        "data-lucide": "map"
      })
    }, {
      id: 'park',
      label: 'Park',
      icon: /*#__PURE__*/React.createElement("i", {
        "data-lucide": "layout-grid"
      })
    }, {
      id: 'kamera',
      label: 'Kamera',
      icon: /*#__PURE__*/React.createElement("i", {
        "data-lucide": "camera"
      }),
      fab: true
    }, {
      id: 'vyzvy',
      label: 'Výzvy',
      icon: /*#__PURE__*/React.createElement("i", {
        "data-lucide": "target"
      }),
      badge: 2
    }, {
      id: 'profil',
      label: 'Profil',
      icon: /*#__PURE__*/React.createElement("i", {
        "data-lucide": "user"
      })
    }]
  })), capture && /*#__PURE__*/React.createElement(window.CaptureSheet, {
    onClose: () => setCapture(false),
    onCatch: () => setTab('park')
  })));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/sotogo-app/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/sotogo-app/data.js
try { (() => {
/* ŠotoGO app — fake data for the UI kit click-through */
(function () {
  const CATS = {
    tram: {
      key: 'tram',
      label: 'Tramvaj',
      plural: 'Tramvaje',
      color: 'var(--cat-tram)',
      soft: 'var(--cat-tram-soft)',
      icon: 'tram-front'
    },
    bus: {
      key: 'bus',
      label: 'Autobus',
      plural: 'Autobusy',
      color: 'var(--cat-bus)',
      soft: 'var(--cat-bus-soft)',
      icon: 'bus'
    },
    metro: {
      key: 'metro',
      label: 'Metro',
      plural: 'Metro',
      color: 'var(--cat-metro)',
      soft: 'var(--cat-metro-soft)',
      icon: 'train-front-tunnel'
    },
    trolley: {
      key: 'trolley',
      label: 'Trolejbus',
      plural: 'Trolejbusy',
      color: 'var(--cat-trolley)',
      soft: 'var(--cat-trolley-soft)',
      icon: 'bus-front'
    },
    train: {
      key: 'train',
      label: 'Vlak',
      plural: 'Vlaky',
      color: 'var(--cat-train)',
      soft: 'var(--cat-train-soft)',
      icon: 'train-front'
    }
  };
  const VEHICLES = [{
    cat: 'tram',
    type: '15T',
    number: '9325',
    operator: 'DPP',
    rarity: 'rare',
    found: '14. 5. 2026',
    isNew: true
  }, {
    cat: 'tram',
    type: '14T',
    number: '9112',
    operator: 'DPP',
    rarity: 'common',
    found: '12. 5. 2026'
  }, {
    cat: 'tram',
    type: 'T3R.PV',
    number: '8451',
    operator: 'DPP',
    rarity: 'epic',
    found: '9. 5. 2026'
  }, {
    cat: 'tram',
    type: 'KT8D5',
    number: '9048',
    operator: 'DPP',
    rarity: 'rare',
    found: '7. 5. 2026'
  }, {
    cat: 'bus',
    type: 'SOR NS 12',
    number: '3417',
    operator: 'DPP',
    rarity: 'common',
    found: '2. 5. 2026'
  }, {
    cat: 'bus',
    type: 'Citybus',
    number: '3290',
    operator: 'DPP',
    rarity: 'common',
    found: '1. 5. 2026'
  }, {
    cat: 'metro',
    type: '81-71M',
    number: '2042',
    operator: 'Metro',
    rarity: 'epic',
    found: '28. 4. 2026'
  }, {
    cat: 'metro',
    type: 'M1',
    number: '4108',
    operator: 'Metro',
    rarity: 'rare',
    found: '26. 4. 2026'
  }, {
    cat: 'train',
    type: '471 CityElefant',
    number: '042',
    operator: 'ČD',
    rarity: 'legendary',
    found: '20. 4. 2026'
  }, {
    cat: 'trolley',
    type: 'Škoda 24Tr',
    number: '2007',
    operator: 'DPO',
    rarity: 'epic',
    found: '18. 4. 2026'
  }];
  const LOCKED_COUNT = {
    tram: 6,
    bus: 9,
    metro: 3,
    trolley: 4,
    train: 7
  };
  const STOPS = [{
    name: 'Florenc',
    lines: ['B', 'C'],
    lat: 50.0897,
    lng: 14.4400,
    xp: 30,
    visited: true,
    dist: '40 m'
  }, {
    name: 'Náměstí Republiky',
    lines: ['B'],
    lat: 50.0884,
    lng: 14.4280,
    xp: 25,
    visited: false,
    dist: '320 m'
  }, {
    name: 'Můstek',
    lines: ['A', 'B'],
    lat: 50.0843,
    lng: 14.4214,
    xp: 25,
    visited: true,
    dist: '650 m'
  }, {
    name: 'Hlavní nádraží',
    lines: ['C'],
    lat: 50.0832,
    lng: 14.4355,
    xp: 35,
    visited: false,
    dist: '480 m'
  }, {
    name: 'Náměstí Míru',
    lines: ['A'],
    lat: 50.0758,
    lng: 14.4378,
    xp: 25,
    visited: false,
    dist: '1.2 km'
  }];
  const CHALLENGES = [{
    title: 'Navštiv zastávku Florenc',
    cat: 'metro',
    icon: 'map-pin',
    value: 1,
    max: 1,
    reward: 80,
    done: true
  }, {
    title: 'Najdi tramvaj 15T',
    cat: 'tram',
    icon: 'tram-front',
    value: 1,
    max: 1,
    reward: 100,
    done: true
  }, {
    title: 'Navštiv 5 nových zastávek',
    cat: null,
    icon: 'route',
    value: 3,
    max: 5,
    reward: 150,
    done: false
  }, {
    title: 'Najdi autobus SOR',
    cat: 'bus',
    icon: 'bus',
    value: 0,
    max: 1,
    reward: 100,
    done: false
  }];
  const ACHIEVEMENTS = [{
    title: 'Lovec tramvají',
    desc: 'Najdi 50 tramvají',
    icon: 'tram-front',
    tier: 'epic',
    unlocked: true
  }, {
    title: 'Metro expert',
    desc: 'Všechny soupravy',
    icon: 'train-front-tunnel',
    tier: 'rare',
    unlocked: true
  }, {
    title: 'První objev',
    desc: 'Vyfoť 1. vozidlo',
    icon: 'sparkles',
    tier: 'common',
    unlocked: true
  }, {
    title: 'Stálý cestující',
    desc: '7denní série',
    icon: 'flame',
    tier: 'rare',
    unlocked: true
  }, {
    title: 'Sběratel',
    desc: 'Najdi 100 vozidel',
    icon: 'layers',
    tier: 'epic',
    value: 74,
    max: 100
  }, {
    title: 'Šotouš roku',
    desc: 'Navštiv 500 zastávek',
    icon: 'crown',
    tier: 'legendary',
    value: 128,
    max: 500
  }];
  const PLAYER = {
    name: 'Petr Novák',
    handle: '@sotous_petr',
    level: 12,
    xp: 2480,
    xpMax: 3000,
    xpTotal: 18420,
    vehicles: 74,
    stops: 128,
    streak: 7
  };
  window.SG_DATA = {
    CATS,
    VEHICLES,
    LOCKED_COUNT,
    STOPS,
    CHALLENGES,
    ACHIEVEMENTS,
    PLAYER
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/sotogo-app/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.AchievementBadge = __ds_scope.AchievementBadge;

__ds_ns.BottomNav = __ds_scope.BottomNav;

__ds_ns.ChallengeCard = __ds_scope.ChallengeCard;

__ds_ns.LevelRing = __ds_scope.LevelRing;

__ds_ns.VehicleCard = __ds_scope.VehicleCard;

})();
