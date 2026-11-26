// ===== 全域變數 =====
let bgImg;              // 背景圖檔（雪地）
let walkImg;            // 角色1走路用的精靈圖檔（6張合成）
let hitImg;             // 角色1被擊中/跑步用的精靈圖檔（5張合成）
let jumpImg;            // 角色1跳躍用的精靈圖檔（4張合成）
let eatImg;             // 角色1吃東西用的精靈圖檔（3張合成）
let burgerImg;          // 角色2（漢堡）的圖檔

let walkFrames = 6;     // 走路精靈圖的總張數
let hitFrames = 5;      // hit 精靈圖的總張數
let jumpFrames = 4;     // jump 精靈圖的總張數（圖寬183/4，單張約45.75）
let eatFrames = 3;      // eat 精靈圖的總張數（圖寬94/3，單張約31.33）

let walkFrameW = 241 / 6; // 走路精靈圖單張的寬度（圖寬 241 除以 6 張）
let walkFrameH = 36;    // 走路精靈圖單張的高度
let hitFrameW = 180 / 5;  // hit 精靈圖單張的寬度（180 除以 5 張）
let hitFrameH = 38;     // hit 精靈圖單張的高度
let jumpFrameW = 183 / 4; // jump 精靈圖單張的寬度（183 除以 4 張）
let jumpFrameH = 42;    // jump 精靈圖單張的高度
let eatFrameW = 94 / 3; // eat 精靈圖單張的寬度（94 除以 3 張）
let eatFrameH = 38;     // eat 精靈圖單張的高度

let currentIndex = 0;   // 角色1目前播放到第幾張（從 0 開始）
let animationTimer = 0; // 角色1動畫計時器，用來控制換圖速度
let frameDuration = 8;  // 每張圖持續幾個畫面更新（越小越快）
let facingLeft = false; // 角色1是否面向左邊
let x;                  // 角色1在畫面上的水平位置
let y;                  // 角色1在畫面上的垂直位置
let moveSpeed = 4;      // 角色1移動的速度
let spriteScale = 4;    // 角色1放大倍率，讓角色比較容易看清楚

let isJumping = false;  // 角色1是否正在跳躍中
let spaceHandled = false; // 空白鍵是否已被處理（避免長按重複觸發）

let itemX;              // 角色2（漢堡）的水平位置
let itemY;              // 角色2（漢堡）的垂直位置
let itemW = 90;         // 角色2顯示的寬度（漢堡原圖42x45，放大約2倍多）
let itemH = 96;         // 角色2顯示的高度
let itemSpeed = 5;      // 角色2移動的速度

let isEating = false;   // 角色1是否正在吃東西（碰撞時觸發）
let eatSoundPlayed = false; // 吃東西音效是否已播放（避免重複觸發）
let bgOffset = 0;       // 背景捲軸偏移量
let fxImg;              // 特效圖檔（5000分數特效）
let fxSound;            // 特效音效（DS Battle Music）
let fxTimer = -1;       // 特效播放進度（-1 = 未播放，0～1 秒內遞增）
const FX_DURATION = 60; // 特效播放時間（60 幀 = 1 秒）
let fxPassed = false;   // 角色1是否已經走過觸發點（避免重複觸發）

// ===== p5.js 初始化函式，程式啟動時執行一次 =====
function setup() {
  // 產生全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 載入草地藍天背景圖
  bgImg = loadImage('草地藍天.png');
  // 背景捲軸偏移量（角色不動，用背景移動來表現移動）
  bgOffset = 0;
  // 載入走路精靈圖檔（路徑相對於 sketch.js 所在資料夾）
  walkImg = loadImage('walk/walk ALL.png');
  // 載入 hit 精靈圖檔
  hitImg = loadImage('hit/hit ALL.png');
  // 載入 jump 精靈圖檔
  jumpImg = loadImage('jump/jump ALL.png');
  // 載入 eat 精靈圖檔
  eatImg = loadImage('eat/eat ALL.png');
  // 載入漢堡圖檔
  burgerImg = loadImage('漢堡.png');
  // 載入 5000 分數特效圖
  fxImg = loadImage('5000.png');
  // 設定角色1初始位置：水平中央偏左，垂直站在底部草地上
  x = width / 2 - 100;
  y = height - 120;
  // 角色2初始位置在角色1右邊 200 像素，同樣站在草地上
  itemX = width / 2 + 100;
  itemY = height - 90;
  // 圖片對齊方式改為中心點，方便置中與翻轉
  imageMode(CENTER);
}

