// ==========================================
// 拖曳題測驗系統 (幼兒奶龍語音響應式版) - sketch.js
// 主題：模型製作基本技法
// ==========================================

// --- 全域變數宣告 ---
let quizData = [];         // 儲存所有題目資訊（目標區與拖曳選項）
let dropZones = [];        // 上方固定圖示（放置區）物件陣列
let dragItems = [];        // 下方可拖曳文字選項物件陣列
let draggedItem = null;    // 當前正在被拖曳的物件
let submitButton = null;   // 「交卷看成績」按鈕 DOM 元素
let isSubmitted = false;   // 是否已經交卷狀態
let score = 0;             // 測驗得分
let confettiList = [];     // 彩帶特效粒子陣列
let showConfetti = false;  // 是否播放彩帶特效

// --- p5.js 初始化設定 ---
function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 文字對齊方式設定為水平與垂直置中
  textAlign(CENTER, CENTER);

  // 初始化題目與資料
  initQuizData();
  
  // 建立畫面上方的放置目標區與下方的可拖曳選項
  createQuizElements();

  // 建立居中的交卷 UI 按鈕
  createUI();
}

// --- 初始化題目資料定義 (適合幼兒閱讀的簡短句子與奶龍語音) ---
function initQuizData() {
  quizData = [
    { 
      id: 1, 
      title: '打磨技法', 
      type: 'SANDING', 
      desc: '用砂紙把模型表面磨平平', 
      speech: '打磨技法！拿砂紙搓一搓，把粗粗的地方磨平亮晶晶！' 
    },
    { 
      id: 2, 
      title: '無縫填縫', 
      type: 'PUTTY', 
      desc: '補平小縫隙與凹下去的地方', 
      speech: '無縫填縫！像抹奶油一樣把凹下去的小縫隙補起來！' 
    },
    { 
      id: 3, 
      title: '假組組裝', 
      type: 'ASSEMBLY', 
      desc: '先組合看看外型長怎樣', 
      speech: '假組組裝！先合體看看，檢查零件有沒有裝對地方！' 
    },
    { 
      id: 4, 
      title: '噴漆上色', 
      type: 'PAINTING', 
      desc: '用噴筆噴上漂亮的顏料衣服', 
      speech: '噴漆上色！呼叫噴槍，幫模型穿上帥氣又漂亮的新衣服！' 
    },
    { 
      id: 5, 
      title: '膠水黏合', 
      type: 'GLUING', 
      desc: '點上模型膠水把零件黏緊緊', 
      speech: '膠水黏合！點一點神奇膠水，把零件緊緊抱在一起！' 
    },
    { 
      id: 6, 
      title: '湯口切割', 
      type: 'CUTTING', 
      desc: '用剪刀把零件從框框剪下來', 
      speech: '湯口切割！拿斜口剪咔嚓一聲，把零件從框架上剪下來！' 
    }
  ];
}

