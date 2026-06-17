// ══════════════════════════════
// USERS
// ══════════════════════════════
var USERS = { admin:'zerotox123', farmer:'farm123', factory:'fact123', govt:'govt123' };
var currentLang = 'en';
var alarmSound = null;
var ventOpen = false;
var predTimer = null;

// ══════════════════════════════
// TRANSLATIONS
// ══════════════════════════════
var T = {
  en: {
    welcome: '👋 Hello! I am ZEROTOX AI Assistant. Ask me anything about gas levels, alerts or chemical formulas!',
    logout: 'Logout', home:'Home', monitor:'Monitor', map:'Map', gases:'Gases',
    sms:'SMS', chat:'AI Chat', settings:'Settings',
    ventStandby:'Ventilation: STANDBY', ventOpen:'Ventilation: OPEN ✅', ventClose:'Ventilation: CLOSED',
    ventSubStandby:'Monitoring — auto-activates on detection',
    ventSubOpen:'Converting toxic gases to safe output now!',
    quickgas:'Quick Gas Status', lbl_vent:'Ventilation & Conversion System',
    lbl_conv_eff:'Conversion Efficiency'
  },
  ta: {
    welcome: '👋 வணக்கம்! நான் ZEROTOX AI உதவியாளர். வாயு அளவுகள், எச்சரிக்கைகள் பற்றி கேளுங்கள்!',
    logout: 'வெளியேறு', home:'முகப்பு', monitor:'கண்காணிப்பு', map:'வரைபடம்', gases:'வாயுக்கள்',
    sms:'SMS', chat:'AI அரட்டை', settings:'அமைப்புகள்',
    ventStandby:'காற்றோட்டம்: காத்திருக்கிறது', ventOpen:'காற்றோட்டம்: திறந்தது ✅', ventClose:'காற்றோட்டம்: மூடியது',
    ventSubStandby:'கண்காணிக்கிறது — தானாக செயல்படும்',
    ventSubOpen:'இப்போது நச்சு வாயுக்களை மாற்றுகிறது!',
    quickgas:'விரைவு வாயு நிலை', lbl_vent:'காற்றோட்டம் & மாற்று அமைப்பு',
    lbl_conv_eff:'மாற்று திறன்'
  }
};

// ══════════════════════════════
// LOGIN
// ══════════════════════════════
function doLogin() {
  var u = document.getElementById('lusername').value.trim().toLowerCase();
  var p = document.getElementById('lpassword').value;
  var err = document.getElementById('lerr');
  if (USERS[u] && USERS[u] === p) {
    document.getElementById('loginScreen').classList.add('hide');
    err.style.display = 'none';
    // Set profile
    var roleMap = { admin:'🛡️ System Administrator', farmer:'🌾 Farm Manager', factory:'🏭 Factory Supervisor', govt:'🏛️ Government Officer' };
    var avatarMap = { admin:'👤', farmer:'🌾', factory:'🏭', govt:'🏛️' };
    document.getElementById('profile-name').textContent = u.charAt(0).toUpperCase()+u.slice(1);
    document.getElementById('profile-role').textContent = roleMap[u] || '👤 User';
    document.getElementById('profile-avatar').textContent = avatarMap[u] || '👤';
    // Init charts after a short delay
    setTimeout(initCharts, 300);
    loadContacts();
    notify('✅ Welcome ' + u.charAt(0).toUpperCase()+u.slice(1) + '! · ZEROTOX AI v8 Real Alerts loaded', 's');
    setTimeout(function(){ showPrediction(); }, 5000);
    setTimeout(function(){ triggerAlarm('SO₂','480 ppm','Sulfur Dioxide'); }, 18000);
  } else {
    err.style.display = 'block';
    document.getElementById('lpassword').value = '';
  }
}

function doLogout() {
  if (confirm('Logout from ZEROTOX AI?')) {
    document.getElementById('loginScreen').classList.remove('hide');
    document.getElementById('lusername').value = '';
    document.getElementById('lpassword').value = '';
    stopAlarm();
  }
}

// ══════════════════════════════
// LANGUAGE
// ══════════════════════════════
function setLang(lang) {
  currentLang = lang;
  var t = T[lang];
  // Update labels
  setText('logoutlbl', t.logout);
  setText('bn-lbl-home', t.home);
  setText('bn-lbl-monitor', t.monitor);
  setText('bn-lbl-map', t.map);
  setText('bn-lbl-showcase', t.gases);
  setText('bn-lbl-sms', t.sms);
  setText('bn-lbl-chat', t.chat);
  setText('bn-lbl-settings', t.settings);
  setText('lbl-quickgas', t.quickgas);
  setText('lbl-vent', t.lbl_vent);
  setText('lbl-conv-eff', t.lbl_conv_eff);
  setText('welcomeMsg', t.welcome);
  setText('chat-lang-tag', lang === 'ta' ? 'தமிழ்' : 'English');
  // Login lang buttons
  updateLangBtns();
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

function updateLangBtns() {
  ['en','ta'].forEach(function(l) {
    var b1 = document.getElementById('lang-'+l);
    var b2 = document.getElementById('set-lang-'+l);
    if (b1) b1.classList.toggle('on', l===currentLang);
    if (b2) b2.classList.toggle('on', l===currentLang);
  });
}

// ══════════════════════════════
// NAVIGATION
// ══════════════════════════════
var PAGES = ['home','monitor','analytics','map','showcase','sms','chat','alerts','solution','settings'];
function goTo(id) {
  PAGES.forEach(function(p) {
    var el = document.getElementById('pg-'+p);
    if (el) el.classList.remove('show');
    var bn = document.getElementById('bn-'+p);
    if (bn) bn.classList.remove('on');
  });
  var target = document.getElementById('pg-'+id);
  if (target) target.classList.add('show');
  var btn = document.getElementById('bn-'+id);
  if (btn) btn.classList.add('on');
  window.scrollTo({top:0,behavior:'smooth'});
}

// ══════════════════════════════
// ALARM SYSTEM
// ══════════════════════════════
function triggerAlarm(gas, ppm, fullname) {
  var t = T[currentLang];
  document.getElementById('alarmTitle').textContent = currentLang==='ta' ? '⚠️ அபாய எச்சரிக்கை!' : '⚠️ DANGER ALERT!';
  document.getElementById('alarmGas').textContent = gas + ' — ' + fullname;
  document.getElementById('alarmPpm').textContent = ppm;
  document.getElementById('alarmOverlay').classList.add('show');
  // Play alarm sound using Web Audio API
  playAlarmSound();
  // Auto open ventilation
  openVent();
  // Auto send SMS
  sendSMSAlert(gas, ppm, 'Zone C');
  // Vibrate phone if possible
  if (navigator.vibrate) navigator.vibrate([500,200,500,200,500,200,1000]);
}

function stopAlarm() {
  document.getElementById('alarmOverlay').classList.remove('show');
  stopAlarmSound();
  if (navigator.vibrate) navigator.vibrate(0);
}

var audioCtx = null;
var alarmNode = null;

function playAlarmSound() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function beep() {
      if (!audioCtx) return;
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.setValueAtTime(440, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.setValueAtTime(0, audioCtx.currentTime + 0.6);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.6);
    }
    beep();
    alarmNode = setInterval(beep, 800);
  } catch(e) { console.log('Audio not supported'); }
}

function stopAlarmSound() {
  if (alarmNode) { clearInterval(alarmNode); alarmNode = null; }
  if (audioCtx) { try { audioCtx.close(); } catch(e){} audioCtx = null; }
}

// ══════════════════════════════
// PREDICTION BANNER
// ══════════════════════════════
function showPrediction() {
  var msgs = {
    en: '⏰ AI PREDICTS: SO₂ will reach DANGER level in 8 minutes! Auto-ventilation opening now to convert gas...',
    ta: '⏰ AI கணிப்பு: SO₂ 8 நிமிடங்களில் அபாய அளவை எட்டும்! காற்றோட்டம் தானாக திறக்கிறது...'
  };
  document.getElementById('predText').textContent = msgs[currentLang];
  document.getElementById('predBanner').classList.add('show');
  openVent();
  notify('⏰ AI Prediction: Danger in 8 min · Ventilation auto-opened', 'w');
}

// ══════════════════════════════
// VENTILATION
// ══════════════════════════════
function openVent() {
  ventOpen = true;
  var t = T[currentLang];
  document.getElementById('ventLight').classList.add('on');
  document.getElementById('ventLabel').textContent = t.ventOpen;
  document.getElementById('ventSub').textContent = t.ventSubOpen;
  document.getElementById('ventInfo').textContent = currentLang==='ta' ?
    'காற்றோட்டம் திறந்தது — SO₂ → CaSO₃ மாற்று நடக்கிறது!' :
    'Ventilation OPEN — SO₂ → CaSO₃ conversion active!';
  // Animate fill bar
  var fill = document.getElementById('ventFill');
  fill.style.width = '0%';
  var pct = 0;
  var iv = setInterval(function() {
    pct += 2;
    fill.style.width = Math.min(pct, 97) + '%';
    if (pct >= 97) clearInterval(iv);
  }, 60);
  notify('🌀 Ventilation OPENED · Converting gases now', 's');
}

function closeVent() {
  ventOpen = false;
  var t = T[currentLang];
  document.getElementById('ventLight').classList.remove('on');
  document.getElementById('ventLabel').textContent = t.ventStandby;
  document.getElementById('ventSub').textContent = t.ventSubStandby;
  document.getElementById('ventFill').style.width = '0%';
  document.getElementById('ventInfo').textContent = currentLang==='ta' ?
    'காற்றோட்டம் மூடியது. கண்காணிப்பு தொடர்கிறது.' :
    'Ventilation closed. Monitoring continues.';
  notify('🔒 Ventilation closed · Monitoring active', 's');
}

