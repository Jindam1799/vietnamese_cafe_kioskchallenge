/**
 * 진담카페 챌린지 v2.6 - 옵션 로직 최적화 버전
 */

const layers = {
    video: document.getElementById('layer-video'),
    chat: document.getElementById('layer-chat'),
    kiosk: document.getElementById('layer-kiosk')
};

const video = document.getElementById('opening-video');
const chatLog = document.getElementById('chat-log');
const choiceArea = document.getElementById('choice-area');
const timerDisplay = document.getElementById('timer-display');
const cartCount = document.getElementById('cart-count');
const cartDetailLayer = document.getElementById('cart-detail-layer');
const cartListContainer = document.getElementById('cart-list-container');
const modalLayer = document.getElementById('modal-layer');
const modalBox = document.getElementById('modal-box');

let cart = [];
let currentMenu = "";
let currentOptions = { temp: "ICE", ice: "보통", shot: 1 };
let selectedMission = null;
let extraMission = null;
let isSuddenPhase = false; 
let timeLeft = 60;
let timerInterval = null;

// --- [1] 레이어 및 초기화 ---
function showLayer(name) {
    Object.values(layers).forEach(l => { 
        l.classList.remove('active'); 
        l.style.display = 'none'; 
    });
    layers[name].classList.add('active'); 
    layers[name].style.display = 'flex';
    if (name === 'kiosk') startTimer();
}

document.getElementById('start-btn').onclick = () => {
    video.play().catch(() => {});
    document.getElementById('start-btn').style.display = 'none';
};

video.onended = () => {
    showLayer('chat');
    renderDialogue('start');
};

// --- [2] 분기형 대화 시스템 ---
const dialogueData = {
    "start": {
        text: "아 춥다~ 오늘 날씨 장난 아니다! 너는 오늘 뭐 마실거야?",
        choices: [
            { text: "난 한국스타일로.. 역시 '얼죽아'지!", next: "mission_iced" },
            { text: "헐~ 난 너무 추워서 따뜻한 게 좋아.", next: "mission_warm" }
        ]
    },
    "mission_iced": {
        text: "너 한국인 다 되었네! 그럼 난 아이스 아메리카노. 샷 하나 추가해주고(총 2샷), 얼음은 조금만 넣어줘!",
        choices: [{ text: "오케이! 금방 주문해올게.", next: "go_kiosk", action: () => { selectedMission = { name: "아메리카노", temp: "ICE", ice: "적게", shot: 2 }; } }]
    },
    "mission_warm": {
        text: "그치? 난 따뜻한 카페라떼 마실래. 기본으로 부탁해!",
        choices: [{ text: "알겠어! 따뜻한 라떼 주문해올게.", next: "go_kiosk", action: () => { selectedMission = { name: "카페라떼", temp: "HOT", ice: "", shot: 1 }; } }]
    },
    "sudden_start": {
        text: "잠깐만! 결제하려구? 아 맞다, 나 갑자기 배가 좀 고픈 것 같아... 😅",
        choices: [{ text: "응? 왜? 뭐 더 먹고 싶어?", next: "sudden_request" }]
    },
    "sudden_request": {
        text: "여기 초코쿠키가 그렇게 맛있다더라! 커피랑 같이 먹게 쿠키 하나만 더 추가해줄 수 있어? 🍪",
        choices: [{ text: "당연하지! 쿠키 하나 더 담아올게.", next: "go_kiosk_again", action: () => { extraMission = { name: "초코쿠키" }; } }]
    }
};