// --- 建立畫布上的元素位置 (全螢幕響應式佈局) ---
function createQuizElements() {
  dropZones = [];
  dragItems = [];

  // 計算響應式佈局欄數 (依據螢幕寬度自動排列 6 欄、3 欄或 2 欄)
  let margin = 15;
  let cols = windowWidth > 850 ? 6 : (windowWidth > 550 ? 3 : 2);
  let rows = ceil(6 / cols);
  
  // 計算每一個目標卡片的尺寸，確保大螢幕與手機都能完美滿版
  let containerWidth = min(width - 20, 1300);
  let zoneWidth = (containerWidth - (cols + 1) * margin) / cols;
  let zoneHeight = max(145, zoneWidth * 0.9); // 加大高度，確保標題、圖像、吸附框三者完全分離不重疊
  let startX = (width - (cols * zoneWidth + (cols - 1) * margin)) / 2;
  let startY = 70; // 頂部預留標題高度

  // 1. 建立上方 6 個固定的目標放置區（GIF動態圖示區）
  for (let i = 0; i < quizData.length; i++) {
    let col = i % cols;
    let row = floor(i / cols);
    let x = startX + col * (zoneWidth + margin) + zoneWidth / 2;
    let y = startY + row * (zoneHeight + margin) + zoneHeight / 2;

    dropZones.push({
      id: quizData[i].id,
      title: quizData[i].title,
      type: quizData[i].type,
      speech: quizData[i].speech,
      x: x,
      y: y,
      w: zoneWidth,
      h: zoneHeight,
      bounceScale: 1.0, // 點擊時的彈跳縮放系數
      occupant: null    // 記錄當前停留在該區域的拖曳文字項目
    });
  }

  // 打亂下方文字選項的初始順序 (洗牌演算法)
  let shuffledData = shuffle([...quizData]);

  // 計算下方拖曳項目的起始區域 Y 軸位置
  let dragStartY = startY + rows * (zoneHeight + margin) + 20;
  let dragItemWidth = min(zoneWidth * 1.05, 210);
  let dragItemHeight = 55; // 增加卡片高度適合幼兒手部觸控

  // 2. 建立下方 6 個可拖曳的文字選項
  for (let i = 0; i < shuffledData.length; i++) {
    let col = i % cols;
    let row = floor(i / cols);
    let x = startX + col * (zoneWidth + margin) + zoneWidth / 2;
    let y = dragStartY + row * (dragItemHeight + 12) + dragItemHeight / 2;

    dragItems.push({
      id: shuffledData[i].id,
      text: shuffledData[i].desc,
      x: x,
      y: y,
      homeX: x,        // 記錄原始 X 位置，方便未對準時彈回
      homeY: y,        // 記錄原始 Y 位置，方便未對準時彈回
      w: dragItemWidth,
      h: dragItemHeight,
      isDragging: false,
      targetZone: null  // 記錄當前吸附的放置區
    });
  }
}

// --- 建立 DOM UI 按鈕 (完美的水平垂直居中佈局) ---
function createUI() {
  // 如果已存在按鈕則移除重新創建
  if (submitButton) submitButton.remove();

  // 建立「交卷看成績」按鈕
  submitButton = createButton('✨ 點我交卷看成績 ✨');
  
  // 使用 CSS 定位將按鈕絕對水平居中置於畫面下方
  submitButton.style('position', 'absolute');
  submitButton.style('bottom', '25px');
  submitButton.style('left', '50%');
  submitButton.style('transform', 'translateX(-50%)');
  
  // 可愛幼兒風格按鈕外觀
  submitButton.style('padding', '16px 45px');
  submitButton.style('font-size', '24px');
  submitButton.style('font-weight', 'bold');
  submitButton.style('background-color', '#ff7675');
  submitButton.style('color', '#ffffff');
  submitButton.style('border', '4px solid #ffffff');
  submitButton.style('border-radius', '35px');
  submitButton.style('cursor', 'pointer');
  submitButton.style('box-shadow', '0 8px 20px rgba(0,0,0,0.35)');
  submitButton.style('display', 'none'); // 初期隱藏，全數完成後顯示

  // 綁定點擊事件執行交卷判定
  submitButton.mousePressed(handleSubmit);
}

// --- 奶龍語音發聲控制函式 (Web Speech API) ---
function speakNailong(text) {
  if (!('speechSynthesis' in window)) return;

  // 停止當前正在播放的語音
  window.speechSynthesis.cancel();

  let utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-TW';
  // 設定高音調與適中語速，模擬可愛奶龍音
  utterance.pitch = 1.55;  // 提高音調 (0-2)
  utterance.rate = 0.88;   // 稍微放慢語速，方便幼兒聆聽 (0.1-10)

  // 搜尋廣東話/華語語音庫
  let voices = window.speechSynthesis.getVoices();
  let twVoice = voices.find(v => v.lang.includes('zh-TW') || v.lang.includes('zh'));
  if (twVoice) utterance.voice = twVoice;

  window.speechSynthesis.speak(utterance);
}

// --- p5.js 主重複繪製函式 ---
function draw() {
  // 背景刷活潑適中的深藍夜空色
  background(24, 32, 54);

  // 繪製頂部標題區
  drawHeader();

  // 繪製上方 6 個圖示放置區
  drawDropZones();

  // 繪製下方 6 個可拖曳文字選項
  drawDragItems();

  // 檢查是否所有項目皆已放置，決定按鈕顯示與否
  checkAllPlaced();

  // 繪製交卷後的成績結算畫面
  if (isSubmitted) {
    drawScoreBoard();
  }

  // 繪製與更新彩帶特效粒子 (高分觸發)
  if (showConfetti) {
    updateAndDrawConfetti();
  }
}