// ══════════════════════════════
// SMS & WHATSAPP — REAL v8
// ══════════════════════════════
var contacts = [];
var twilioConfig = {};
var alertStats = {wa:7, sms:4, critical:3};

function loadContacts() {
  try {
    var c = localStorage.getItem('zt_contacts'); if(c) contacts = JSON.parse(c);
    var t = localStorage.getItem('zt_twilio'); if(t) twilioConfig = JSON.parse(t);
    var s = localStorage.getItem('zt_stats'); if(s) alertStats = JSON.parse(s);
  } catch(e) {}
  renderSavedContacts(); renderWAQuickContacts(); updateStatDisplay();
}

function saveContact(n) {
  var name = (document.getElementById('contact-name-'+n)||{}).value||'';
  var num  = (document.getElementById('contact-num-'+n)||{}).value||'';
  var type = (document.getElementById('contact-type-'+n)||{}).value||'both';
  name = name.trim(); num = num.trim();
  if (!num) { notify('⚠️ Please enter a phone number','w'); return; }
  num = num.replace(/[\s\-\(\)]/g,'');
  if (!num.startsWith('+')) num = '+91' + num.replace(/^0+/,'');
  contacts[n-1] = {name: name||'Contact '+n, num: num, type: type};
  localStorage.setItem('zt_contacts', JSON.stringify(contacts));
  renderSavedContacts(); renderWAQuickContacts();
  notify('✅ Contact '+n+' saved: '+(name||num),'s');
}

function renderSavedContacts() {
  var d = document.getElementById('saved-contacts-display');
  if (!d) return;
  var saved = contacts.filter(function(c){ return c && c.num; });
  if (!saved.length) { d.innerHTML='<div style="color:#3a6a4a;font-size:12px">No contacts saved yet.</div>'; return; }
  d.innerHTML = saved.map(function(c,i){
    if (!c) return '';
    var icon = c.type==='wa'?'💬':c.type==='sms'?'📩':'💬📩';
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(0,255,136,0.07)">'
      +'<div style="font-size:16px">'+icon+'</div>'
      +'<div><div style="font-size:13px;color:#fff;font-weight:600">'+c.name+'</div>'
      +'<div style="font-size:11px;color:#3a6a4a">'+c.num+' • '+c.type.toUpperCase()+'</div></div>'
      +'<button onclick="testContact('+contacts.indexOf(c)+')" style="margin-left:auto;padding:5px 10px;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.2);border-radius:7px;color:var(--g);font-size:10px;cursor:pointer">Test ➤</button>'
      +'</div>';
  }).join('');
}

function renderWAQuickContacts() {
  var d = document.getElementById('wa-quick-contacts');
  if (!d) return;
  var saved = contacts.filter(function(c){ return c && c.num; });
  if (!saved.length) { d.innerHTML='No contacts saved. Go to Contacts tab →'; return; }
  d.innerHTML = saved.map(function(c){ return c?'<div style="font-size:12px;color:#cde8d8;margin-bottom:4px">'+c.name+': '+c.num+'</div>':''; }).join('');
}

function updateStatDisplay() {
  var wa = document.getElementById('stat-wa-count');
  var sm = document.getElementById('stat-sms-count');
  var cr = document.getElementById('stat-critical-count');
  if(wa) wa.textContent = alertStats.wa;
  if(sm) sm.textContent = alertStats.sms;
  if(cr) cr.textContent = alertStats.critical;
}

function saveTwilioConfig() {
  twilioConfig = {
    sid: (document.getElementById('tw-sid')||{}).value||'',
    token: (document.getElementById('tw-token')||{}).value||'',
    from: (document.getElementById('tw-from')||{}).value||''
  };
  if (!twilioConfig.sid||!twilioConfig.token||!twilioConfig.from) { notify('⚠️ Fill all Twilio fields','w'); return; }
  localStorage.setItem('zt_twilio', JSON.stringify(twilioConfig));
  var s = document.getElementById('twilio-status');
  if(s) s.innerHTML='<span style="color:var(--g)">✅ Twilio config saved!</span>';
  notify('✅ Twilio configured!','s');
}

// REAL WHATSAPP
function sendRealWhatsApp() {
  var num = (document.getElementById('wa-compose-num')||{}).value||'';
  var msg = (document.getElementById('wa-compose-msg')||{}).value||'';
  num = num.trim(); msg = msg.trim();
  if (!num) { notify('⚠️ Enter a WhatsApp number first!','w'); return; }
  num = num.replace(/[\s\-\(\)]/g,'').replace(/^\+/,'');
  msg = msg.replace('{TIME}', new Date().toLocaleTimeString());
  window.open('https://wa.me/'+num+'?text='+encodeURIComponent(msg), '_blank');
  logAlert('💬 WhatsApp→'+num.slice(-4), msg.substring(0,50)+'…');
  alertStats.wa++; localStorage.setItem('zt_stats', JSON.stringify(alertStats)); updateStatDisplay();
  notify('📲 WhatsApp opened! Tap Send in the app.','s');
}

// REAL SMS
function sendRealSMS() {
  var num = (document.getElementById('sms-compose-num')||{}).value||'';
  var msg = (document.getElementById('sms-compose-msg')||{}).value||'';
  num = num.trim(); msg = msg.trim();
  if (!num) { notify('⚠️ Enter a phone number first!','w'); return; }
  // Open native SMS app
  var url = 'sms:'+num+'?body='+encodeURIComponent(msg);
  window.location.href = url;
  logAlert('📩 SMS app→'+num.slice(-4), msg.substring(0,50)+'…');
  alertStats.sms++; localStorage.setItem('zt_stats', JSON.stringify(alertStats)); updateStatDisplay();
  notify('📩 SMS app opened! Tap Send to deliver.','s');
}

function fillAlertMsg(channel, gas, ppm, zone, level) {
  var time = new Date().toLocaleTimeString();
  var icon = level==='CRITICAL'||level==='DANGER'?'⛔':level==='WARNING'?'⚠️':'✅';
  if (channel==='wa') {
    var el = document.getElementById('wa-compose-msg');
    if(el) el.value = '🚨 ZEROTOX ECOSHIELD ALERT\nGas: '+gas+' | Level: '+ppm+'\nZone: '+zone+'\nStatus: '+level+' '+icon+'\nTime: '+time+'\nAI Action: Converter ACTIVATED ✅\n→ Stay indoors. Follow safety protocol.';
  } else {
    var el = document.getElementById('sms-compose-msg');
    if(el) el.value = 'ZEROTOX: '+gas+' '+ppm+' '+zone+' '+level+'. AI ON. Stay safe! Time: '+time+' -ZEROTOX AI';
  }
}

function sendToAllWA(level, gas, ppm, zone) {
  var saved = contacts.filter(function(c){ return c && c.num && (c.type==='wa'||c.type==='both'); });
  if (!saved.length) { notify('⚠️ No WhatsApp contacts saved! Go to Contacts tab.','w'); switchSMSTab('contacts'); return; }
  var time = new Date().toLocaleTimeString();
  var msg = '🚨 ZEROTOX ECOSHIELD ALERT\nGas: '+gas+' | Level: '+ppm+'\nZone: '+zone+'\nStatus: '+level+'\nTime: '+time+'\n→ ZEROTOX AI is taking action. Stay safe!';
  var idx = 0;
  function sendNext() {
    if (idx>=saved.length){ notify('✅ WhatsApp opened for '+saved.length+' contacts!','s'); return; }
    var c = saved[idx++];
    var num = c.num.replace(/[\s\-\(\)\+]/g,'');
    window.open('https://wa.me/'+num+'?text='+encodeURIComponent(msg), '_blank');
    logAlert('💬 WA→'+c.name, gas+' '+ppm+' '+level);
    alertStats.wa++;
    if(level==='CRITICAL') alertStats.critical++;
    setTimeout(sendNext, 1500);
  }
  sendNext();
  localStorage.setItem('zt_stats', JSON.stringify(alertStats)); updateStatDisplay();
}

function testContact(idx) {
  var c = contacts[idx];
  if(!c) return;
  var msg = '🌿 ZEROTOX TEST: Hi '+c.name+'! System is online and monitoring all zones. ✅ -ZEROTOX AI v8';
  if(c.type==='wa'||c.type==='both'){
    window.open('https://wa.me/'+c.num.replace(/[\s\-\(\)\+]/g,'')+'?text='+encodeURIComponent(msg),'_blank');
  }
  if(c.type==='sms'||(c.type==='both')){
    setTimeout(function(){ window.location.href='sms:'+c.num+'?body='+encodeURIComponent('ZEROTOX TEST: System online. ✅ -ZEROTOX AI v8'); }, c.type==='both'?1800:0);
  }
  notify('📤 Test sent to '+c.name,'s');
}

function testSendAll() {
  var saved = contacts.filter(function(c){ return c && c.num; });
  if(!saved.length){ notify('⚠️ No contacts saved!','w'); return; }
  var msg = '🌿 ZEROTOX TEST: System is active. All zones monitored. Gas levels normal. ✅ -ZEROTOX AI v8';
  var idx = 0;
  function next() {
    if(idx>=saved.length) return;
    var c = saved[idx++];
    if(c.type==='wa'||c.type==='both') window.open('https://wa.me/'+c.num.replace(/[\s\-\(\)\+]/g,'')+'?text='+encodeURIComponent(msg),'_blank');
    if(c.type==='sms') setTimeout(function(){ window.location.href='sms:'+c.num+'?body='+encodeURIComponent(msg); }, 800);
    logAlert('📤 Test→'+c.name, c.num);
    setTimeout(next, 1500);
  }
  next();
  notify('📤 Test sent to all '+saved.length+' contacts!','s');
}

