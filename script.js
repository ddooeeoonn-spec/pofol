// 1. 초기 테마 설정 (깜빡임 최소화)
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.body.classList.add('light-mode');
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Progress Bar Animation in skills.html
  const progressFills = document.querySelectorAll('.progress-fill');
  if (progressFills.length > 0) {
    // 0.2초 딜레이를 주어 페이지 로드가 완전히 끝난 후 게이지가 차오르도록 연출
    setTimeout(() => {
      progressFills.forEach(fill => {
        const targetWidth = fill.getAttribute('data-target');
        fill.style.width = targetWidth;
      });
    }, 200);
  }

  // 2. 다크/라이트 모드 토글 버튼 추가 및 리스너 등록
  setupThemeToggle();

  // 3. 관리자 모드 및 로그인 검증 기능 설정
  setupAdminMode();

  // 4. 홈페이지 최초 진입 시 해돋이 대문 인트로(Sunrise Intro) 작동 설정
  const seenIntro = sessionStorage.getItem('seen-sunrise-intro') === 'true';
  const forceIntro = window.location.search.includes('trigger-intro=true');
  
  if (!seenIntro || forceIntro) {
    showSunriseIntro();
    if (forceIntro) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  // 5. 왼쪽 위 logo(DOEON.KIM) 클릭 시 인트로 대문으로 유기적 복귀 기능 연동
  setupLogoTrigger();

  // 6. Organic Interactive Canvas Background (메인 콘텐츠 뒷배경)
  initOrganicCanvas();

  // 7. Smooth fade-in for page transitions
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease';
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 50);
});

// 왼쪽 위 로고 클릭 이벤트 연동
function setupLogoTrigger() {
  const logo = document.querySelector('.logo');
  if (logo) {
    logo.addEventListener('click', (e) => {
      sessionStorage.removeItem('seen-sunrise-intro');
      
      const isIndex = window.location.pathname.endsWith('index.html') || 
                      window.location.pathname === '/' || 
                      window.location.pathname.endsWith('/portfolio/') || 
                      window.location.pathname.endsWith('portfolio');
                      
      if (isIndex) {
        e.preventDefault();
        showSunriseIntro();
      } else {
        e.preventDefault();
        window.location.href = 'index.html?trigger-intro=true';
      }
    });
  }
}

// 테마 토글 버튼 셋업 함수
function setupThemeToggle() {
  const navUl = document.querySelector('nav ul');
  if (navUl) {
    const li = document.createElement('li');
    li.className = 'theme-toggle-li';

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'theme-toggle';
    toggleBtn.setAttribute('aria-label', '테마 전환');
    
    const isLight = document.body.classList.contains('light-mode');
    toggleBtn.innerHTML = getThemeIcon(isLight);

    li.appendChild(toggleBtn);
    navUl.appendChild(li);

    toggleBtn.addEventListener('click', () => {
      const currentlyLight = document.body.classList.toggle('light-mode');
      localStorage.setItem('theme', currentlyLight ? 'light' : 'dark');
      toggleBtn.innerHTML = getThemeIcon(currentlyLight);
    });
  }
}

// 라이트/다크 모드에 따른 아이콘 (Sun/Moon SVG)
function getThemeIcon(isLight) {
  if (isLight) {
    // Moon Icon
    return `<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>`;
  } else {
    // Sun Icon
    return `<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>`;
  }
}