// --- 繪製頂部標題 ---
function drawHeader() {
  push();
  fill(255, 234, 167);
  textSize(min(28, width * 0.055));
  textStyle(BOLD);
  text('🧩 模型製作基本技法 - 點點聽語音配對 🧩', width / 2, 35);
  pop();
}

// --- 繪製上方放置區 (標題、圖示、拖曳目標完全分離不重疊) ---
function drawDropZones() {
  for (let zone of dropZones) {
    push();
    rectMode(CENTER);

    // 平滑恢復卡片的彈跳縮放效果
    zone.bounceScale = lerp(zone.bounceScale, 1.0, 0.1);

    translate(zone.x, zone.y);
    scale(zone.bounceScale);

    // 繪製卡片外框背景
    stroke(255, 255, 255, 120);
    strokeWeight(2.5);
    fill(40, 53, 80);
    rect(0, 0, zone.w, zone.h, 18);

    // 1. 頂部技法名稱 (大字體鮮黃色，頂部獨立置中)
    noStroke();
    fill(255, 211, 42);
    textSize(min(19, zone.w * 0.13));
    textStyle(BOLD);
    text('🔊 ' + zone.title, 0, -zone.h / 2 + 22);

    // 2. 中間圖示區域 (GIF動畫繪製區)
    let iconY = -5;
    drawDynamicGifIcon(zone.type, 0, iconY, zone.w * 0.35);

    // 3. 底部吸附框（提示區域，完全置底獨立）
    noFill();
    stroke(255, 255, 255, 70);
    strokeWeight(2);
    rect(0, zone.h / 2 - 28, zone.w * 0.92, 42, 10);

    // 交卷後的正確與錯誤標記
    if (isSubmitted && zone.occupant) {
      if (zone.occupant.id === zone.id) {
        fill(46, 204, 113);
        textSize(18);
        textStyle(BOLD);
        text('✓ 答對了！', 0, zone.h / 2 - 28);
      } else {
        fill(255, 118, 117);
        textSize(18);
        textStyle(BOLD);
        text('✗ 再想想看', 0, zone.h / 2 - 28);
      }
    }
    pop();
  }
}

// --- 模擬 GIF 動畫繪製函式 ---
function drawDynamicGifIcon(type, x, y, size) {
  push();
  translate(x, y);

  let t = frameCount * 0.08;

  switch (type) {
    case 'SANDING': // 打磨：砂紙左右擺動
      let sandOffset = sin(t * 2) * 12;
      fill(211, 166, 112);
      rectMode(CENTER);
      rect(sandOffset, -5, size * 0.9, size * 0.4, 4); // 砂紙
      fill(120);
      rect(0, 10, size * 1.1, 8);                      // 模型零件
      fill(255, 220);
      noStroke();
      ellipse(sandOffset + random(-5, 5), random(-10, 5), 4, 4); // 打磨粉塵
      break;

    case 'PUTTY': // 補土：括刀抹平動畫
      let puttyY = cos(t * 1.5) * 6;
      fill(120);
      rectMode(CENTER);
      rect(0, 8, size * 1.1, 8);                 // 模型表面
      fill(241, 196, 15);
      arc(0, 4, size * 0.7, 10, PI, TWO_PI);       // 填補補土
      stroke(236, 240, 241);
      strokeWeight(3);
      line(-8 + puttyY, -12 - puttyY, 8 + puttyY, 4 - puttyY); // 抹刀
      break;

    case 'ASSEMBLY': // 假組：兩個零件合體動畫
      let gap = abs(sin(t)) * 15;
      fill(54, 160, 244);
      rectMode(CENTER);
      rect(-gap - 8, 0, size * 0.35, size * 0.55, 4);
      fill(255, 107, 107);
      rect(gap + 8, 0, size * 0.35, size * 0.55, 4);
      break;

    case 'PAINTING': // 噴漆：噴霧發散動畫
      stroke(180);
      strokeWeight(3);
      line(-size * 0.3, -size * 0.1, -size * 0.05, 0); // 噴槍
      noStroke();
      fill(155, 89, 182, 180); // 彩色噴霧
      for (let i = 0; i < 5; i++) {
        let pX = (t * 8 + i * 7) % (size * 0.7);
        let pSize = map(pX, 0, size * 0.7, 2, 10);
        ellipse(pX, random(-pX * 0.25, pX * 0.25), pSize, pSize);
      }
      break;

    case 'GLUING': // 膠水：水滴掉落動畫
      fill(140);
      rectMode(CENTER);
      rect(0, 10, size, 8);
      let dropY = (t * 4) % (size * 0.4);
      fill(0, 210, 211, 220);
      noStroke();
      ellipse(0, -size * 0.2 + dropY, 7, 9);
      break;

    case 'CUTTING': // 切割：剪刀開合動畫
      let angle = sin(t * 2) * 0.25;
      stroke(255);
      strokeWeight(3);
      push();
      rotate(angle);
      line(0, 0, -size * 0.35, -size * 0.25);
      pop();
      push();
      rotate(-angle);
      line(0, 0, -size * 0.35, size * 0.25);
      pop();
      break;
  }
  pop();
}