function logAlert(type, msg) {
  var log = document.getElementById('smsLog');
  if(!log) return;
  var item = document.createElement('div');
  item.className = 'sms-item';
  var t = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  item.innerHTML = '<span class="sms-time">'+t+'</span><span>'+type+': '+msg+'</span>';
  log.insertBefore(item, log.firstChild);
}

function clearLog() {
  var log = document.getElementById('smsLog');
  if(log) log.innerHTML = '<div class="sms-item" style="color:#3a6a4a">Log cleared.</div>';
}

function switchSMSTab(tab) {
  ['wa','sms','contacts','log'].forEach(function(t){
    var p = document.getElementById('panel-'+t);
    var b = document.getElementById('tab-'+t);
    if(p) p.style.display = t===tab ? '' : 'none';
    if(b) {
      b.classList.remove('on','sms-on');
      if(t===tab) b.classList.add(t==='sms'?'sms-on':'on');
    }
  });
}

// Override alert sender for real behavior
function sendSMSAlert(gas, ppm, zone) {
  var time = new Date().toLocaleTimeString();
  var msg = '🚨 ZEROTOX ALERT: '+gas+' '+ppm+' at '+zone+' — DANGER!\nAI taking action. Time: '+time+'\n-ZEROTOX AI v8';
  var saved = contacts.filter(function(c){ return c && c.num; });
  if (saved.length > 0) {
    sendToAllWA('DANGER', gas, ppm, zone);
  } else {
    var el = document.getElementById('wa-compose-msg');
    if(el) el.value = msg;
    goTo('sms');
    notify('⚠️ No contacts! Go to SMS→Contacts to save numbers.','w');
  }
  logAlert('🚨 Auto-alert', gas+' '+ppm+' '+zone);
  alertStats.critical++; localStorage.setItem('zt_stats', JSON.stringify(alertStats)); updateStatDisplay();
}

// ══════════════════════════════
// MAP
// ══════════════════════════════
function showZone(zone, status, aqi, gas, action, color) {
  var tip = document.getElementById('mapTooltip');
  tip.style.display = 'block';
  tip.innerHTML = '<strong style="color:'+color+'">Zone '+zone+' — '+status+'</strong><br>'+aqi+'<br>'+gas+'<br><span style="color:#4a7a5e">'+action+'</span>';
  setTimeout(function(){ tip.style.display='none'; }, 4000);
  var detail = document.getElementById('zoneDetail');
  var card = document.getElementById('zoneDetailCard');
  detail.style.display = 'block';
  card.innerHTML =
    '<div style="font-size:16px;font-weight:700;color:'+color+';margin-bottom:8px">📍 Zone '+zone+' — '+status+'</div>'+
    '<div style="font-size:13px;color:#cde8d8;margin-bottom:4px">'+aqi+'</div>'+
    '<div style="font-size:13px;color:#cde8d8;margin-bottom:4px">Primary Gas: '+gas+'</div>'+
    '<div style="font-size:12px;color:#4a7a5e;margin-bottom:12px">AI Action: '+action+'</div>'+
    '<button class="abtn g" onclick="notify(\'📊 Zone details loaded\',\'s\')">📊 Full Report</button> '+
    '<button class="abtn r" onclick="triggerAlarm(\''+gas.split(':')[0]+'\',\''+gas.split(': ')[1]+'\',\'Gas\')">🚨 Trigger Alarm</button>';
}

// ══════════════════════════════
// GAS SHOWCASE MODAL
// ══════════════════════════════
var GAS_DATA = {
  co:  {sym:'CO',  name:'Carbon Monoxide',    color:'var(--blue)',   src:'Vehicles, factories, fuel burning',    harm:'Binds with blood hemoglobin, blocks oxygen — causes death',            limit:'200 ppm',  formula:'2CO + O₂ → 2CO₂',                    method:'Catalytic Oxidation',          output:'CO₂ — absorbed by trees'},
  so2: {sym:'SO₂', name:'Sulfur Dioxide',     color:'var(--red)',    src:'Coal plants, oil refineries',          harm:'Acid rain, permanent lung damage, crop destruction',                  limit:'200 ppm',  formula:'SO₂ + Ca(OH)₂ → CaSO₃ + H₂O',       method:'Wet Lime Scrubbing',           output:'Harmless powder + water'},
  no2: {sym:'NO₂', name:'Nitrogen Dioxide',   color:'var(--warn)',   src:'Engines, fertilizer factories',        harm:'Smog, permanent breathing damage, ozone depletion',                   limit:'200 ppm',  formula:'4NO₂ + 4NH₃ + O₂ → 4N₂ + 6H₂O',    method:'SCR Catalytic Reduction',      output:'Safe N₂ gas + water'},
  nh3: {sym:'NH₃', name:'Ammonia',            color:'var(--t)',      src:'Fertilizer plants, animal farms',      harm:'Burns eyes, throat, lungs — toxic in moderate amounts',               limit:'100 ppm',  formula:'4NH₃ + 3O₂ → 2N₂ + 6H₂O',           method:'Thermal Oxidation',            output:'Safe N₂ gas + water'},
  h2s: {sym:'H₂S', name:'Hydrogen Sulfide',   color:'var(--red)',    src:'Sewage plants, oil refineries',        harm:'Rotten egg smell — lethal within minutes at high levels',             limit:'20 ppm',   formula:'2H₂S + 3O₂ → 2SO₂ → CaSO₃ + H₂O',  method:'Combustion + Lime Scrubbing',  output:'Harmless powder + water'},
  ch4: {sym:'CH₄', name:'Methane',            color:'var(--purple)', src:'Garbage dumps, cattle farms, mines',   harm:'25x more powerful than CO₂, explosion risk at high concentrations',  limit:'5000 ppm', formula:'CH₄ + 2O₂ → CO₂ + H₂O (Biogas ⚡)',  method:'Biogas Capture',               output:'Free electricity or CO₂'},
  voc: {sym:'VOC', name:'Volatile Organics',  color:'var(--g)',      src:'Paints, pesticides, plastics',         harm:'Causes cancer, liver damage, nerve damage over long exposure',        limit:'0.6 mg/m³',formula:'VOC + O₂ → CO₂ + H₂O (UV+TiO₂)',    method:'UV Photocatalytic Oxidation',  output:'CO₂ + water only'},
  co2: {sym:'CO₂', name:'Carbon Dioxide',     color:'#aaaaaa',       src:'All combustion processes',             harm:'Greenhouse gas — causes global warming and climate change',           limit:'1000 ppm', formula:'6CO₂+6H₂O+Sunlight → C₆H₁₂O₆+6O₂',  method:'Tree Photosynthesis',          output:'Oxygen + glucose (food)'}
};

function showGasModal(id) {
  var g = GAS_DATA[id];
  if (!g) return;
  document.getElementById('scModBox').innerHTML =
    '<button class="scmod-close" onclick="document.getElementById(\'scModal\').classList.remove(\'show\')">✕ Close</button>'+
    '<div class="scmod-sym" style="color:'+g.color+'">'+g.sym+'</div>'+
    '<div class="scmod-title">'+g.name+'</div>'+
    '<div class="scmod-row"><span class="scmod-key">📍 Source</span><span class="scmod-val">'+g.src+'</span></div>'+
    '<div class="scmod-row"><span class="scmod-key">☠️ Harm</span><span class="scmod-val" style="color:var(--red)">'+g.harm+'</span></div>'+
    '<div class="scmod-row"><span class="scmod-key">⚠️ Safe Limit</span><span class="scmod-val" style="color:var(--warn)">'+g.limit+'</span></div>'+
    '<div style="font-size:10px;color:#3a6a4a;margin-top:12px;letter-spacing:1px;text-transform:uppercase">Conversion Formula</div>'+
    '<div class="formula-box">'+g.formula+'</div>'+
    '<div class="scmod-row"><span class="scmod-key">⚗️ Method</span><span class="scmod-val" style="color:var(--t)">'+g.method+'</span></div>'+
    '<div class="scmod-row"><span class="scmod-key">✅ Safe Output</span><span class="scmod-val" style="color:var(--g)">'+g.output+'</span></div>'+
    '<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">'+
    '<button class="abtn r" onclick="triggerAlarm(\''+g.sym+'\',\'DANGER\',\''+g.name+'\')">🚨 Simulate Alarm</button>'+
    '<button class="abtn g" onclick="openVent()">🌀 Open Vent</button></div>';
  document.getElementById('scModal').classList.add('show');
}