// 관리자 로그인 및 인라인 편집 CMS 기능
function setupAdminMode() {
  // 1. 편집 가능 대상 태그 선정
  const editableSelectors = 'h1, h2, h3, h4, p, li, span.trait-tag, span.activity-badge, span.activity-date, .progress-name, .progress-val, .info-item p, .cert-info p, .cert-info h4, .cert-date';
  const editables = document.querySelectorAll(editableSelectors);
  
  editables.forEach((el, index) => {
    if (
      el.closest('header') || 
      el.closest('footer') || 
      el.classList.contains('btn') || 
      el.closest('.btn') || 
      el.id === 'admin-panel' || 
      el.closest('#admin-panel') ||
      el.closest('.login-modal') ||
      el.closest('#sunrise-intro')
    ) {
      return;
    }
    el.setAttribute('data-edit-id', `edit-${index}`);
    el.classList.add('editable-element');
  });

  // 2. 저장된 로컬스토리지 편집 내용 로드 및 맵핑 (+ 막대그래프 값 동기화 포함)
  const pageKey = 'portfolio-content-' + window.location.pathname;
  const savedContent = localStorage.getItem(pageKey);
  if (savedContent) {
    const contentData = JSON.parse(savedContent);
    Object.entries(contentData).forEach(([id, html]) => {
      const el = document.querySelector(`[data-edit-id="${id}"]`);
      if (el) {
        el.innerHTML = html;
        
        // 게이지 바 퍼센트 텍스트 복원 시, 실제 그래프 넓이(data-target 및 width) 동기화
        if (el.classList.contains('progress-val')) {
          const wrapper = el.closest('.progress-bar-wrapper');
          if (wrapper) {
            const fill = wrapper.querySelector('.progress-fill');
            if (fill) {
              const valText = el.innerText.trim();
              fill.setAttribute('data-target', valText);
              fill.style.width = valText;
            }
          }
        }
      }
    });
  }

  // 3. 하단 관리자 제어 패널(저장/초기화/로그아웃) 동적 생성
  const adminPanel = document.createElement('div');
  adminPanel.id = 'admin-panel';
  adminPanel.innerHTML = `
    <h5>🔧 관리자 편집 모드</h5>
    <p>텍스트를 마우스로 클릭하여 자유롭게 내용을 수정하세요.</p>
    <div class="admin-btn-group">
      <button class="admin-control-btn admin-save-btn">변경사항 저장</button>
      <button class="admin-control-btn admin-reset-btn">원본 초기화</button>
    </div>
    <button class="admin-control-btn admin-logout-btn" style="margin-top: 0.5rem; width: 100%; background: rgba(255, 0, 127, 0.05); border: 1px solid var(--border-glass); color: var(--text-muted);">로그아웃</button>
  `;
  document.body.appendChild(adminPanel);

  const saveBtn = adminPanel.querySelector('.admin-save-btn');
  const resetBtn = adminPanel.querySelector('.admin-reset-btn');
  const logoutBtn = adminPanel.querySelector('.admin-logout-btn');

  // 변경 사항 저장 (저장 후에도 편집 모드가 유지되도록 변경)
  saveBtn.addEventListener('click', () => {
    const contentData = {};
    const editableElements = document.querySelectorAll('[data-edit-id]');
    
    editableElements.forEach(el => {
      contentData[el.getAttribute('data-edit-id')] = el.innerHTML;
    });
    
    localStorage.setItem(pageKey, JSON.stringify(contentData));
    alert('수정된 내용이 성공적으로 보존되었습니다!');
  });

  // 변경 사항 리셋 및 원본 복구
  resetBtn.addEventListener('click', () => {
    if (confirm('수정한 모든 내용을 취소하고 원본 텍스트로 초기화하시겠습니까?')) {
      localStorage.removeItem(pageKey);
      location.reload();
    }
  });

  // 로그아웃 리스너
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('admin-logged-in');
    toggleAdminState(false);
    alert('로그아웃 되었습니다.');
  });

  // 4. 로그인 팝업 모달 생성
  createLoginModal();

  // 5. 네비게이션 헤더에 관리자 모드 진입 버튼 삽입 (아이콘 버튼화)
  const navUl = document.querySelector('nav ul');
  if (navUl) {
    const li = document.createElement('li');
    li.className = 'admin-toggle-li';

    const adminToggleBtn = document.createElement('button');
    adminToggleBtn.id = 'admin-toggle-btn';
    adminToggleBtn.setAttribute('aria-label', '관리자 모드');
    
    // 설정/톱니바퀴 Gear SVG 아이콘 삽입
    adminToggleBtn.innerHTML = `<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>`;
    
    li.appendChild(adminToggleBtn);
    
    // 테마 토글 버튼 바로 앞에 관리자 버튼 삽입
    const themeLi = navUl.querySelector('.theme-toggle-li');
    if (themeLi) {
      navUl.insertBefore(li, themeLi);
    } else {
      navUl.appendChild(li);
    }

    adminToggleBtn.addEventListener('click', () => {
      const loggedIn = sessionStorage.getItem('admin-logged-in') === 'true';
      if (loggedIn) {
        const isActive = document.body.classList.toggle('admin-mode');
        toggleAdminState(isActive);
      } else {
        const overlay = document.getElementById('admin-login-overlay');
        if (overlay) {
          overlay.classList.add('active');
          document.getElementById('admin-id-input').focus();
        }
      }
    });
  }

  // 6. [중요] 이전 페이지에서 관리자 모드가 활성화되어 있었다면, 페이지 네비게이션 시에도 상태 유지
  const loggedIn = sessionStorage.getItem('admin-logged-in') === 'true';
  const adminModeActive = sessionStorage.getItem('admin-mode-active') === 'true';
  if (loggedIn && adminModeActive) {
    toggleAdminState(true);
  }

  // 7. 실시간 역량 수치 텍스트 수정 시, 비주얼 막대 그래프 자동 비례 연동
  setupProgressBarSync();
}