function addMessage(side, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${side}`;
    if (side === 'left') {
        msgDiv.innerHTML = `<div class="friend-profile">👩</div><div class="bubble">${text}</div>`;
    } else {
        msgDiv.innerHTML = `<div class="bubble">${text}</div>`;
    }
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function renderDialogue(key) {
    if (key === 'go_kiosk' || key === 'go_kiosk_again') {
        setTimeout(() => showLayer('kiosk'), 800);
        return;
    }
    const node = dialogueData[key];
    setTimeout(() => addMessage('left', node.text), 500);
    choiceArea.innerHTML = "";
    node.choices.forEach(c => {
        const btn = document.createElement('button');
        btn.className = "choice-btn"; 
        btn.innerText = c.text;
        btn.onclick = () => {
            addMessage('right', c.text);
            choiceArea.innerHTML = "";
            if (c.action) c.action();
            renderDialogue(c.next);
        };
        choiceArea.appendChild(btn);
    });
}

// --- [3] 타이머 및 결제 로직 ---
function startTimer() {
    if (timerInterval) return; 
    timerInterval = setInterval(() => {
        timeLeft--; 
        timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) { clearInterval(timerInterval); gameOver(); }
    }, 1000);
}

function handlePaymentClick() {
    if (cart.length === 0) return;
    if (!isSuddenPhase) {
        isSuddenPhase = true;
        clearInterval(timerInterval); timerInterval = null;
        showLayer('chat');
        renderDialogue('sudden_start');
    } else {
        finalCheck();
    }
}

function finalCheck() {
    const friendOrder = cart.find(i => 
        i.name === selectedMission.name && 
        i.temp === selectedMission.temp && 
        i.shot === selectedMission.shot &&
        (selectedMission.temp === 'HOT' ? true : i.ice === selectedMission.ice)
    );
    const hasExtra = extraMission ? cart.find(i => i.name === extraMission.name) : true;
    const isSuccess = friendOrder && hasExtra && cart.length >= (extraMission ? 3 : 2);

    modalLayer.style.display = "flex";
    if (isSuccess) {
        clearInterval(timerInterval);
        modalBox.innerHTML = `<h2>🎉 주문 성공!</h2><p style="margin:15px 0;">정확하게 주문했어요! 민지가 정말 기뻐하네요.</p><button onclick="location.reload()" class="btn-primary">처음부터 다시 하기</button>`;
    } else {
        document.getElementById('layer-kiosk').classList.add('shake-ani');
        setTimeout(() => document.getElementById('layer-kiosk').classList.remove('shake-ani'), 500);
        modalBox.innerHTML = `<h2>🤔 주문이 틀렸어요!</h2><div class="fail-hint">민지의 주문: <strong>${selectedMission.name} (${selectedMission.temp})</strong>${extraMission ? ' + <strong>' + extraMission.name + '</strong>' : ''}<br>옵션을 다시 확인하고 본인 음료도 꼭 담아주세요!</div><button onclick="retry()" class="btn-primary">수정하러 가기</button>`;
    }
}

function retry() { modalLayer.style.display = 'none'; openCart(); }
function gameOver() { modalLayer.style.display = "flex"; modalBox.innerHTML = `<h2>😫 시간 초과!</h2><button onclick="location.reload()" class="btn-primary">다시 시작</button>`; }

// --- [4] 키오스크 및 옵션 제어 (HOT/ICE 로직 포함) ---
function switchTab(e, cat) {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.menu-grid').forEach(g => g.classList.remove('active'));
    e.currentTarget.classList.add('active'); 
    document.getElementById(cat + '-menu').classList.add('active');
}

function openOptions(menu) {
    currentMenu = menu; 
    document.getElementById('opt-menu-name').innerText = menu;
    const isCoffee = ["아메리카노", "카페라떼", "바닐라 라떼"].includes(menu);
    const isDessert = ["초코쿠키", "소금빵"].includes(menu);
    
    // 레이아웃 초기화
    document.getElementById('temp-row').style.display = isDessert ? 'none' : 'block';
    document.getElementById('shot-row').style.display = isCoffee ? 'block' : 'none';
    
    document.getElementById('option-sheet').style.display = "flex";
    setTimeout(() => document.getElementById('option-sheet').classList.add('active'), 10);
    
    // 초기 기본값 설정
    currentOptions = { 
        temp: isDessert ? "" : "ICE", 
        ice: isDessert ? "" : "보통", 
        shot: isCoffee ? 1 : 0 
    };
    updateOptionUI();
}

function updateOptionUI() {
    const isDessert = ["초코쿠키", "소금빵"].includes(currentMenu);
    
    // 샷 수치 업데이트
    document.getElementById('shot-val').innerText = currentOptions.shot;
    
    // 버튼 선택 상태 업데이트
    document.querySelectorAll('.tgl-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.value === currentOptions[btn.dataset.type]);
    });

    // [핵심 로직] HOT을 선택했거나 디저트인 경우 얼음량(ice-row) 숨기기
    const iceRow = document.getElementById('ice-row');
    if (currentOptions.temp === 'HOT' || isDessert) {
        iceRow.style.display = 'none';
    } else {
        iceRow.style.display = 'block';
    }
}

document.querySelectorAll('.tgl-btn').forEach(btn => {
    btn.onclick = function() {
        const type = this.dataset.type;
        const val = this.dataset.value;
        
        currentOptions[type] = val;
        
        // 온도를 HOT으로 바꾸면 얼음량 데이터를 비움
        if (type === 'temp') {
            if (val === 'HOT') {
                currentOptions.ice = "";
            } else {
                currentOptions.ice = "보통"; // ICE로 바꾸면 다시 '보통'으로 초기화
            }
        }
        updateOptionUI();
    };
});

function changeShot(n) { 
    currentOptions.shot = Math.max(0, Math.min(5, currentOptions.shot + n)); 
    updateOptionUI(); 
}

// --- [5] 장바구니 및 기타 함수 ---
function addToCart() { 
    cart.push({ name: currentMenu, ...currentOptions }); 
    cartCount.innerText = cart.length; 
    closeSheet(); 
}

function closeSheet() { 
    document.getElementById('option-sheet').classList.remove('active'); 
    setTimeout(() => document.getElementById('option-sheet').style.display = 'none', 300); 
}

function closeSheetOutside(e) { if(e.target.id === 'option-sheet') closeSheet(); }

function openCart() {
    cartListContainer.innerHTML = cart.length === 0 ? "<p style='padding:40px; color:#bbb; text-align:center;'>장바구니가 비어 있습니다.</p>" : "";
    cart.forEach((i, idx) => {
        const div = document.createElement('div'); 
        div.className = 'cart-item';
        div.innerHTML = `<div class="c-info"><span class="c-name">${i.name}</span><span class="c-opt">${i.temp} ${i.ice} ${i.shot ? i.shot+'샷' : ''}</span></div><button class="btn-del" onclick="removeFromCart(${idx})">✕</button>`;
        cartListContainer.appendChild(div);
    });
    cartDetailLayer.style.display = 'flex';
}

function removeFromCart(idx) { 
    cart.splice(idx, 1); 
    cartCount.innerText = cart.length; 
    openCart(); 
}

function closeCart() { cartDetailLayer.style.display = 'none'; }