// ══════════════════════════════
// CHATBOT
// ══════════════════════════════
var CHAT_RESPONSES = {
  en: {
    'so2':    '🧪 SO₂ (Sulfur Dioxide) comes from coal power plants. It causes acid rain and lung disease. Safe limit: 200 ppm. ZEROTOX converts it using lime scrubbing: SO₂ + Ca(OH)₂ → CaSO₃ + H₂O',
    'co':     '🧪 CO (Carbon Monoxide) comes from vehicles and fuel burning. It blocks oxygen in blood and can kill. Safe limit: 200 ppm. ZEROTOX converts it: 2CO + O₂ → 2CO₂ using catalytic oxidation.',
    'no2':    '🧪 NO₂ (Nitrogen Dioxide) comes from vehicle engines. It causes smog and lung damage. Safe limit: 200 ppm. ZEROTOX uses SCR method: 4NO₂ + 4NH₃ + O₂ → 4N₂ + 6H₂O',
    'h2s':    '🧪 H₂S (Hydrogen Sulfide) smells like rotten eggs. Extremely toxic — lethal at high levels. Limit: 20 ppm. ZEROTOX burns it: 2H₂S + 3O₂ → 2SO₂, then lime treats the SO₂.',
    'ch4':    '🧪 CH₄ (Methane) from garbage dumps is 25x more dangerous than CO₂. ZEROTOX captures it as biogas to generate free electricity! Formula: CH₄ + 2O₂ → CO₂ + H₂O',
    'danger': '🚨 Currently 3 zones are in DANGER: Zone C (SO₂: 480ppm), Zone E (H₂S: 42ppm). AI has activated scrubbers and sent SMS alerts to emergency contacts!',
    'safe':   '📊 Current AQI: 142 (Moderate). Zone A and Zone B are SAFE. Zones C and E are DANGER. Zones D is WARNING. Stay indoors if near Zone C!',
    'ventil': '🌀 Ventilation system automatically opens when gas prediction exceeds safe limit. It pulls in fresh air and activates gas converters to neutralize toxic gases.',
    'alarm':  '🚨 The alarm system triggers a loud sound + screen flash + phone vibration when any gas exceeds danger level. It also auto-sends SMS to your saved numbers.',
    'sms':    '📱 SMS alerts are sent automatically to your saved phone numbers when gas reaches danger level. Go to SMS page to save your number!',
    'default':'🤖 I understand your question! ZEROTOX monitors 8 toxic gases: CO, SO₂, NO₂, NH₃, H₂S, CH₄, VOC, CO₂. Each has a specific AI-powered chemical conversion method. Type a gas name or ask about alarms, SMS, or ventilation!'
  },
  ta: {
    'so2':    '🧪 SO₂ (கந்தக டை ஆக்சைடு) நிலக்கரி மின் நிலையங்களில் இருந்து வருகிறது. அமில மழை மற்றும் நுரையீரல் நோயை ஏற்படுத்துகிறது. பாதுகாப்பு வரம்பு: 200 ppm. ZEROTOX சுண்ணாம்பு மூலம் மாற்றுகிறது: SO₂ + Ca(OH)₂ → CaSO₃ + H₂O',
    'danger': '🚨 தற்போது 3 மண்டலங்கள் அபாயத்தில் உள்ளன: மண்டலம் C (SO₂: 480ppm). AI ஸ்க்ரப்பர்களை செயல்படுத்தி SMS அனுப்பியுள்ளது!',
    'safe':   '📊 தற்போதைய AQI: 142 (மிதமான). மண்டலம் A மற்றும் B பாதுகாப்பானவை. மண்டலம் C ஆபத்தானது. மண்டலம் C அருகில் இருந்தால் வீட்டிற்குள் இருங்கள்!',
    'ventil': '🌀 வாயு முன்னறிவிப்பு பாதுகாப்பு வரம்பை மீறும்போது காற்றோட்டம் தானாக திறக்கிறது. புதிய காற்றை இழுத்து நச்சு வாயுக்களை நடுநிலையாக்குகிறது.',
    'alarm':  '🚨 எந்த வாயும் அபாய அளவை மீறும்போது ஒலி எச்சரிக்கை + திரை ஒளிரல் + தொலைபேசி அதிர்வு தூண்டப்படுகிறது. SMS உங்கள் சேமிக்கப்பட்ட எண்களுக்கும் அனுப்பப்படுகிறது.',
    'default':'🤖 ZEROTOX 8 நச்சு வாயுக்களை கண்காணிக்கிறது: CO, SO₂, NO₂, NH₃, H₂S, CH₄, VOC, CO₂. வாயு பெயர் அல்லது எச்சரிக்கை, SMS, காற்றோட்டம் பற்றி கேளுங்கள்!'
  }
};

// ══════════════════════════════
// CHATBOT — ENHANCED v6
// ══════════════════════════════
var chatMemory = []; // conversation history
var currentCategory = 'all';

var QUICK_BUTTONS = {
  all:    [['🧪 What is SO₂?','What is SO₂ and how dangerous is it?'],['🚨 Danger zones','Which zones are in danger right now?'],['💨 Air safe?','Is the air safe to breathe right now?'],['🌀 How does venting work?','How does the ventilation system work?'],['📊 Current AQI','What is the current AQI and what does it mean?'],['🆘 Emergency steps','What should I do in a gas emergency?']],
  gases:  [['CO','Tell me about Carbon Monoxide CO'],['SO₂','Tell me about Sulfur Dioxide SO₂'],['NO₂','Tell me about Nitrogen Dioxide NO₂'],['H₂S','Tell me about Hydrogen Sulfide H₂S'],['NH₃','Tell me about Ammonia NH₃'],['CH₄','Tell me about Methane CH₄'],['VOC','Tell me about VOC volatile organics'],['CO₂','Tell me about Carbon Dioxide CO₂']],
  safety: [['🆘 Emergency plan','What is the emergency evacuation plan?'],['😷 Protect myself','How do I protect myself from toxic gases?'],['🏥 Health effects','What are the health effects of toxic gas exposure?'],['🔥 Explosion risk','Which gases have explosion risk?'],['👁️ Symptoms','What are symptoms of gas poisoning?'],['📞 Who to call','Who should I call in a gas emergency?']],
  system: [['📡 Sensor status','What is the current sensor network status?'],['🔄 Conversion rate','What is the current gas conversion efficiency?'],['🌀 Ventilation','How does auto-ventilation work?'],['📱 SMS alerts','How does the SMS alert system work?'],['⏰ Prediction AI','How does the AI predict gas danger?'],['🔋 Battery status','Which sensors have low battery?']],
  zones:  [['Zone A','Tell me about Zone A status'],['Zone B','Tell me about Zone B status'],['Zone C','Tell me about Zone C — it is in danger'],['Zone D','Tell me about Zone D warning'],['Zone E','Tell me about Zone E warning'],['Zone F','Tell me about Zone F status'],['🗺️ All zones','Give me a summary of all zone statuses']],
  tamil:  [['என்ன செய்வது?','என்ன செய்வது?'],['SO₂ என்றால்?','SO₂ பற்றி சொல்லுங்கள்'],['வாயு அபாயம்?','தற்போது எந்த வாயுக்கள் அபாயத்தில் உள்ளன?'],['பாதுகாப்பானதா?','காற்று இப்போது சுவாசிக்க பாதுகாப்பானதா?'],['காற்றோட்டம்','காற்றோட்ட அமைப்பு எப்படி வேலை செய்கிறது?']]
};