// --- 繪製下方拖曳選項 ---
function drawDragItems() {
  for (let item of dragItems) {
    push();
    rectMode(CENTER);

    // 依當前狀態給予幼兒友善的高對比配色
    if (item.isDragging) {
      stroke(255, 234, 167);
      strokeWeight(4);
      fill(9, 132, 227); // 拖曳中亮藍色
    } else if (item.targetZone) {
      stroke(85, 239, 196);
      strokeWeight(2);
      fill(0, 184, 148); // 已吸附亮綠色
    } else {
      stroke(255, 255, 255, 180);
      strokeWeight(2);
      fill(108, 92, 231); // 預設亮紫色
    }

    // 當卡片在目標區時，完美契合於吸附框內
    let drawX = item.x;
    let drawY = item.y;
    let drawW = item.w;
    let drawH = item.h;

    if (item.targetZone && !item.isDragging) {
      drawX = item.targetZone.x;
      drawY = item.targetZone.y + item.targetZone.h / 2 - 28;
      drawW = item.targetZone.w * 0.9;
      drawH = 40;
    }

    // 繪製圓角卡片
    rect(drawX, drawY, drawW, drawH, 10);

    // 繪製清晰的大字體說明文字
    noStroke();
    fill(255);
    textSize(min(15, drawW * 0.085));
    textStyle(BOLD);
    text(item.text, drawX, drawY, drawW - 8, drawH - 4);
    pop();
  }
}

// --- 檢查是否全部吸附完成 ---
function checkAllPlaced() {
  if (isSubmitted) {
    if (submitButton) submitButton.style('display', 'none');
    return;
  }

  // 判斷是否 6 個項目皆已放置
  let allPlaced = dragItems.every(item => item.targetZone !== null);

  if (allPlaced) {
    submitButton.style('display', 'block');
  } else {
    submitButton.style('display', 'none');
  }
}

// --- 滑鼠/觸控 按下事件 (點擊發聲與開始拖曳) ---
function mousePressed() {
  if (isSubmitted) return;

  // 1. 檢查是否點擊了上方的圖片卡片 (觸發奶龍語音與彈跳特效)
  for (let zone of dropZones) {
    if (
      mouseX > zone.x - zone.w / 2 &&
      mouseX < zone.x + zone.w / 2 &&
      mouseY > zone.y - zone.h / 2 &&
      mouseY < zone.y + zone.h / 2
    ) {
      // 觸發放大彈跳動畫
      zone.bounceScale = 1.18;
      // 播放親切奶龍語音
      speakNailong(zone.speech);
    }
  }

  // 2. 檢查拖曳項目 (倒序優先抓取最上層)
  for (let i = dragItems.length - 1; i >= 0; i--) {
    let item = dragItems[i];
    
    let currentX = item.x;
    let currentY = item.y;
    let currentW = item.w;
    let currentH = item.h;

    if (item.targetZone) {
      currentX = item.targetZone.x;
      currentY = item.targetZone.y + item.targetZone.h / 2 - 28;
      currentW = item.targetZone.w * 0.9;
      currentH = 40;
    }

    if (
      mouseX > currentX - currentW / 2 &&
      mouseX < currentX + currentW / 2 &&
      mouseY > currentY - currentH / 2 &&
      mouseY < currentY + currentH / 2
    ) {
      draggedItem = item;
      item.isDragging = true;

      // 釋放先前綁定的目標區
      if (item.targetZone) {
        item.targetZone.occupant = null;
        item.targetZone = null;
      }
      break;
    }
  }
}