// 역량 그래프 수치 실시간 편집 동기화 함수
function setupProgressBarSync() {
  const valElements = document.querySelectorAll('.progress-val');
  valElements.forEach(valEl => {
    valEl.addEventListener('input', () => {
      const wrapper = valEl.closest('.progress-bar-wrapper');
      if (wrapper) {
        const fill = wrapper.querySelector('.progress-fill');
        if (fill) {
          const valText = valEl.innerText.trim();
          if (/^\d+%?$/.test(valText)) {
            const pct = valText.endsWith('%') ? valText : valText + '%';
            fill.setAttribute('data-target', pct);
            fill.style.width = pct;
          }
        }
      }
    });
  });
}

// 관리자 로그인 모달 마크업 동적 주입 및 리스너 등록
function createLoginModal() {
  const overlay = document.createElement('div');
  overlay.id = 'admin-login-overlay';
  overlay.className = 'admin-login-overlay';
  overlay.innerHTML = `
    <div class="login-modal">
      <h3>🔑 관리자 인증</h3>
      <div class="login-input-group">
        <label for="admin-id-input">아이디</label>
        <input type="text" id="admin-id-input" class="login-input" placeholder="아이디 입력">
      </div>
      <div class="login-input-group">
        <label for="admin-pw-input">비밀번호</label>
        <input type="password" id="admin-pw-input" class="login-input" placeholder="비밀번호 입력">
      </div>
      <div class="login-error-msg" id="login-error-msg">아이디 또는 비밀번호가 틀렸습니다.</div>
      <div class="login-btn-group">
        <button class="admin-control-btn login-submit-btn">로그인</button>
        <button class="admin-control-btn login-cancel-btn">취소</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const submitBtn = overlay.querySelector('.login-submit-btn');
  const cancelBtn = overlay.querySelector('.login-cancel-btn');
  const idInput = overlay.querySelector('#admin-id-input');
  const pwInput = overlay.querySelector('#admin-pw-input');
  const errorMsg = overlay.querySelector('#login-error-msg');

  // 로그인 모달 종료 기능
  function closeLoginModal() {
    overlay.classList.remove('active');
    idInput.value = '';
    pwInput.value = '';
    errorMsg.style.display = 'none';
  }

  // 로그인 인증 수행 함수 (ID: doeon / PW: 970711)
  function handleLogin() {
    const inputId = idInput.value.trim();
    const inputPw = pwInput.value.trim();

    if (inputId === 'doeon' && inputPw === '970711') {
      sessionStorage.setItem('admin-logged-in', 'true');
      closeLoginModal();
      toggleAdminState(true);
      alert('관리자 모드가 실행되었습니다. 텍스트를 수정하세요!');
    } else {
      errorMsg.style.display = 'block';
      idInput.focus();
    }
  }

  submitBtn.addEventListener('click', handleLogin);
  cancelBtn.addEventListener('click', closeLoginModal);
  
  pwInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  idInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLoginModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeLoginModal();
  });
}

// 관리자 모드 상태 전환 조작 함수
function toggleAdminState(enable) {
  const editables = document.querySelectorAll('[data-edit-id]');
  editables.forEach(el => {
    el.contentEditable = enable ? 'true' : 'false';
  });

  const adminPanel = document.getElementById('admin-panel');
  const toggleBtn = document.getElementById('admin-toggle-btn');
  
  if (adminPanel) {
    adminPanel.classList.toggle('active', enable);
  }
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', enable);
  }
  
  if (!enable) {
    document.body.classList.remove('admin-mode');
    sessionStorage.removeItem('admin-mode-active');
  } else {
    document.body.classList.add('admin-mode');
    sessionStorage.setItem('admin-mode-active', 'true');
  }
}

// ==========================================
// 🌅 해돋이 대문 인트로 구현 (Sunrise Intro Canvas)
// ==========================================
function showSunriseIntro() {
  if (document.getElementById('sunrise-intro')) return;

  const intro = document.createElement('div');
  intro.id = 'sunrise-intro';
  intro.innerHTML = `
    <canvas id="sunrise-canvas"></canvas>
    <div class="intro-gate gate-top"></div>
    <div class="intro-gate gate-bottom"></div>
    <div class="intro-content">
      <h1>DOEON.KIM</h1>
      <p>CLICK TO ENTER</p>
    </div>
  `;
  document.body.appendChild(intro);

  initSunriseCanvas(intro);
}

function initSunriseCanvas(introContainer) {
  const canvas = introContainer.querySelector('#sunrise-canvas');
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  let mouse = { x: width / 2, y: height / 2, active: false };
  
  // 태양 초기 위치: 중앙에서 기하학적 수평선에 배치
  let sun = {
    x: width / 2,
    y: height * 0.74,
    targetY: height * 0.74,
    size: 65,
    glow: 130
  };

  let gateOpening = false;
  let skyTransition = 0; // 0 (어두운 상태) ➔ 1 (완전한 여명)

  // 1. 대문 클릭 시 상하 해금 및 해돋이 애니메이션 가동
  introContainer.addEventListener('click', () => {
    if (gateOpening) return;
    gateOpening = true;
    introContainer.classList.add('open');

    // 태양이 높은 하늘로 치솟아오름
    sun.targetY = height * 0.26;

    let startTime = null;
    const duration = 1800; // 1.8초 동안 해돋이 완성

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      let progress = (timestamp - startTime) / duration;
      if (progress > 1) progress = 1;

      skyTransition = progress;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setTimeout(() => {
          introContainer.classList.add('fade-out');
          sessionStorage.setItem('seen-sunrise-intro', 'true');
          setTimeout(() => {
            introContainer.remove();
          }, 1000);
        }, 300);
      }
    }
    requestAnimationFrame(step);
  });

  // 2. 마우스 인터랙티브 좌표 트래킹
  introContainer.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });

  introContainer.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  // 컬러 선형 보간 보조함수
  function lerpColor(c1, c2, f) {
    const r = Math.round(c1[0] + (c2[0] - c1[0]) * f);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * f);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * f);
    return `rgb(${r}, ${g}, ${b})`;
  }

  // 3. 인트로 캔버스 해돋이 비주얼 렌더 루프 (디지털 네온 테크 스타일로 전면 개편)
  function draw(time) {
    if (!document.getElementById('sunrise-intro')) return; // 대문 닫힘/소멸 시 루프 정지

    ctx.clearRect(0, 0, width, height);

    const isLight = document.body.classList.contains('light-mode');

    // [테마 연동형 그라데이션 컬러 매핑]
    let skyGradient;
    if (!isLight) {
      // 다크 모드: 딥 옵시디언 ➔ 청록/퍼플 네온 스펙트럼 여명
      const topCol = lerpColor([6, 4, 12], [14, 10, 32], skyTransition);
      const midCol = lerpColor([15, 10, 24], [138, 43, 226], skyTransition); // 퍼플
      const botCol = lerpColor([22, 15, 32], [0, 245, 212], skyTransition);   // 청록 네온
      skyGradient = ctx.createLinearGradient(0, 0, 0, height);
      skyGradient.addColorStop(0, topCol);
      skyGradient.addColorStop(0.5, midCol);
      skyGradient.addColorStop(1, botCol);
    } else {
      // 라이트 모드: 분홍빛 화이트 ➔ 핫핑크/딥핑크 네온 스펙트럼 여명
      const topCol = lerpColor([255, 240, 245], [255, 228, 238], skyTransition);
      const midCol = lerpColor([255, 220, 235], [255, 105, 180], skyTransition); // 핑크
      const botCol = lerpColor([255, 205, 220], [255, 0, 127], skyTransition);   // 핫핑크
      skyGradient = ctx.createLinearGradient(0, 0, 0, height);
      skyGradient.addColorStop(0, topCol);
      skyGradient.addColorStop(0.5, midCol);
      skyGradient.addColorStop(1, botCol);
    }
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // [태양 위치 갱신]
    sun.y += (sun.targetY - sun.y) * 0.045;

    // 마우스 가로 패럴랙스 & 세로 Nudge
    if (mouse.active) {
      const targetX = width / 2 + (mouse.x - width / 2) * 0.08;
      sun.x += (targetX - sun.x) * 0.05;
      
      const targetNudgeY = (mouse.y - height / 2) * 0.03;
      sun.y += (sun.targetY + targetNudgeY - sun.y) * 0.05;
    } else {
      sun.x += (width / 2 - sun.x) * 0.05;
    }

    // [제네레이티브 디자인: 태양 주위 홀로그래픽 벡터 링 그리기]
    // 기존의 사실적인 이미지 대신 포트폴리오 디자인 톤과 어울리는 동적 동심원 링 주입
    ctx.save();
    ctx.strokeStyle = isLight 
      ? `rgba(255, 0, 127, ${0.15 + skyTransition * 0.25})` 
      : `rgba(0, 245, 212, ${0.15 + skyTransition * 0.25})`;
    ctx.lineWidth = 1.2;

    // 우회전 점선 링
    ctx.save();
    ctx.translate(sun.x, sun.y);
    ctx.rotate(time * 0.0004);
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, sun.size + 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 좌회전 미세 점선 링
    ctx.save();
    ctx.translate(sun.x, sun.y);
    ctx.rotate(-time * 0.0002);
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, sun.size + 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    
    ctx.restore();

    // [마우스 인터랙션: 입체적인 홀로그램 광선(Ray)]
    if (mouse.active && skyTransition > 0.15) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      const rayCount = 35;
      const opacity = (isLight ? 0.12 : 0.16) * skyTransition;
      
      for (let i = 0; i < rayCount; i++) {
        const baseAngle = (i / rayCount) * Math.PI * 2;
        const angle = baseAngle + Math.sin(time * 0.0005 + i) * 0.03;
        
        const len = Math.max(width, height) * 1.2;
        const endX = sun.x + Math.cos(angle) * len;
        const endY = sun.y + Math.sin(angle) * len;

        ctx.beginPath();
        ctx.moveTo(sun.x, sun.y);
        ctx.lineTo(endX, endY);

        const rayGrad = ctx.createLinearGradient(sun.x, sun.y, endX, endY);
        if (!isLight) {
          rayGrad.addColorStop(0, `rgba(0, 245, 212, ${opacity})`);
          rayGrad.addColorStop(0.3, `rgba(161, 84, 242, ${opacity * 0.4})`);
        } else {
          rayGrad.addColorStop(0, `rgba(255, 0, 127, ${opacity})`);
          rayGrad.addColorStop(0.3, `rgba(255, 105, 180, ${opacity * 0.4})`);
        }
        rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.strokeStyle = rayGrad;
        ctx.lineWidth = Math.random() * 2 + 0.8;
        ctx.stroke();
      }
      ctx.restore();
    }

    // [태양 글로우 & 코어 렌더링]
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const glowRad = sun.glow + (skyTransition * 90);
    const outerGrad = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, glowRad);
    
    if (!isLight) {
      outerGrad.addColorStop(0, `rgba(0, 242, 254, ${0.45 + skyTransition * 0.25})`);
      outerGrad.addColorStop(0.4, `rgba(161, 84, 242, ${0.22 + skyTransition * 0.18})`);
    } else {
      outerGrad.addColorStop(0, `rgba(255, 0, 127, ${0.45 + skyTransition * 0.25})`);
      outerGrad.addColorStop(0.4, `rgba(255, 105, 180, ${0.22 + skyTransition * 0.18})`);
    }
    outerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.beginPath();
    ctx.arc(sun.x, sun.y, glowRad, 0, Math.PI * 2);
    ctx.fillStyle = outerGrad;
    ctx.fill();

    // 밝은 태양 핵 코어
    const innerGrad = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, sun.size);
    if (!isLight) {
      innerGrad.addColorStop(0, '#ffffff');
      innerGrad.addColorStop(0.3, '#00f2fe');
      innerGrad.addColorStop(1, 'rgba(161, 84, 242, 0)');
    } else {
      innerGrad.addColorStop(0, '#ffffff');
      innerGrad.addColorStop(0.3, '#ff69b4');
      innerGrad.addColorStop(1, 'rgba(255, 0, 127, 0)');
    }

    ctx.beginPath();
    ctx.arc(sun.x, sun.y, sun.size, 0, Math.PI * 2);
    ctx.fillStyle = innerGrad;
    ctx.fill();

    ctx.restore();

    // [제네레이티브 디자인: 네온 와이어프레임 파동 수평선 (Digital Ocean Grid)]
    // 단조로운 검은 면적 대신 overlapping glowing sine waves로 테마의 시그니처 형상 매핑
    ctx.save();
    ctx.strokeStyle = isLight ? 'rgba(255, 0, 127, 0.45)' : 'rgba(0, 245, 212, 0.45)';
    ctx.lineWidth = 1.5;

    const waveCount = 4;
    for (let w = 0; w < waveCount; w++) {
      ctx.beginPath();
      // 각 물결의 높이선 분산
      const baseHeight = height * (0.74 + w * 0.025);
      ctx.moveTo(0, height);
      ctx.lineTo(0, baseHeight);
      
      for (let x = 0; x <= width; x += 15) {
        // 인덱스 및 시간차를 이용한 동적 파동 시뮬레이션
        const waveY = baseHeight + Math.sin(x * 0.005 + time * 0.0012 + w * 1.8) * (11 - w * 2.2);
        ctx.lineTo(x, waveY);
      }
      ctx.lineTo(width, height);
      ctx.closePath();

      // 바다 면적을 투명 그라데이션으로 채워 입체감 강화
      const oceanGrad = ctx.createLinearGradient(0, baseHeight - 20, 0, height);
      if (isLight) {
        oceanGrad.addColorStop(0, `rgba(255, 105, 180, ${0.16 - w * 0.035})`);
        oceanGrad.addColorStop(1, 'rgba(255, 240, 245, 0)');
      } else {
        oceanGrad.addColorStop(0, `rgba(0, 245, 212, ${0.12 - w * 0.03})`);
        oceanGrad.addColorStop(1, 'rgba(6, 4, 10, 0)');
      }
      ctx.fillStyle = oceanGrad;
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);

  // 리사이즈
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });
}

// ==========================================
// 🌌 메인 배경용 오가닉 인터랙티브 캔버스
// ==========================================
function initOrganicCanvas() {
  const canvas = document.createElement('canvas');
  canvas.id = 'organic-canvas';
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  let mouse = { x: null, y: null, radius: 180 };
  let scrollY = window.scrollY;

  window.addEventListener('mousemove', (e) => {
    // 인트로 대문이 있을 때는 뒷배경 마우스 오동작 방지
    if (document.getElementById('sunrise-intro')) {
      mouse.x = null;
      mouse.y = null;
      return;
    }
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  window.addEventListener('scroll', () => {
    const diff = window.scrollY - scrollY;
    scrollY = window.scrollY;
    particles.forEach(p => {
      p.y -= diff * 0.4;
    });
  });

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // 파티클 모델
  class Particle {
    constructor() {
      this.reset();
      this.y = Math.random() * height;
    }

    reset() {
      this.x = Math.random() * width;
      this.y = -10;
      this.size = Math.random() * 4 + 1.2;
      this.baseSpeed = Math.random() * 0.4 + 0.15;
      this.speedX = 0;
      this.speedY = this.baseSpeed;
      this.angle = Math.random() * Math.PI * 2;
      this.angleSpeed = Math.random() * 0.015 - 0.0075;
      
      this.color = Math.random() > 0.5 ? 'rgba(0, 245, 212, ' : 'rgba(161, 84, 242, ';
      this.alpha = Math.random() * 0.35 + 0.15;
      this.hue = Math.random() * 360;
      this.spin = Math.random() * Math.PI * 2;
      this.spinSpeed = Math.random() * 0.02 - 0.01;
    }

    update() {
      this.angle += this.angleSpeed;
      this.speedX = Math.sin(this.angle + this.y * 0.005) * 0.5;
      this.speedY = this.baseSpeed + Math.cos(this.angle) * 0.15;

      this.hue = (this.hue + 0.8) % 360;
      this.spin += this.spinSpeed;

      if (mouse.x !== null && mouse.y !== null) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const forceX = (dx / dist) * force * 2.0;
          const forceY = (dy / dist) * force * 2.0;
          this.x += forceX;
          this.y += forceY;
        }
      }

      this.x += this.speedX;
      this.y += this.speedY;

      if (this.y > height + 10) {
        this.reset();
      }
      if (this.x < -10) this.x = width + 10;
      if (this.x > width + 10) this.x = -10;
    }

    draw() {
      const isLight = document.body.classList.contains('light-mode');
      
      if (isLight) {
        // 라이트 모드 (벚꽃잎)
        const pinkColor = this.color.includes('0, 245, 212') 
          ? `rgba(255, 105, 180, ${this.alpha})`
          : `rgba(255, 182, 193, ${this.alpha})`;
        
        const drawSize = this.size * 2.2;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.spin);
        ctx.beginPath();
        ctx.moveTo(0, drawSize);
        ctx.bezierCurveTo(-drawSize * 1.3, drawSize * 0.4, -drawSize * 1.2, -drawSize * 0.6, -drawSize * 0.3, -drawSize);
        ctx.quadraticCurveTo(0, -drawSize * 0.5, drawSize * 0.3, -drawSize);
        ctx.bezierCurveTo(drawSize * 1.2, -drawSize * 0.6, drawSize * 1.3, drawSize * 0.4, 0, drawSize);
        ctx.fillStyle = pinkColor;
        ctx.fill();
        ctx.restore();
      } else {
        // 다크 모드 (무지개 그라데이션)
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 90%, 65%, ${this.alpha})`;
        ctx.fill();
      }
    }
  }

  // 대형 액체(Blob) 그래픽
  class LiquidBlob {
    constructor(color, size, targetX, targetY) {
      this.color = color;
      this.size = size;
      this.x = targetX;
      this.y = targetY;
      this.tx = targetX;
      this.ty = targetY;
      this.angle = Math.random() * Math.PI * 2;
      this.angleSpeed = Math.random() * 0.004 + 0.001;
    }

    update() {
      this.angle += this.angleSpeed;
      this.currentSize = this.size + Math.sin(this.angle) * 35;
      this.x += (this.tx - this.x) * 0.04;
      this.y += (this.ty - this.y) * 0.04;
    }

    draw() {
      const isLight = document.body.classList.contains('light-mode');
      let displayColor = this.color;
      if (isLight) {
        if (this.color.includes('0, 242, 254')) {
          displayColor = 'rgba(255, 0, 127, 0.07)';
        } else if (this.color.includes('161, 84, 242')) {
          displayColor = 'rgba(255, 105, 180, 0.07)';
        } else {
          displayColor = 'rgba(255, 192, 203, 0.05)';
        }
      }

      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.currentSize);
      gradient.addColorStop(0, displayColor);
      gradient.addColorStop(0.5, displayColor.replace(/[\d\.]+\)$/, '0.01)')); 
      
      const transparentColor = displayColor.substring(0, displayColor.lastIndexOf(',')) + ', 0)';
      gradient.addColorStop(1, transparentColor);
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  const particles = [];
  const particleCount = Math.min(100, Math.floor((width * height) / 12000));
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  const blobs = [
    new LiquidBlob('rgba(0, 242, 254, 0.06)', 350, width * 0.2, height * 0.3),
    new LiquidBlob('rgba(161, 84, 242, 0.06)', 400, width * 0.8, height * 0.7),
    new LiquidBlob('rgba(0, 245, 212, 0.04)', 300, width * 0.5, height * 0.5)
  ];

  function animate(time) {
    const isLight = document.body.classList.contains('light-mode');
    
    ctx.fillStyle = isLight ? 'rgba(255, 240, 245, 0.15)' : 'rgba(6, 4, 10, 0.12)';
    ctx.fillRect(0, 0, width, height);

    blobs.forEach((blob, idx) => {
      if (mouse.x !== null && mouse.y !== null) {
        if (idx === 0) {
          blob.tx = mouse.x;
          blob.ty = mouse.y;
        } else if (idx === 1) {
          blob.tx = width - mouse.x;
          blob.ty = height - mouse.y;
        } else {
          blob.tx = (width / 2 + mouse.x) / 2;
          blob.ty = (height / 2 + mouse.y) / 2;
        }
      } else {
        blob.tx = width / 2 + Math.sin(time * 0.0004 + idx * 2) * (width * 0.25);
        blob.ty = height / 2 + Math.cos(time * 0.0003 + idx * 1.5) * (height * 0.25);
      }
      blob.update();
      blob.draw();
    });

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