// ===== 使用者第一次互動時才啟動音效系統（避開瀏覽器自動播放政策）=====
let audioCtx = null;      // Web Audio 音效環境
let soundLoaded = false;  // 音效系統是否已初始化

// 在第一次鍵盤或滑鼠事件時初始化音效（此時 AudioContext 才允許啟動）
function initSoundOnce() {
  if (soundLoaded) return; // 只初始化一次
  soundLoaded = true;
  try {
    // 建立 AudioContext（此時使用者已互動，瀏覽器允許啟動）
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    console.log('音效系統已啟動');
  } catch (e) {
    console.warn('音效初始化失敗：', e);
  }
}

// ===== 合成播放「吃東西」音效，長度約 3 秒 =====
// 低頻咀嚼聲（短促低音循環）+ 滿足感的下滑音，用 OscillatorNode 合成
function playEatSound() {
  if (!audioCtx) return; // 音效系統尚未啟動就不播
  try {
    let t0 = audioCtx.currentTime;
    let master = audioCtx.createGain();
    master.gain.value = 0.3;
    master.connect(audioCtx.destination);

    // 咀嚼聲：模擬 6 口（每 0.3 秒一口），低頻短促的「喀嚓」聲
    for (let i = 0; i < 6; i++) {
      let osc = audioCtx.createOscillator();
      let gain = audioCtx.createGain();
      osc.type = 'sawtooth'; // 鋸齒波：有咀嚼的粗糙質感
      // 每口頻率略微不同（80~120Hz 隨機）更自然
      osc.frequency.value = 80 + Math.random() * 40;
      let start = t0 + i * 0.3;
      // 短促包絡：快速下降模擬咬下去的口感
      gain.gain.setValueAtTime(0.4, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
      // 頻率往下滑，模擬咀嚼的悶響
      osc.frequency.exponentialRampToValueAtTime(40, start + 0.15);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + 0.2);
    }

    // 滿足感的「Yum~」上揚音：第 2 秒起的兩個上行音
    let yum = [659.25, 880]; // E5 → A5
    for (let i = 0; i < yum.length; i++) {
      let osc = audioCtx.createOscillator();
      let gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = yum[i];
      let start = t0 + 1.8 + i * 0.25;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.35, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.7);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + 0.8);
    }
  } catch (e) {
    console.warn('吃東西音效播放失敗：', e);
  }
}

// ===== 合成播放「獲得 5000 獎勵」音效，長度約 3 秒 =====
// 上行琶音 + 勝利小音型，用 OscillatorNode 合成，不需要任何外部檔案
function playRewardSound() {
  if (!audioCtx) return; // 音效系統尚未啟動就不播
  try {
    // 取得現在時間當作起點
    let t0 = audioCtx.currentTime;
    // 總輸出音量節點（避免爆音）
    let master = audioCtx.createGain();
    master.gain.value = 0.35;
    master.connect(audioCtx.destination);

    // 上行琶音：C5 E5 G5 C6 E6 G6（每個間隔 0.12 秒，共 6 個音）
    let notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    for (let i = 0; i < notes.length; i++) {
      let osc = audioCtx.createOscillator();
      let gain = audioCtx.createGain();
      osc.type = 'triangle'; // 三角波：清脆又不刺耳
      osc.frequency.value = notes[i];
      // 音量包絡：淡入極短、淡出柔和
      let start = t0 + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.5, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + 0.4);
    }

    // 勝利音型：第 2 秒起的高音和弦（C6 + E6 + G6）持續 1.5 秒
    let chord = [1046.5, 1318.5, 1567.98];
    for (let i = 0; i < chord.length; i++) {
      let osc = audioCtx.createOscillator();
      let gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = chord[i];
      let start = t0 + 1.0;
      // 和弦音量包絡：慢淡入、慢淡出
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.8);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + 2.0);
    }
  } catch (e) {
    console.warn('音效播放失敗：', e);
  }
}

// 鍵盤按下時觸發音效初始化
function keyPressed() {
  initSoundOnce();
}

// 滑鼠按下時也觸發音效初始化
function mousePressed() {
  initSoundOnce();
}

// ===== p5.js 主迴圈，每秒約執行 60 次 =====
function draw() {
  // 用 try-catch 包住整個繪製流程，避免任何一處例外導致畫面永久空白
  try {
    updateAndDraw();
  } catch (e) {
    // 只在 Console 印一次錯誤訊息（每幀都印會洗版）
    if (!window.__drawErrorShown) {
      console.error('draw 發生錯誤：', e);
      window.__drawErrorShown = true;
    }
  }
}