var SMART_RESPONSES = {
  // Gases — detailed
  'so2': '🧪 **Sulfur Dioxide (SO₂)**\n\n☠️ Source: Coal power plants, oil refineries, volcanoes\n⚠️ Safe limit: 200 ppm\n🔴 Current reading: 480 ppm — DANGER!\n\n🩺 Health effects:\n• Irritates respiratory system\n• Causes acid rain\n• Long-term: permanent lung damage\n• High levels: life-threatening within minutes\n\n⚗️ ZEROTOX Conversion:\nSO₂ + Ca(OH)₂ → CaSO₃ + H₂O\n(Lime scrubbing — output is harmless powder + water)\n\n✅ AI Action: Lime scrubber activated in Zone C!',
  'co':  '🧪 **Carbon Monoxide (CO)**\n\n☠️ Source: Vehicles, fuel burning, factories\n⚠️ Safe limit: 200 ppm\n🟢 Current reading: 35 ppm — SAFE\n\n🩺 Health effects:\n• Binds with hemoglobin, blocks oxygen\n• Odorless & colorless — invisible killer\n• Causes headache, dizziness, death at high levels\n\n⚗️ ZEROTOX Conversion:\n2CO + O₂ → 2CO₂\n(Catalytic oxidation — output absorbed by trees)\n\n✅ Status: Zone A is clear.',
  'no2': '🧪 **Nitrogen Dioxide (NO₂)**\n\n☠️ Source: Vehicle engines, fertilizer factories\n⚠️ Safe limit: 200 ppm\n🟡 Current reading: 178 ppm — WARNING\n\n🩺 Health effects:\n• Forms smog and acid rain\n• Damages lung tissue over time\n• Causes ozone layer depletion\n\n⚗️ ZEROTOX Conversion:\n4NO₂ + 4NH₃ + O₂ → 4N₂ + 6H₂O\n(SCR catalytic reduction — output: safe nitrogen gas)\n\n⚠️ SCR system active in Zone D.',
  'h2s': '🧪 **Hydrogen Sulfide (H₂S)**\n\n☠️ Source: Sewage plants, oil refineries, swamps\n⚠️ Safe limit: 20 ppm\n🔴 Current reading: 42 ppm — DANGER!\n\n🩺 Health effects:\n• Rotten egg smell at low levels\n• At high levels: paralyzes smell nerve — you can\'t detect it!\n• Lethal within minutes above 500 ppm\n\n⚗️ ZEROTOX Conversion:\n2H₂S + 3O₂ → 2SO₂ + 2H₂O, then SO₂ lime-scrubbed\n(Combustion + lime scrubbing)\n\n🚨 Workers at Zone E have been alerted!',
  'nh3': '🧪 **Ammonia (NH₃)**\n\n☠️ Source: Fertilizer plants, animal farms, refrigeration\n⚠️ Safe limit: 100 ppm\n🟢 Current reading: 22 ppm — SAFE\n\n🩺 Health effects:\n• Pungent smell\n• Burns eyes, throat, and lungs\n• High exposure: pulmonary edema (fluid in lungs)\n\n⚗️ ZEROTOX Conversion:\n4NH₃ + 3O₂ → 2N₂ + 6H₂O\n(Thermal oxidation — output: safe nitrogen + water steam)\n\n✅ Zone B is within safe limits.',
  'ch4': '🧪 **Methane (CH₄)**\n\n☠️ Source: Garbage dumps, cattle farms, coal mines\n⚠️ Safe limit: 5000 ppm\n🟢 Current reading: 820 ppm — SAFE\n\n🩺 Health effects:\n• 25× more powerful greenhouse gas than CO₂\n• Explosion risk at 5%–15% concentration in air\n• Displaces oxygen in confined spaces\n\n⚗️ ZEROTOX Conversion:\nCH₄ + 2O₂ → CO₂ + H₂O ⚡\n(Biogas capture → generates FREE electricity!)\n\n✅ Biogas generator on standby.',
  'voc': '🧪 **VOC — Volatile Organic Compounds**\n\n☠️ Source: Paints, pesticides, plastics, solvents\n⚠️ Safe limit: 0.6 mg/m³\n🟡 Current reading: 0.55 mg/m³ — WARNING\n\n🩺 Health effects:\n• Long-term: cancer, liver damage, nerve damage\n• Short-term: headaches, dizziness, eye irritation\n• Contributes to ground-level ozone formation\n\n⚗️ ZEROTOX Conversion:\nVOC + O₂ → CO₂ + H₂O\n(UV photocatalytic oxidation with TiO₂ catalyst)',
  'co2': '🧪 **Carbon Dioxide (CO₂)**\n\n☠️ Source: All combustion processes, breathing, industry\n⚠️ Safe limit: 1000 ppm (indoors)\n🟢 Current reading: 412 ppm — NORMAL (outdoor level)\n\n🩺 Health effects:\n• Main greenhouse gas causing climate change\n• Above 1000 ppm: drowsiness, reduced concentration\n• Above 5000 ppm: headaches, rapid breathing\n\n⚗️ ZEROTOX Conversion:\n6CO₂ + 6H₂O + Sunlight → C₆H₁₂O₆ + 6O₂\n(Tree photosynthesis — 340 trees planted!)',
  // Safety
  'emergency': '🚨 **Emergency Protocol — ZEROTOX System**\n\n1️⃣ Move indoors immediately — close all windows and doors\n2️⃣ Stay low if gas is heavier than air (SO₂, H₂S)\n3️⃣ Do NOT use electric switches (risk of spark with CH₄)\n4️⃣ Call emergency services: 112\n5️⃣ ZEROTOX AI automatically:\n   • Activates gas converters\n   • Sends SMS to all saved numbers\n   • Opens ventilation system\n   • Alerts traffic & authorities\n6️⃣ Wait for all-clear SMS from ZEROTOX system',
  'protect': '😷 **How to Protect Yourself**\n\n🏠 At home:\n• Keep windows closed during alerts\n• Use air purifier with HEPA + activated carbon filter\n• Monitor ZEROTOX app for real-time updates\n\n🏭 At work/industrial areas:\n• Wear appropriate respirator mask (N95 minimum)\n• Know your emergency exit routes\n• Never enter confined spaces alone\n• Buddy system during maintenance\n\n📱 Enable SMS alerts in ZEROTOX → get warned before danger!',
  'symptoms': '🩺 **Gas Poisoning Symptoms**\n\n🔴 IMMEDIATE (call 108 now):\n• Loss of consciousness\n• Blue lips or fingertips\n• Severe difficulty breathing\n• Seizures\n\n🟡 WARNING signs:\n• Headache, dizziness, nausea\n• Eye/throat/skin irritation\n• Unusual smell (rotten eggs = H₂S, sweet = CO)\n• Coughing, chest tightness\n\n✅ If symptoms appear: Leave the area immediately, get fresh air, call emergency services.',
  'health': '🏥 **Health Effects of Toxic Gas Exposure**\n\n• SO₂: Bronchitis, asthma, lung scarring\n• CO: Brain damage, heart attack, death\n• NO₂: Emphysema, reduced lung capacity\n• H₂S: Nerve damage, olfactory paralysis\n• NH₃: Chemical burns to airways\n• VOC: Cancer risk, liver/kidney damage\n• CH₄: Asphyxiation in enclosed spaces\n\n🌿 ZEROTOX converts all these before they reach you!',
  'explosion': '🔥 **Explosion Risk Gases**\n\n🚨 High explosion risk:\n• CH₄ (Methane): explodes at 5–15% in air\n• H₂S: explodes at 4–44% in air\n• VOC solvents: highly flammable\n\n⚠️ Rules near explosion-risk zones:\n• No open flames or sparks\n• No electrical switches\n• Ground all equipment\n• Use intrinsically safe devices\n• Ventilate before entering\n\n✅ ZEROTOX uses sealed explosion-proof sensors in high-risk zones.',
  // System
  'sensor': '📡 **Sensor Network Status**\n\nSensor | Zone | Status | Reading | Battery\n─────────────────────────────────\nC-07 | Zone C | 🔴 ALERT | SO₂ 480ppm | 87%\nD-12 | Zone D | 🟡 WARN  | NO₂ 178ppm | 92%\nS-03 | Zone E | 🟡 WARN  | H₂S 42ppm  | 41% ⚠️\nA-01 | Zone A | 🟢 SAFE  | CO 35ppm   | 96%\nB-04 | Zone B | 🟢 SAFE  | NH₃ 22ppm  | 78%\n\n⚠️ Sensor S-03 battery is LOW — maintenance dispatched!',
  'conversion': '🔄 **Gas Conversion Efficiency**\n\nToday\'s stats:\n✅ Total gases converted: 2,847 kg\n✅ Conversion efficiency: 98.4%\n✅ CO₂ captured: 12.4 tons\n✅ Electricity generated (CH₄): 340 kWh\n✅ Trees absorbing output: 340\n\nActive converters:\n• Lime scrubber (Zone C) — SO₂ → CaSO₃ ✅\n• SCR system (Zone D) — NO₂ → N₂ ✅\n• Combustion chamber (Zone E) — H₂S → CaSO₃ ✅',
  'ventilation': '🌀 **Ventilation & Conversion System**\n\nHow it works:\n1️⃣ Sensors detect gas rising above threshold\n2️⃣ AI predicts when danger will be reached (10-min warning)\n3️⃣ Ventilation ducts open automatically\n4️⃣ Fresh air drawn in; toxic air pushed to converter\n5️⃣ Specific converter activates for detected gas type\n6️⃣ Clean output (N₂, CO₂, CaSO₃, water) released\n7️⃣ Post-sensor confirms conversion success\n\nCurrent status: Active in Zones C, D, E ✅',
  'sms': '📱 **SMS Alert System**\n\nHow alerts are sent:\n• 🔴 DANGER level → immediate SMS to all saved numbers\n• 🟡 WARNING level → SMS if enabled in settings\n• ⏰ 10-min prediction → early warning SMS\n• 📊 Daily summary → evening report\n\nTo set up:\n1️⃣ Go to SMS page\n2️⃣ Enter your mobile number (10 digits)\n3️⃣ Save — alerts start immediately!\n\nCurrent status: 3 numbers saved, auto-send ON ✅',
  'prediction': '⏰ **AI Prediction System**\n\nHow ZEROTOX predicts danger:\n1️⃣ Monitors gas trend over last 30 minutes\n2️⃣ Calculates rate of increase (ppm/min)\n3️⃣ Predicts when safe limit will be crossed\n4️⃣ Issues warning 10 minutes in advance\n5️⃣ Auto-activates ventilation before crisis\n\nCurrent prediction:\n• SO₂ in Zone C: Already in DANGER ☠️\n• NO₂ in Zone D: Stabilizing — risk dropping\n• H₂S in Zone E: Monitoring, 4 min to safe ⏰',
  'battery': '🔋 **Sensor Battery Status**\n\n🟢 High (>70%): A-01 (96%), D-12 (92%), C-07 (87%), B-04 (78%)\n🟡 Low (<50%): S-03 (41%) — ⚠️ MAINTENANCE NEEDED\n\nMaintenance team has been notified for Sensor S-03 at Zone E (Sewage Plant). Replacement scheduled within 2 hours. Backup sensor S-03B is on standby.',
  // Zones
  'zone a': '📍 **Zone A — Residential Area**\n🟢 Status: SAFE\nAQI: 42 (Good)\n\nReadings:\n• CO: 35 ppm ✅ (limit: 200)\n• All other gases within safe range\n\n🏠 Safe for residents. Normal activities allowed.\nSensor A-01 reporting normally — battery 96%.',
  'zone b': '📍 **Zone B — Farm Zone**\n🟢 Status: SAFE\nAQI: 58 (Moderate)\n\nReadings:\n• NH₃: 22 ppm ✅ (limit: 100)\n• CH₄: 820 ppm ✅ (limit: 5000)\n• Slight increase monitored — biogas capture ready\n\n🌾 Farm operations normal. Biogas generator on standby.',
  'zone c': '📍 **Zone C — Factory Zone**\n🔴 Status: CRITICAL DANGER ☠️\nAQI: 340 (Hazardous)\n\nReadings:\n• SO₂: 480 ppm 🚨 (limit: 200) — DOUBLE the limit!\n\n⚡ AI Actions taken:\n• Lime scrubber ACTIVATED\n• SMS sent to all emergency contacts\n• Evacuation advisory ISSUED\n• Zone perimeter locked\n\n⚠️ DO NOT ENTER Zone C without full protection!',
  'zone d': '📍 **Zone D — Highway Zone**\n🟡 Status: WARNING\nAQI: 165 (Unhealthy)\n\nReadings:\n• NO₂: 178 ppm ⚠️ (limit: 200) — approaching limit\n\n⚡ AI Actions taken:\n• SCR catalytic reduction triggered\n• Traffic department alerted\n• AI predicts stabilization in 8 minutes\n\n🚗 Traffic being rerouted around Zone D.',
  'zone e': '📍 **Zone E — Sewage Plant**\n🟡 Status: WARNING\nAQI: 148 (Unhealthy)\n\nReadings:\n• H₂S: 42 ppm 🚨 (limit: 20) — 2× over limit!\n\n⚡ AI Actions taken:\n• Combustion chamber active\n• Workers alerted to use respirators\n• Sensor S-03 battery low — maintenance en route\n\n⚠️ Plant workers should use full respiratory protection.',
  'zone f': '📍 **Zone F — Safe Zone**\n🟢 Status: SAFE\nAQI: 38 (Good)\n\nReadings:\n• All gases within safe limits ✅\n• CO₂: Normal at 412 ppm\n\n✅ Zone F is the cleanest zone. Recommended for sensitive populations during current alerts.',
  'all zone': '🗺️ **All Zone Summary**\n\nZone A 🟢 AQI 42  — Residential — SAFE\nZone B 🟢 AQI 58  — Farm — SAFE\nZone C 🔴 AQI 340 — Factory — CRITICAL ☠️\nZone D 🟡 AQI 165 — Highway — WARNING\nZone E 🟡 AQI 148 — Sewage — WARNING\nZone F 🟢 AQI 38  — Safe Zone — SAFE\n\n📊 Overall city AQI: 142 (Moderate)\n🚨 3 zones need immediate attention\n✅ 3 zones are currently safe',
  // AQI
  'aqi': '📊 **AQI — Air Quality Index Explained**\n\n🟢 0–50: Good — No risk. Enjoy outdoor activities.\n🟡 51–100: Moderate — Sensitive groups should limit outdoor time.\n🟠 101–150: Unhealthy for Sensitive Groups — Elderly & children at risk.\n🔴 151–200: Unhealthy — Everyone may experience effects.\n🟣 201–300: Very Unhealthy — Health warnings for everyone.\n☠️ 301+: Hazardous — Emergency conditions.\n\n📍 Current city AQI: 142 (Unhealthy for Sensitive Groups)\n🚨 Zone C AQI: 340 — Hazardous!',
  // Emergency call
  'call': '📞 **Emergency Contacts**\n\n🚒 Fire Department: 101\n🚑 Ambulance: 108\n👮 Police: 100\n🆘 National Emergency: 112\n☎️ Disaster Management: 1070\n🏥 Poison Control: 1800-425-1213\n\n📱 ZEROTOX also auto-sends SMS to your saved numbers when gas reaches danger level. Go to the SMS page to save your contacts!',
  // Tamil
  'என்ன செய்வது': '🌿 **அவசர நடவடிக்கைகள் (Tamil)**\n\n1️⃣ உடனடியாக வீட்டிற்குள் செல்லுங்கள்\n2️⃣ ஜன்னல்கள் மற்றும் கதவுகளை மூடுங்கள்\n3️⃣ மின் சாதனங்களை இயக்காதீர்கள் (CH₄ இருந்தால்)\n4️⃣ அவசர ஆண்டு: 112 அழைக்கவும்\n5️⃣ ZEROTOX AI தானாக:\n   • வாயு மாற்று அமைப்பை செயல்படுத்தும்\n   • SMS எச்சரிக்கை அனுப்பும்\n   • காற்றோட்டம் திறக்கும்\n6️⃣ ZEROTOX தெளிவான SMS வரும் வரை காத்திருங்கள்',
  'safe': '💨 **Current Air Safety Status**\n\n📊 Overall AQI: 142 — Moderate (not ideal)\n\n🟢 SAFE zones: A, B, F — safe to be outdoors\n🟡 WARNING: D, E — limit time outdoors\n🔴 DANGER: Zone C — DO NOT enter, stay indoors\n\n💡 Recommendation: If you are near Zone C or E, stay indoors with windows closed. ZEROTOX AI is actively converting toxic gases.',
  'danger': '🚨 **Current Danger Status**\n\n🔴 Zone C — CRITICAL: SO₂ at 480 ppm (limit: 200)\n🟡 Zone D — WARNING: NO₂ at 178 ppm (limit: 200)\n🔴 Zone E — DANGER: H₂S at 42 ppm (limit: 20)\n\n✅ AI actions active:\n• Lime scrubber running (Zone C)\n• SCR system running (Zone D)\n• Combustion chamber running (Zone E)\n• SMS alerts sent to all contacts\n• Evacuation advisory for Zone C issued'
};