// --- 滑鼠/觸控 拖曳中事件 ---
function mouseDragged() {
  if (draggedItem) {
    draggedItem.x = mouseX;
    draggedItem.y = mouseY;
  }
}

// --- 滑鼠/觸控 放開事件 (放寬靈敏吸附判定) ---
function mouseReleased() {
  if (draggedItem) {
    draggedItem.isDragging = false;
    let snapped = false;

    for (let zone of dropZones) {
      let d = dist(draggedItem.x, draggedItem.y, zone.x, zone.y);

      // 加大判定範圍至 110 像素，方便幼兒順暢操作
      if (d < 110 && (zone.occupant === null || zone.occupant === draggedItem)) {
        draggedItem.x = zone.x;
        draggedItem.y = zone.y + zone.h / 2 - 28;
        draggedItem.targetZone = zone;
        zone.occupant = draggedItem;
        snapped = true;
        break;
      }
    }

    // 未吸附則回歸原位
    if (!snapped) {
      draggedItem.x = draggedItem.homeX;
      draggedItem.y = draggedItem.homeY;
      draggedItem.targetZone = null;
    }

    draggedItem = null;
  }
}

// --- 交卷邏輯與計算成績 ---
function handleSubmit() {
  isSubmitted = true;
  let correctCount = 0;

  for (let zone of dropZones) {
    if (zone.occupant && zone.occupant.id === zone.id) {
      correctCount++;
    }
  }

  score = floor((correctCount / quizData.length) * 100);

  // 根據成績播放奶龍專屬獎勵語音
  if (score >= 80) {
    initConfetti();
    showConfetti = true;
    speakNailong('哇！太棒了！你得了 ' + score + ' 分！你是超級棒的模型小達人喔！');
  } else {
    speakNailong('你得到了 ' + score + ' 分！沒關係，再點點圖案聽聽看，下次一定會全對喔！');
  }
}

// --- 繪製成績結果卡片 ---
function drawScoreBoard() {
  push();
  fill(0, 210);
  rect(width / 2, height / 2, width, height);

  fill(34, 47, 62);
  stroke(score >= 80 ? color(46, 204, 113) : color(255, 118, 117));
  strokeWeight(5);
  rectMode(CENTER);
  rect(width / 2, height / 2, min(420, width * 0.85), 300, 22);

  noStroke();
  fill(255);
  textSize(28);
  textStyle(BOLD);
  text('🏆 測驗成績 🏆', width / 2, height / 2 - 100);

  textSize(58);
  fill(score >= 80 ? color(46, 204, 113) : color(255, 118, 117));
  text(score + ' 分', width / 2, height / 2 - 25);

  textSize(20);
  fill(255);
  if (score >= 80) {
    text('🎉 恭喜你！太厲害了！\n你已經是模型小高手囉！', width / 2, height / 2 + 50);
  } else {
    text('💪 沒關係！再試一次，\n你一定會做得更好！', width / 2, height / 2 + 50);
  }
  pop();
}

// --- 彩帶特效粒子系統 ---
function initConfetti() {
  confettiList = [];
  let colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#e67e22', '#fd79a8'];

  for (let i = 0; i < 180; i++) {
    confettiList.push({
      x: random(width),
      y: random(-height, 0),
      size: random(8, 15),
      color: random(colors),
      speedY: random(2, 6),
      speedX: random(-2, 2),
      rotation: random(TWO_PI),
      rotSpeed: random(-0.1, 0.1)
    });
  }
}

// --- 更新與繪製彩帶 ---
function updateAndDrawConfetti() {
  push();
  noStroke();
  for (let p of confettiList) {
    p.y += p.speedY;
    p.x += p.speedX;
    p.rotation += p.rotSpeed;

    if (p.y > height) {
      p.y = random(-50, 0);
      p.x = random(width);
    }

    push();
    translate(p.x, p.y);
    rotate(p.rotation);
    fill(p.color);
    rect(0, 0, p.size, p.size / 2);
    pop();
  }
  pop();
}

// --- 響應式全螢幕視窗重置事件 ---
function windowResized() {
  // 重新調整畫布尺寸為當前視窗大小
  resizeCanvas(windowWidth, windowHeight);
  // 重新計算放置區與選項位置
  createQuizElements();
}