// 實際的更新與繪製邏輯
function updateAndDraw() {
  // ===== 繪製背景：左右各畫一張相同大小的背景，依 bgOffset 偏移，形成捲動效果 =====
  let bgW = windowWidth;  // 背景顯示寬度（一張背景的寬）
  let bgH = windowHeight; // 背景顯示高度
  // 讓偏移量循環在一張背景寬度內，永遠不會超出
  let ox = bgOffset % bgW;
  if (ox < 0) ox += bgW;  // 處理負偏移
  // 畫左邊那張（右緣對齊 ox）
  image(bgImg, ox - bgW / 2, height / 2, bgW, bgH);
  // 畫右邊那張（左緣對齊 ox）
  image(bgImg, ox + bgW / 2, height / 2, bgW, bgH);

  // ===== 角色2（漢堡）：判斷滑鼠按鍵 =====
  if (mouseIsPressed) {
    if (mouseButton === LEFT) {
      // 按滑鼠左鍵：漢堡往左移動
      itemX -= itemSpeed;
    } else if (mouseButton === RIGHT) {
      // 按滑鼠右鍵：漢堡往右移動
      itemX += itemSpeed;
    }
  }

  // ===== 漢堡範圍限制：不讓漢堡跑到畫面外 =====
  // 左邊界：畫面左緣再留半個漢堡寬
  if (itemX < itemW / 2) itemX = itemW / 2;
  // 右邊界：畫面右緣再留半個漢堡寬
  if (itemX > windowWidth - itemW / 2) itemX = windowWidth - itemW / 2;

  // ===== 角色1：判斷碰撞（矩形範圍重疊就吃東西）=====
  // 角色1的碰撞範圍：以中心點往外算半寬半高
  let p1Left = x - walkFrameW * spriteScale / 2;
  let p1Right = x + walkFrameW * spriteScale / 2;
  let p1Top = y - walkFrameH * spriteScale / 2;
  let p1Bottom = y + walkFrameH * spriteScale / 2;
  // 角色2的碰撞範圍
  let dLeft = itemX - itemW / 2;
  let dRight = itemX + itemW / 2;
  let dTop = itemY - itemH / 2;
  let dBottom = itemY + itemH / 2;
  // 兩個矩形有重疊就代表碰在一起
  let touching = p1Right > dLeft && p1Left < dRight && p1Bottom > dTop && p1Top < dBottom;
  // 碰在一起時角色1進入吃東西狀態
  isEating = touching;
  // 從「沒碰到」變成「碰到」的瞬間，播放吃東西音效（每次碰撞只播一次）
  if (touching && !eatSoundPlayed) {
    eatSoundPlayed = true;
    playEatSound();
  }
  // 離開碰撞後重置旗標，下次再碰會再播
  if (!touching) {
    eatSoundPlayed = false;
  }

  // ===== 角色1：判斷鍵盤輸入與狀態（角色不動，改為移動背景）=====
  if (keyIsDown(LEFT_ARROW) && !isJumping) {
    // 設定角色面向左邊
    facingLeft = true;
    // 角色不動，背景往右移動（看起來像角色往左走）
    bgOffset += moveSpeed;
    // 使用 hit 動畫（共 5 張）
    animate(hitFrames);
  } else if (keyIsDown(RIGHT_ARROW) && !isJumping) {
    // 按右鍵：角色面向右邊
    facingLeft = false;
    // 角色不動，背景往左移動（看起來像角色往右走）
    bgOffset -= moveSpeed;
    // 使用走路動畫（共 6 張）
    animate(walkFrames);
  } else if (!isJumping) {
    // 沒按任何方向鍵：角色站著不動（只顯示第 1 張）
    currentIndex = 0;
  }

  // ===== 特效觸發點：離最右邊視窗 1/4 寬處 =====
  // 背景座標 = 視窗座標 + 背景偏移，觸發點在背景的 (視窗寬 - 視窗寬/4) 位置
  let triggerBgX = windowWidth - windowWidth / 4; // 背景上的 3/4 處
  // 觸發點目前的畫面座標（跟著背景捲動）
  let triggerScreenX = triggerBgX + bgOffset;
  // 超出畫面後重新進入畫面時也算（背景會循環，取相對位置）
  let relX = ((triggerScreenX % windowWidth) + windowWidth) % windowWidth; // 對齊到 0~視窗寬
  // 判斷角色1是否碰到位於 relX 的觸發線
  let catLeft = x - walkFrameW * spriteScale / 2;
  let catRight = x + walkFrameW * spriteScale / 2;
  let hitTrigger = catRight > relX && catLeft < relX;
  // 走到觸發線上且還沒播放過 → 播放特效
  if (hitTrigger && !fxPassed) {
    fxTimer = 0;      // 開始播放特效
    fxPassed = true;  // 標記已觸發，避免重複
    // 播放合成的 5000 獎勵音效（不需要載入任何檔案）
    playRewardSound();
  }
  // 離開觸發線後重置旗標，下次再走過會再播一次
  if (!hitTrigger) {
    fxPassed = false;
  }

  // ===== 角色1：跳躍處理 =====
  if (isJumping) {
    // 跳躍中播放 jump 動畫（共 4 張），跳完整輪後結束跳躍
    animationTimer++;
    if (animationTimer >= frameDuration) {
      animationTimer = 0; // 歸零計時器
      currentIndex = (currentIndex + 1) % jumpFrames; // 循環播放 jump 的 4 張
      // 播完一輪（回到第 0 張）就結束跳躍
      if (currentIndex === 0) {
        isJumping = false;
      }
    }
  } else if (keyIsPressed && keyCode === 32 && !spaceHandled) {
    // 按下空白鍵（keyCode 32）就開始跳躍
    isJumping = true;
    currentIndex = 0; // 從第 1 張開始播
    animationTimer = 0;
    spaceHandled = true; // 標記已處理，避免長按重複觸發
  }
  // 放開空白鍵後重置旗標，允許下次再跳
  if (!keyIsPressed) {
    spaceHandled = false;
  }

  // ===== 角色1：繪製 =====
  if (isJumping) {
    // ===== 跳躍：使用 jump 精靈圖 =====
    drawSprite(jumpImg, jumpFrameW, jumpFrameH, facingLeft);
  } else if (isEating) {
    // ===== 吃東西：使用 eat 精靈圖 =====
    animate(eatFrames); // 循環播放 eat 的 3 張
    drawSprite(eatImg, eatFrameW, eatFrameH, facingLeft);
  } else if (facingLeft) {
    // ===== 往左跑：使用 hit 精靈圖 =====
    drawSprite(hitImg, hitFrameW, hitFrameH, facingLeft);
  } else {
    // ===== 站立/往右跑：使用走路精靈圖 =====
    drawSprite(walkImg, walkFrameW, walkFrameH, facingLeft);
  }

  // ===== 角色2（漢堡）：繪製 =====
  // 畫出漢堡（原圖已是方正尺寸，直接以中心對齊畫出）
  image(burgerImg, itemX, itemY, itemW, itemH);

  // ===== 5000 特效：由視窗最上往下播放，總長 1 秒 =====
  if (fxTimer >= 0 && fxTimer <= FX_DURATION) {
    // 進度 0~1
    let t = fxTimer / FX_DURATION;
    // 特效畫面寬度（原圖 275x678，等比放大到畫面高度約 1/3）
    let fxW = windowHeight / 3 * (275 / 678);
    let fxH = windowHeight / 3;
    // 特效中心從視窗最上方面（往上1/3）滑入到畫面上方 1/3 處
    let fxY = -fxH / 2 + t * (windowHeight * 2 / 3);
    // 畫出特效（在所有東西之上）
    image(fxImg, relX, fxY, fxW, fxH);
    // 計時器遞增
    fxTimer++;
  } else {
    // 播放結束
    fxTimer = -1;
  }
}