function setCategory(cat, el) {
  currentCategory = cat;
  document.querySelectorAll('.cat-chip').forEach(function(c){ c.classList.remove('active'); });
  el.classList.add('active');
  renderQuickButtons(cat);
}

function renderQuickButtons(cat) {
  var btns = QUICK_BUTTONS[cat] || QUICK_BUTTONS['all'];
  var wrap = document.getElementById('quickBtns');
  wrap.innerHTML = btns.map(function(b){
    return '<div class="qbtn" onclick="quickAsk(\''+b[1].replace(/'/g,"\\'")+'\')">'+(b[0])+'</div>';
  }).join('');
}

function sendChat() {
  var inp = document.getElementById('chatInput');
  var msg = inp.value.trim();
  if (!msg) return;
  var now = getTime();
  addChatMsg(msg, 'user', now);
  inp.value = '';

  // Show typing animation
  var typingId = 'typing-' + Date.now();
  var msgs = document.getElementById('chatMessages');
  var td = document.createElement('div');
  td.id = typingId;
  td.className = 'typing-bubble';
  td.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  msgs.appendChild(td);
  msgs.scrollTop = msgs.scrollHeight;

  var delay = 500 + Math.random() * 600;
  setTimeout(function() {
    var t = document.getElementById(typingId);
    if (t) t.remove();
    var reply = getSmartReply(msg);
    addChatMsg(reply, 'bot', getTime());
  }, delay);
}

function quickAsk(q) {
  document.getElementById('chatInput').value = q;
  sendChat();
}

function getSmartReply(msg) {
  var m = msg.toLowerCase();
  // Tamil
  if (m.includes('என்ன செய்வது')) return SMART_RESPONSES['என்ன செய்வது'];
  if (m.includes('so₂') || m.includes('so2') || m.includes('sulfur') || m.includes('sulphur') || m.includes('கந்தக')) return SMART_RESPONSES['so2'];
  if (m.includes('carbon mono') || (m.includes('co') && !m.includes('co2') && !m.includes('co₂'))) return SMART_RESPONSES['co'];
  if (m.includes('no2') || m.includes('no₂') || m.includes('nitrogen diox')) return SMART_RESPONSES['no2'];
  if (m.includes('h2s') || m.includes('h₂s') || m.includes('hydrogen sulf') || m.includes('rotten egg')) return SMART_RESPONSES['h2s'];
  if (m.includes('nh3') || m.includes('nh₃') || m.includes('ammonia')) return SMART_RESPONSES['nh3'];
  if (m.includes('ch4') || m.includes('ch₄') || m.includes('methane')) return SMART_RESPONSES['ch4'];
  if (m.includes('voc') || m.includes('volatile')) return SMART_RESPONSES['voc'];
  if (m.includes('co2') || m.includes('co₂') || m.includes('carbon diox')) return SMART_RESPONSES['co2'];
  // Safety
  if (m.includes('emergency') || m.includes('evacuate') || m.includes('what should') || m.includes('what to do')) return SMART_RESPONSES['emergency'];
  if (m.includes('protect') || m.includes('mask') || m.includes('safe') && m.includes('how')) return SMART_RESPONSES['protect'];
  if (m.includes('symptom') || m.includes('sign') || m.includes('feel sick')) return SMART_RESPONSES['symptoms'];
  if (m.includes('health effect') || m.includes('harm') || m.includes('damage')) return SMART_RESPONSES['health'];
  if (m.includes('explosion') || m.includes('blast') || m.includes('fire risk')) return SMART_RESPONSES['explosion'];
  if (m.includes('call') || m.includes('phone') || m.includes('contact') || m.includes('number')) return SMART_RESPONSES['call'];
  // System
  if (m.includes('sensor') || m.includes('network') || m.includes('c-07') || m.includes('s-03')) return SMART_RESPONSES['sensor'];
  if (m.includes('conversion') || m.includes('efficiency') || m.includes('convert') || m.includes('kg')) return SMART_RESPONSES['conversion'];
  if (m.includes('vent') || m.includes('air flow') || m.includes('fan')) return SMART_RESPONSES['ventilation'];
  if (m.includes('sms') || m.includes('text') || m.includes('message') || m.includes('alert')) return SMART_RESPONSES['sms'];
  if (m.includes('predict') || m.includes('forecast') || m.includes('10 min')) return SMART_RESPONSES['prediction'];
  if (m.includes('battery') || m.includes('charge') || m.includes('power')) return SMART_RESPONSES['battery'];
  // Zones
  if (m.includes('zone a') || m.includes('residential')) return SMART_RESPONSES['zone a'];
  if (m.includes('zone b') || m.includes('farm')) return SMART_RESPONSES['zone b'];
  if (m.includes('zone c') || m.includes('factory')) return SMART_RESPONSES['zone c'];
  if (m.includes('zone d') || m.includes('highway')) return SMART_RESPONSES['zone d'];
  if (m.includes('zone e') || m.includes('sewage')) return SMART_RESPONSES['zone e'];
  if (m.includes('zone f')) return SMART_RESPONSES['zone f'];
  if (m.includes('all zone') || m.includes('summary') || m.includes('overview')) return SMART_RESPONSES['all zone'];
  // General
  if (m.includes('aqi') || m.includes('air quality index')) return SMART_RESPONSES['aqi'];
  if (m.includes('danger') || m.includes('critical') || m.includes('அபாய')) return SMART_RESPONSES['danger'];
  if (m.includes('safe') || m.includes('breathe') || m.includes('outside')) return SMART_RESPONSES['safe'];
  // Greeting
  if (m.includes('hello') || m.includes('hi') || m.includes('hey') || m.includes('வணக்கம்')) return '👋 Hello! I\'m the ZEROTOX AI Assistant. I\'m monitoring 8 toxic gases across 6 zones right now.\n\n🔴 Zone C is in CRITICAL danger (SO₂: 480ppm)\n🟡 Zones D & E are on WARNING\n🟢 Zones A, B, F are safe\n\nAsk me about any gas, zone, or emergency procedure!';
  if (m.includes('thank') || m.includes('thanks')) return '🙏 You\'re welcome! Stay safe. Remember — if you\'re near Zone C, stay indoors. ZEROTOX AI is actively converting the toxic gases. You can always ask me anything!';
  // Default
  return '🤖 I can help with that! Here\'s what I know about ZEROTOX:\n\n🧪 Gases: CO, SO₂, NO₂, NH₃, H₂S, CH₄, VOC, CO₂\n🗺️ Zones: A (safe), B (safe), C (DANGER!), D (warn), E (warn), F (safe)\n📡 48 sensors online • 98.4% conversion efficiency\n\nTry asking:\n• "What is SO₂?"\n• "Zone C status"\n• "Emergency steps"\n• "How does ventilation work?"';
}

function addChatMsg(text, cls, time) {
  var msgs = document.getElementById('chatMessages');
  var div = document.createElement('div');
  var isTa = currentLang === 'ta' && cls === 'bot';
  div.className = 'chat-msg ' + cls + (isTa ? ' ta' : '');
  // Format bold text (**text**)
  var formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  div.innerHTML = formatted + '<div class="chat-msg-time">' + (time||'') + '</div>';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function clearChat() {
  var msgs = document.getElementById('chatMessages');
  msgs.innerHTML = '<div class="chat-msg bot"><strong>🌿 Chat cleared.</strong> Ask me anything about gases, zones, or safety!<div class="chat-msg-time">'+getTime()+'</div></div>';
}

function getTime() {
  var d = new Date();
  return d.getHours()+':'+String(d.getMinutes()).padStart(2,'0');
}

// Init quick buttons and set welcome time on load
window.addEventListener('load', function(){
  renderQuickButtons('all');
  var wt = document.getElementById('welcome-time');
  if (wt) wt.textContent = getTime();
});

// ══════════════════════════════
// CHARTS (Chart.js)
// ══════════════════════════════
var gasChart, zoneChart, pieChart;
var chartLabels = [];
var chartDataSO2 = [], chartDataNO2 = [], chartDataCO = [], chartDataH2S = [];

function initCharts() {
  // Generate historical labels (last 20 readings)
  for (var i = 19; i >= 0; i--) {
    var d = new Date(Date.now() - i * 3000);
    chartLabels.push(d.getHours()+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0'));
    chartDataSO2.push(Math.round(460 + (Math.random()-0.5)*40));
    chartDataNO2.push(Math.round(175 + (Math.random()-0.5)*20));
    chartDataCO.push(Math.round(35 + (Math.random()-0.5)*12));
    chartDataH2S.push(Math.round(40 + (Math.random()-0.5)*10));
  }

  var gCtx = document.getElementById('gasChart');
  if (!gCtx) return;
  gasChart = new Chart(gCtx, {
    type: 'line',
    data: {
      labels: chartLabels.slice(-12),
      datasets: [
        { label:'SO₂ (ppm)', data: chartDataSO2.slice(-12), borderColor:'#ff3b3b', backgroundColor:'rgba(255,59,59,0.08)', tension:0.4, pointRadius:3, borderWidth:2 },
        { label:'NO₂ (ppm)', data: chartDataNO2.slice(-12), borderColor:'#ffaa00', backgroundColor:'rgba(255,170,0,0.06)', tension:0.4, pointRadius:3, borderWidth:2 },
        { label:'CO (ppm)',  data: chartDataCO.slice(-12),  borderColor:'#00cfff', backgroundColor:'rgba(0,207,255,0.06)', tension:0.4, pointRadius:3, borderWidth:2 },
        { label:'H₂S (ppm)', data: chartDataH2S.slice(-12), borderColor:'#a855f7', backgroundColor:'rgba(168,85,247,0.06)', tension:0.4, pointRadius:3, borderWidth:2 }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:true,
      plugins:{ legend:{ labels:{ color:'#7aaa8a', font:{size:11}, boxWidth:12 } } },
      scales:{
        x:{ ticks:{ color:'#3a6a4a', font:{size:9}, maxRotation:0, maxTicksLimit:6 }, grid:{ color:'rgba(0,255,136,0.05)' } },
        y:{ ticks:{ color:'#3a6a4a', font:{size:10} }, grid:{ color:'rgba(0,255,136,0.05)' } }
      }
    }
  });

  var zCtx = document.getElementById('zoneChart');
  if (zCtx) {
    zoneChart = new Chart(zCtx, {
      type: 'bar',
      data: {
        labels:['A','B','C','D','E','F'],
        datasets:[{ label:'AQI', data:[42,58,340,165,148,38],
          backgroundColor:['rgba(0,255,136,0.5)','rgba(0,255,136,0.5)','rgba(255,59,59,0.6)','rgba(255,170,0,0.6)','rgba(255,170,0,0.6)','rgba(0,255,136,0.5)'],
          borderColor:['#00ff88','#00ff88','#ff3b3b','#ffaa00','#ffaa00','#00ff88'], borderWidth:1, borderRadius:4 }]
      },
      options:{ responsive:true, maintainAspectRatio:true, plugins:{ legend:{ display:false } },
        scales:{ x:{ ticks:{ color:'#3a6a4a', font:{size:10} }, grid:{ color:'rgba(0,255,136,0.04)' } }, y:{ ticks:{ color:'#3a6a4a', font:{size:9} }, grid:{ color:'rgba(0,255,136,0.04)' } } } }
    });
  }

  var pCtx = document.getElementById('pieChart');
  if (pCtx) {
    pieChart = new Chart(pCtx, {
      type: 'doughnut',
      data: {
        labels:['SO₂','NO₂','H₂S','CO','NH₃','VOC'],
        datasets:[{ data:[32,22,18,12,8,8],
          backgroundColor:['rgba(255,59,59,0.7)','rgba(255,170,0,0.7)','rgba(168,85,247,0.7)','rgba(0,207,255,0.7)','rgba(0,212,170,0.7)','rgba(0,255,136,0.7)'],
          borderColor:'#030f0a', borderWidth:2 }]
      },
      options:{ responsive:true, maintainAspectRatio:true,
        plugins:{ legend:{ position:'bottom', labels:{ color:'#7aaa8a', font:{size:9}, boxWidth:10, padding:6 } } } }
    });
  }
}

function switchChart(mode, btn) {
  document.querySelectorAll('.ctab').forEach(function(b){ b.classList.remove('on'); });
  btn.classList.add('on');
  if (!gasChart) return;
  if (mode === 'danger') {
    gasChart.data.datasets[0].hidden = false;
    gasChart.data.datasets[1].hidden = false;
    gasChart.data.datasets[2].hidden = true;
    gasChart.data.datasets[3].hidden = false;
  } else if (mode === '24h') {
    gasChart.data.datasets.forEach(function(d){ d.hidden = false; });
    // Show wider simulated data
    gasChart.data.labels = Array.from({length:12}, function(_,i){ return (i*2)+'h'; });
    gasChart.data.datasets[0].data = Array.from({length:12}, function(){return Math.round(400+(Math.random()-0.5)*120);});
    gasChart.data.datasets[1].data = Array.from({length:12}, function(){return Math.round(160+(Math.random()-0.5)*60);});
    gasChart.data.datasets[2].data = Array.from({length:12}, function(){return Math.round(30+(Math.random()-0.5)*20);});
    gasChart.data.datasets[3].data = Array.from({length:12}, function(){return Math.round(38+(Math.random()-0.5)*15);});
  } else {
    gasChart.data.datasets.forEach(function(d){ d.hidden = false; });
  }
  gasChart.update();
}

// Update chart in real time
setInterval(function(){
  if (!gasChart) return;
  var now = new Date();
  var label = now.getHours()+':'+String(now.getMinutes()).padStart(2,'0')+':'+String(now.getSeconds()).padStart(2,'0');
  gasChart.data.labels.push(label);
  gasChart.data.datasets[0].data.push(Math.round(460+(Math.random()-0.5)*40));
  gasChart.data.datasets[1].data.push(Math.round(175+(Math.random()-0.5)*20));
  gasChart.data.datasets[2].data.push(Math.round(35+(Math.random()-0.5)*12));
  gasChart.data.datasets[3].data.push(Math.round(40+(Math.random()-0.5)*10));
  if (gasChart.data.labels.length > 15) {
    gasChart.data.labels.shift();
    gasChart.data.datasets.forEach(function(d){ d.data.shift(); });
  }
  gasChart.update('none');
}, 3000);

// ══════════════════════════════
// EXPORT FEATURES
// ══════════════════════════════
function exportCSV() {
  var rows = [['Timestamp','Sensor','Zone','Gas','PPM','Status','Action']];
  var now = new Date();
  var data = [
    [now.toISOString(),'C-07','Zone C','SO₂','480','DANGER','Lime Scrubber Active'],
    [now.toISOString(),'D-12','Zone D','NO₂','178','WARNING','SCR Triggered'],
    [now.toISOString(),'S-03','Zone E','H₂S','42','WARNING','Combustion Chamber Active'],
    [now.toISOString(),'A-01','Zone A','CO','35','SAFE','Monitoring'],
    [now.toISOString(),'B-04','Zone B','NH₃','22','SAFE','Monitoring'],
    [now.toISOString(),'M-01','Zone F','CH₄','820','SAFE','Biogas Capture Ready'],
  ];
  data.forEach(function(r){ rows.push(r); });
  var csv = rows.map(function(r){ return r.join(','); }).join('\n');
  var blob = new Blob([csv], {type:'text/csv'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ZEROTOX_Report_' + now.toISOString().split('T')[0] + '.csv';
  a.click();
  notify('📊 CSV exported! · Gas data downloaded', 's');
}

function exportReport() {
  var now = new Date();
  var html = '<!DOCTYPE html><html><head><title>ZEROTOX Report</title><style>body{font-family:monospace;background:#030f0a;color:#cde8d8;padding:30px}h1{color:#00ff88}table{width:100%;border-collapse:collapse;margin:20px 0}th{background:#071a0f;color:#00ff88;padding:10px;text-align:left}td{padding:9px;border-bottom:1px solid #0a2015;color:#cde8d8}.danger{color:#ff3b3b}.warn{color:#ffaa00}.safe{color:#00ff88}</style></head><body>'
    +'<h1>🌿 ZEROTOX ECOSHIELD — Gas Report v5</h1>'
    +'<p>Generated: '+now.toLocaleString()+'</p>'
    +'<p><strong>Overall AQI: <span style="color:#ffaa00">142 — Moderate</span></strong></p>'
    +'<table><tr><th>Zone</th><th>Gas</th><th>Reading</th><th>Safe Limit</th><th>Status</th><th>AI Action</th></tr>'
    +'<tr><td>Zone C</td><td>SO₂</td><td class="danger">480 ppm</td><td>200 ppm</td><td class="danger">DANGER</td><td>Lime Scrubber ✅</td></tr>'
    +'<tr><td>Zone D</td><td>NO₂</td><td class="warn">178 ppm</td><td>200 ppm</td><td class="warn">WARNING</td><td>SCR Triggered ✅</td></tr>'
    +'<tr><td>Zone E</td><td>H₂S</td><td class="warn">42 ppm</td><td>20 ppm</td><td class="danger">DANGER</td><td>Combustion Active ✅</td></tr>'
    +'<tr><td>Zone A</td><td>CO</td><td class="safe">35 ppm</td><td>200 ppm</td><td class="safe">SAFE</td><td>Monitoring</td></tr>'
    +'<tr><td>Zone B</td><td>NH₃</td><td class="safe">22 ppm</td><td>100 ppm</td><td class="safe">SAFE</td><td>Monitoring</td></tr>'
    +'<tr><td>Zone F</td><td>CH₄</td><td class="safe">820 ppm</td><td>5000 ppm</td><td class="safe">SAFE</td><td>Biogas Ready</td></tr>'
    +'</table><hr><p style="color:#4a7a5e">Total gases converted today: 2,847 kg | CO₂ captured: 12.4 tons | Trees planted: 340</p>'
    +'<p style="color:#4a7a5e">Team: Akshara · Shalini · Yuvaraju | ZEROTOX AI v5.0</p></body></html>';
  var blob = new Blob([html], {type:'text/html'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ZEROTOX_Report_' + now.toISOString().split('T')[0] + '.html';
  a.click();
  notify('📄 Report downloaded! · Open in browser to print as PDF', 's');
}

function exportSummary() {
  notify('🖼️ Summary card — use browser screenshot (Ctrl+Shift+S) to save this screen!', 'w');
}

// ══════════════════════════════
// ENVIRONMENT DATA UPDATE
// ══════════════════════════════
setInterval(function(){
  var t = document.getElementById('env-temp');
  var h = document.getElementById('env-hum');
  var w = document.getElementById('env-wind');
  if (t) t.textContent = (27+Math.round(Math.random()*3))+'°C';
  if (h) h.textContent = (68+Math.round(Math.random()*8))+'%';
  if (w) w.textContent = (10+Math.round(Math.random()*5))+'km/h';
}, 5000);

// ══════════════════════════════
// GAS SOLUTION
// ══════════════════════════════
var SOLS = {
  co:  {name:'Carbon Monoxide (CO)',    formula:'2CO + O₂ → 2CO₂',                       method:'Catalytic Oxidation',         output:'CO₂ — captured by trees',       steps:['Sensor detects CO above 100 ppm','AI activates catalytic converter chamber','CO reacts with oxygen at high temperature','Converts to CO₂ — verified by post sensor','CO₂ absorbed by planted trees']},
  so2: {name:'Sulfur Dioxide (SO₂)',    formula:'SO₂ + Ca(OH)₂ → CaSO₃ + H₂O',          method:'Wet Lime Scrubbing',           output:'Harmless powder + water',        steps:['Sensor detects SO₂ above 200 ppm','AI activates wet lime scrubber','Lime water sprayed on gas stream','SO₂ converts to harmless CaSO₃ powder','Powder reused in cement manufacturing']},
  no2: {name:'Nitrogen Dioxide (NO₂)', formula:'4NO₂ + 4NH₃ + O₂ → 4N₂ + 6H₂O',       method:'SCR Catalytic Reduction',      output:'Safe N₂ gas + water vapor',      steps:['Sensor detects NO₂ near 200 ppm','AI injects precise ammonia NH₃','Vanadium catalyst + heat breaks molecules','NO₂ becomes harmless N₂ + water steam','Zero toxic residue confirmed']},
  nh3: {name:'Ammonia (NH₃)',           formula:'4NH₃ + 3O₂ → 2N₂ + 6H₂O',              method:'Thermal Oxidation',            output:'Safe N₂ gas + water vapor',      steps:['Sensor detects NH₃ above 50 ppm','AI activates thermal oxidation chamber','NH₃ burned with oxygen at high temp','Converts to safe N₂ and water steam','Chamber auto-stops after treatment']},
  h2s: {name:'Hydrogen Sulfide (H₂S)', formula:'2H₂S + 3O₂ → 2SO₂ → CaSO₃ + H₂O',    method:'Combustion + Lime Scrubbing',  output:'Harmless powder + water vapor',  steps:['Sensor detects H₂S above 10 ppm','AI activates combustion chamber','H₂S burns to SO₂ and water','SO₂ then treated by lime scrubber','Final output: only harmless CaSO₃ powder']},
  ch4: {name:'Methane (CH₄)',           formula:'CH₄ + 2O₂ → CO₂ + H₂O  (Biogas ⚡)',   method:'Biogas Capture + Combustion',  output:'Free electricity or CO₂+water',  steps:['Methane sensors detect buildup','AI opens capture valve — collects gas','Methane sent to biogas generator','Generates free electricity ⚡','Excess burned safely to CO₂+water']},
  voc: {name:'VOC — Volatile Organics', formula:'VOC + O₂ → CO₂ + H₂O  (UV + TiO₂)',   method:'UV Photocatalytic Oxidation',  output:'CO₂ + water — completely safe',  steps:['VOC sensor detects above 0.3 mg/m³','AI activates UV lamps + TiO₂ catalyst','UV light creates reactive oxygen radicals','VOC molecules fully oxidized','Output: only CO₂ and water']}
};

function showSol(gas) {
  var out = document.getElementById('solout');
  if (!gas) { out.classList.remove('show'); out.innerHTML=''; return; }
  var s = SOLS[gas];
  if (!s) return;
  out.innerHTML =
    '<div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:8px">'+s.name+'</div>'+
    '<div style="font-size:10px;color:#3a6a4a;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">Chemical Formula</div>'+
    '<div class="formula">'+s.formula+'</div>'+
    '<div style="margin:10px 0"><span class="pill t">⚗️ '+s.method+'</span><span class="pill g">✅ '+s.output+'</span></div>'+
    '<div style="font-size:10px;color:#3a6a4a;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">AI Steps</div>'+
    s.steps.map(function(st,i){return '<div class="solstep"><div class="stepnum">'+(i+1)+'</div><div>'+st+'</div></div>';}).join('');
  out.classList.add('show');
}

// ══════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════
function notify(msg, type) {
  var wrap = document.getElementById('notifw');
  var n = document.createElement('div');
  type = type || 's';
  n.className = 'notif ' + (type==='d'?'d':type==='w'?'w':'');
  var ico = {d:'☠️',w:'⚠️',s:'✅'}[type]||'✅';
  var parts = msg.split('·');
  n.innerHTML = '<div class="ntico">'+ico+'</div><div class="ntxt"><strong>'+(parts[0]||msg)+'</strong><span>'+(parts[1]||'ZEROTOX AI')+'</span></div>';
  wrap.appendChild(n);
  setTimeout(function(){
    n.style.animation='nout 0.3s ease forwards';
    setTimeout(function(){ if(n.parentNode) n.parentNode.removeChild(n); },300);
  },3500);
}

// ══════════════════════════════
// LIVE DATA
// ══════════════════════════════
function rnd(b,r){ return Math.round(b+(Math.random()-0.5)*r); }
setInterval(function(){
  var vals = {'m-co':rnd(35,12)+' ppm','m-no2':rnd(178,18)+' ppm','m-nh3':rnd(22,8)+' ppm','m-ch4':rnd(820,60)+' ppm','m-co2':rnd(412,15)+' ppm','h-co':rnd(35,12)+' ppm','h-no2':rnd(178,18)+' ppm','h-so2':rnd(478,15)+' ppm','h-aqi':String(rnd(142,12))};
  Object.keys(vals).forEach(function(id){ var el=document.getElementById(id); if(el) el.textContent=vals[id]; });
  var conv=document.getElementById('h-conv');
  if(conv){ var c=parseInt(conv.textContent.replace(/,/g,''))||2847; conv.textContent=(c+Math.floor(Math.random()*5)).toLocaleString(); }
},3000);

// Auto random alerts
var autoA=[{m:'⚠️ VOC rising Zone D · 0.54 mg/m³',t:'w'},{m:'✅ NH₃ back to safe · Zone B clear',t:'s'},{m:'🔧 Sensor S-03 battery low · Maintenance sent',t:'w'},{m:'📊 Daily report ready · Download available',t:'s'}];
var aIdx=0;
setInterval(function(){ var a=autoA[aIdx%autoA.length]; notify(a.m,a.t); aIdx++; },15000);

// Enter key on login
document.getElementById('lpassword').addEventListener('keydown',function(e){ if(e.key==='Enter') doLogin(); });
document.getElementById('lusername').addEventListener('keydown',function(e){ if(e.key==='Enter') document.getElementById('lpassword').focus(); });