// ===== 畫角色1的共用函式：畫出指定精靈圖的當前單格 =====
function drawSprite(img, frameW, frameH, flip) {
  push(); // 儲存目前的畫布狀態
  translate(x, y); // 把座標原點移到角色位置
  if (flip) {
    scale(-spriteScale, spriteScale); // 水平翻轉並放大
  } else {
    scale(spriteScale, spriteScale); // 放大角色
  }
  // 計算目前的單格起點座標
  let sx = currentIndex * frameW;
  // 從精靈圖上裁切單格並畫在畫布上（以中心點對齊）
  image(img, 0, 0, frameW, frameH, sx, 0, frameW, frameH);
  pop(); // 還原畫布狀態
}

// ===== 動畫播放函式：傳入總張數，循環推進 currentIndex =====
function animate(totalFrames) {
  // 更新動畫計時器
  animationTimer++;
  // 計時器到達設定值時就換下一張圖
  if (animationTimer >= frameDuration) {
    animationTimer = 0; // 歸零計時器
    currentIndex = (currentIndex + 1) % totalFrames; // 循環播放
  }
}

// ===== 視窗大小改變時，重新設定畫布為全螢幕 =====
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 讓角色保持在草地高度（跟著新視窗大小重新計算）
  y = height - 120;
  itemY = height - 90;
}
