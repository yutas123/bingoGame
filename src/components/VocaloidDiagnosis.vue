<template>
  <div class="vocaloid-diagnosis">
    <div class="diagnosis-header">
      <h1>Z世代向けボカロ診断</h1>
      <p class="subtitle">あなたの「知ってるボカロ曲」を診断しよう！</p>
    </div>
    
    <!-- スタート画面 -->
    <div v-if="currentStep === 'start'" class="start-screen">
      <div class="start-image">
        <img src="https://placehold.jp/300x200.png" alt="ボカロ診断" />
      </div>
      <p class="start-description">
        50曲のボカロ曲を「知ってる」か「知らない」か答えて、<br>
        あなたのボカロタイプを診断しよう！
      </p>
      <button @click="startDiagnosis" class="start-btn">診断スタート</button>
    </div>
    
    <!-- 診断画面 -->
    <div v-else-if="currentStep === 'diagnosis'" class="diagnosis-screen">
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${(answeredCount / totalQuestions) * 100}%` }"></div>
        </div>
        <div class="progress-text">{{ answeredCount }}/{{ totalQuestions }}曲</div>
      </div>
      
      <div class="card-container">
        <div class="swipe-indicators">
          <div class="swipe-left">
            <span class="indicator-icon">👎</span>
            <span class="indicator-text">知らない</span>
          </div>
          <div class="swipe-right">
            <span class="indicator-text">知ってる</span>
            <span class="indicator-icon">👍</span>
          </div>
        </div>
        
        <!-- Tinderスタイルのカードスワイプ -->
        <div class="tinder-cards">
          <swiper
            :modules="[EffectCards]"
            :effect="'cards'"
            :grab-cursor="true"
            class="card-swiper"
            @swiper="onSwiperInit"
            @slideChange="onSlideChange"
            @slideNextTransitionStart="onSlideNextStart"
            @slidePrevTransitionStart="onSlidePrevStart"
            :cards-effect="{
              slideShadows: true,
              rotate: true,
              perSlideRotate: 4,
              perSlideOffset: 8,
            }"
            ref="swiperRef"
          >
            <swiper-slide v-for="(song, index) in diagnosisSongs" :key="song.id" class="swiper-card">
              <div class="song-card">
                <div class="swipe-overlay left-overlay">
                  <div class="overlay-content">
                    <span class="overlay-icon">👎</span>
                    <span class="overlay-text">知らない</span>
                  </div>
                </div>
                <div class="swipe-overlay right-overlay">
                  <div class="overlay-content">
                    <span class="overlay-icon">👍</span>
                    <span class="overlay-text">知ってる</span>
                  </div>
                </div>
                <div class="song-thumbnail">
                  <img src="https://placehold.jp/200x200.png" alt="曲のサムネイル" />
                </div>
                <div class="song-info">
                  <h2 class="song-title">{{ song.title }}</h2>
                  <p class="song-producer">{{ song.producer }}</p>
                  <p class="song-vocalist">{{ song.vocalist }}</p>
                  <p class="song-year">{{ song.year }}年</p>
                </div>
              </div>
            </swiper-slide>
          </swiper>
        </div>
        
        <!-- 知ってる！エフェクト -->
        <div v-if="showKnowEffect" class="know-effect animate__animated animate__bounceIn">
          <div class="effect-content">
            <div class="effect-stamp">知ってる！</div>
            <div class="effect-comment">{{ currentKnowComment }}</div>
          </div>
        </div>
        
        <!-- 知らない！エフェクト -->
        <div v-if="showDontKnowEffect" class="dont-know-effect animate__animated animate__fadeIn">
          <div class="effect-content">
            <div class="effect-trivia">
              <h3>豆知識</h3>
              <p>{{ currentTrivia }}</p>
            </div>
            <div class="effect-action">
              <button @click="addToCheckList" class="add-to-checklist-btn">
                <span class="icon">📝</span> チェックリストに追加
              </button>
            </div>
          </div>
        </div>
        
        <!-- レア曲発見エフェクト -->
        <div v-if="showRareEffect" class="rare-effect animate__animated animate__zoomIn">
          <div class="rare-content">
            <div class="rare-title">レア曲発見！</div>
            <div class="rare-message">これを知ってたらガチ勢！</div>
          </div>
        </div>
      </div>
      
      <div class="manual-buttons">
        <button type="button" @click="rejectCard" class="dont-know-btn">
          <span class="btn-icon">👎</span> 知らない！
        </button>
        <button type="button" @click="acceptCard" class="know-btn">
          <span class="btn-icon">👍</span> 知ってる！
        </button>
      </div>
    </div>
    
    <!-- 結果画面 -->
    <div v-else-if="currentStep === 'result'" class="result-screen">
      <div class="result-card">
        <h2 class="result-title">診断結果</h2>
        <div class="result-type">
          <h3>あなたは...</h3>
          <div class="result-type-name">{{ resultType.title }}</div>
          <p class="result-type-description">{{ resultType.description }}</p>
        </div>
        
        <div class="result-stats">
          <div class="stats-item">
            <div class="stats-label">知ってる曲</div>
            <div class="stats-value">{{ knownSongs.length }}/{{ totalQuestions }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">知識レベル</div>
            <div class="stats-value">{{ Math.round((knownSongs.length / totalQuestions) * 100) }}%</div>
          </div>
        </div>
        
        <div class="era-breakdown">
          <h3>時代別知識レベル</h3>
          <div class="era-bars">
            <div 
              v-for="(era, index) in eraStats" 
              :key="index"
              class="era-bar-container"
            >
              <div class="era-label">{{ era.label }}</div>
              <div class="era-bar-wrapper">
                <div class="era-bar" :style="{ width: `${era.percentage}%`, backgroundColor: eraColors[index] }"></div>
              </div>
              <div class="era-percentage">{{ era.percentage }}%</div>
            </div>
          </div>
        </div>
        
        <div class="share-section">
          <h3>結果をシェアしよう！</h3>
          <div class="share-buttons">
            <button @click="shareToTwitter" class="share-btn twitter-btn">
              <span class="icon">🐦</span> Twitterでシェア
            </button>
            <button @click="generateShareImage" class="share-btn image-btn">
              <span class="icon">📷</span> 画像を生成
            </button>
          </div>
        </div>
        
        <div class="share-image" v-if="shareImageUrl">
          <img :src="shareImageUrl" alt="診断結果" />
          <button @click="downloadImage" class="download-btn">画像を保存</button>
        </div>
        
        <div class="restart-section">
          <button @click="resetDiagnosis" class="restart-btn">もう一度診断する</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import html2canvas from 'html2canvas';
import type { VocaloidSong } from '../type';
import { vocaloidSongs } from '../data/songs';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { EffectCards } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'animate.css';

// 状態管理
const currentStep = ref<'start' | 'diagnosis' | 'result'>('start');
const selectedSongs = ref<number[]>([]);
const answeredSongs = ref<number[]>([]);
const knownSongs = ref<number[]>([]);
const currentSongIndex = ref(0);
const shareImageUrl = ref('');
const totalQuestions = 5; // 診断で使用する曲数（テスト用に少なくしています）

// Swiper関連の状態
const swiperRef = ref<any>(null);
const swiperInstance = ref<any>(null);
const remainingSongs = ref<VocaloidSong[]>([]);
const checkList = ref<VocaloidSong[]>([]);
const currentSongForSwipe = ref<VocaloidSong | null>(null);

// エフェクト関連の状態
const showKnowEffect = ref(false);
const showDontKnowEffect = ref(false);
const showRareEffect = ref(false);
const currentKnowComment = ref('');
const currentTrivia = ref('');
const currentSongForEffect = ref<VocaloidSong | null>(null);

// 効果音
const knowSound = ref(null as HTMLAudioElement | null);
const dontKnowSound = ref(null as HTMLAudioElement | null);

// 効果音の初期化
const initSounds = () => {
  try {
    knowSound.value = new Audio('/sounds/know.mp3');
    dontKnowSound.value = new Audio('/sounds/dont-know.mp3');
  } catch (e) {
    console.error('効果音の初期化に失敗しました', e);
  }
};

// 知ってる！コメントのリスト
const knowComments = [
  'さすが！これを知ってるとはガチ勢！',
  'この曲、いいですよね！',
  'あなたはボカロ通！',
  'この曲を知ってるなんて素敵！',
  'ボカロマスターの証！',
  'センスいいですね！',
  'この曲、名曲ですよね！'
];

// 豆知識のリスト
const triviaList = {
  dawn: [
    '初音ミクが発売されたのは2007年8月31日です！',
    'ボカロ黎明期の曲は、今でも根強い人気があります。',
    'この時代はニコニコ動画の全盛期でもありました。'
  ],
  firstBoom: [
    'この時代はボカロPの数が急増した時期です。',
    'ボーカロイドがテレビCMに使われ始めたのもこの頃！',
    'この時代の曲は、今でも多くのライブで演奏されています。'
  ],
  golden: [
    'この時代はボカロ曲のCD販売が最も盛んでした。',
    'ボカロ曲がアニメのテーマソングに採用されることも増えました。',
    'ボカロPの中からメジャーデビューする人も出てきた時代です。'
  ],
  mature: [
    'この時代はボカロの表現の幅が広がった時期です。',
    'ボカロ曲のMVのクオリティが飛躍的に向上しました。',
    'ストリーミングサービスの普及でボカロの聴き方も変わりました。'
  ],
  modern: [
    'TikTokなどのSNSでボカロ曲が再評価される時代です。',
    '新世代のボカロPが次々と登場しています。',
    'ボカロ文化は今や世界中に広がっています！'
  ]
};

// レア曲判定（人気度が低い曲をレア曲とする）
const isRareSong = (song: VocaloidSong): boolean => {
  return song.popularity <= 7;
};

// 診断に使用する曲をランダムに選択
const diagnosisSongs = ref<VocaloidSong[]>([]);

// 現在の曲
const currentSong = computed(() => {
  if (diagnosisSongs.value.length === 0 || currentSongIndex.value >= diagnosisSongs.value.length) {
    return {} as VocaloidSong;
  }
  return diagnosisSongs.value[currentSongIndex.value];
});

// 回答済みの曲数
const answeredCount = computed(() => answeredSongs.value.length);

// 時代ラベル
const eraLabels = {
  dawn: '黎明期 (2007-2009)',
  firstBoom: '第一次ブーム (2010-2012)',
  golden: '全盛期 (2013-2015)',
  mature: '成熟期 (2016-2018)',
  modern: '現代 (2019-)'
};

// グラフの色
const eraColors = ['#ffb6c1', '#ffcc99', '#aaffaa', '#99ccff', '#cc99ff'];

// 時代別達成率
const eraStats = computed(() => {
  const eras = {
    dawn: { count: 0, total: 0, label: '黎明期' },
    firstBoom: { count: 0, total: 0, label: '第一次ブーム' },
    golden: { count: 0, total: 0, label: '全盛期' },
    mature: { count: 0, total: 0, label: '成熟期' },
    modern: { count: 0, total: 0, label: '現代' }
  };
  
  diagnosisSongs.value.forEach(song => {
    eras[song.era].total++;
    if (knownSongs.value.includes(song.id)) {
      eras[song.era].count++;
    }
  });
  
  return Object.entries(eras).map(([key, value]) => ({
    era: key,
    label: value.label,
    count: value.count,
    total: value.total,
    percentage: value.total > 0 ? Math.round((value.count / value.total) * 100) : 0
  }));
});

// 診断結果タイプ
const resultType = computed(() => {
  const knownPercentage = (knownSongs.value.length / totalQuestions) * 100;
  
  // 時代別の知識レベル
  const eraPercentages = eraStats.value.reduce((acc, era) => {
    acc[era.era] = era.percentage;
    return acc;
  }, {} as Record<string, number>);
  
  // 最も知識レベルが高い時代
  const maxEraEntry = eraStats.value.reduce((max, era) => 
    era.percentage > max.percentage ? era : max, 
    { era: '', percentage: 0 }
  );
  
  // 診断結果の決定ロジック
  if (knownPercentage >= 80) {
    return {
      title: "ボカロマスター",
      description: "あなたはボカロの歴史に精通した真のマスター！どの時代の曲も深く理解しています。"
    };
  } else if (knownPercentage >= 60) {
    if (eraPercentages.dawn >= 70 && eraPercentages.firstBoom >= 70) {
      return {
        title: "初期ボカロ世代",
        description: "ボカロ黎明期から第一次ブームを熱心に追いかけていた古参リスナー！"
      };
    } else if (eraPercentages.modern >= 70 && eraPercentages.mature >= 70) {
      return {
        title: "最新ボカロ通",
        description: "最新のボカロトレンドに敏感！現代のボカロシーンを深く理解しています。"
      };
    } else {
      return {
        title: "バランス型ボカロファン",
        description: "様々な時代のボカロ曲をバランスよく知っている本格派リスナー！"
      };
    }
  } else if (knownPercentage >= 40) {
    if (eraPercentages.modern >= 60) {
      return {
        title: "TikTokボカロ世代",
        description: "SNSで流行った最新のボカロ曲に詳しいトレンドリスナー！"
      };
    } else if (maxEraEntry.percentage >= 60) {
      const eraName = eraLabels[maxEraEntry.era as keyof typeof eraLabels].split(' ')[0];
      return {
        title: `${eraName}ボカロリスナー`,
        description: `${eraName}の曲に特に詳しいあなた。この時代のボカロシーンが青春だったのかも？`
      };
    } else {
      return {
        title: "カジュアルボカロファン",
        description: "メジャーなボカロ曲を中心に楽しんでいるリスナー。もっと深堀りする余地あり！"
      };
    }
  } else {
    return {
      title: "ボカロビギナー",
      description: "ボカロの世界はこれからが楽しみ！有名な曲から少しずつ知識を広げていきましょう。"
    };
  }
});

// 診断開始
const startDiagnosis = () => {
  console.log('診断開始');
  
  // 診断用の曲をランダムに選択
  const shuffled = [...vocaloidSongs].sort(() => 0.5 - Math.random());
  diagnosisSongs.value = shuffled.slice(0, totalQuestions);
  console.log('選択された曲:', diagnosisSongs.value);
  
  // 状態のリセット
  currentSongIndex.value = 0;
  answeredSongs.value = [];
  knownSongs.value = [];
  remainingSongs.value = [...diagnosisSongs.value];
  
  // 診断画面に移行
  currentStep.value = 'diagnosis';
  console.log('現在のステップ:', currentStep.value);
  console.log('現在の曲インデックス:', currentSongIndex.value);
  console.log('現在の曲:', diagnosisSongs.value[currentSongIndex.value]);
  
  // 効果音の初期化
  initSounds();
};

// 曲への回答
const answerSong = (known: boolean) => {
  const songId = currentSong.value.id;
  
  // 回答を記録
  answeredSongs.value.push(songId);
  if (known) {
    knownSongs.value.push(songId);
  }
  
  // 次の曲へ、または結果画面へ
  if (answeredCount.value >= totalQuestions) {
    currentStep.value = 'result';
  } else {
    currentSongIndex.value++;
  }
};

// 診断のリセット
const resetDiagnosis = () => {
  currentStep.value = 'start';
  shareImageUrl.value = '';
};

// 共有画像生成
const generateShareImage = async () => {
  const element = document.querySelector('.result-card');
  if (element) {
    const canvas = await html2canvas(element as HTMLElement, {
      backgroundColor: '#ffffff',
      scale: 2, // 高解像度
    });
    shareImageUrl.value = canvas.toDataURL('image/png');
  }
};

// Twitterで共有
const shareToTwitter = () => {
  const text = `私は「${resultType.value.title}」タイプのボカロリスナーでした！\n知ってる曲: ${knownSongs.value.length}/${totalQuestions}曲 (${Math.round((knownSongs.value.length / totalQuestions) * 100)}%)\n#Z世代ボカロ診断 #ボカロ`;
  const url = encodeURIComponent(window.location.href);
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`, '_blank');
};

// 画像ダウンロード
const downloadImage = () => {
  const a = document.createElement('a');
  a.href = shareImageUrl.value;
  a.download = 'vocaloid-diagnosis-result.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Swiperカードの初期化
const initTinderCards = () => {
  remainingSongs.value = [...diagnosisSongs.value];
};

// 「知ってる！」エフェクトの表示
const displayKnowEffect = (song: VocaloidSong) => {
  console.log('知ってる！エフェクト表示', song.title);
  
  // ランダムなコメントを選択
  currentKnowComment.value = knowComments[Math.floor(Math.random() * knowComments.length)];
  currentSongForEffect.value = song;
  
  // 効果音を再生
  if (knowSound.value) {
    knowSound.value.currentTime = 0;
    knowSound.value.play().catch(e => console.error('効果音の再生に失敗しました', e));
  }
  
  // エフェクトを表示
  showKnowEffect.value = true;
  console.log('showKnowEffect:', showKnowEffect.value);
  
  // レア曲判定
  if (isRareSong(song)) {
    setTimeout(() => {
      showRareEffect.value = true;
      console.log('showRareEffect:', showRareEffect.value);
      setTimeout(() => {
        showRareEffect.value = false;
      }, 2000);
    }, 500);
  }
  
  // エフェクトを一定時間後に非表示
  setTimeout(() => {
    showKnowEffect.value = false;
  }, 1500);
};

// 「知らない！」エフェクトの表示
const displayDontKnowEffect = (song: VocaloidSong) => {
  console.log('知らない！エフェクト表示', song.title);
  
  // 時代に応じた豆知識を選択
  const trivias = triviaList[song.era];
  currentTrivia.value = trivias[Math.floor(Math.random() * trivias.length)];
  currentSongForEffect.value = song;
  
  // 効果音を再生
  if (dontKnowSound.value) {
    dontKnowSound.value.currentTime = 0;
    dontKnowSound.value.play().catch(e => console.error('効果音の再生に失敗しました', e));
  }
  
  // エフェクトを表示
  showDontKnowEffect.value = true;
  console.log('showDontKnowEffect:', showDontKnowEffect.value);
  
  // エフェクトを一定時間後に非表示
  setTimeout(() => {
    showDontKnowEffect.value = false;
  }, 3000);
};

// チェックリストに追加
const addToCheckList = () => {
  if (currentSongForEffect.value && !checkList.value.some(s => s.id === currentSongForEffect.value?.id)) {
    checkList.value.push(currentSongForEffect.value);
  }
  
  // エフェクトを非表示
  showDontKnowEffect.value = false;
};

// Swiperイベントハンドラ
const onSwiperInit = (swiper: any) => {
  swiperInstance.value = swiper;
  currentSongForSwipe.value = remainingSongs.value[0] || null;
};

const onSlideChange = (swiper: any) => {
  const index = swiper.activeIndex;
  if (index < remainingSongs.value.length) {
    currentSongForSwipe.value = remainingSongs.value[index];
  }
};

const onSlideNextStart = () => {
  // 右スワイプ（知ってる）
  if (currentSongForSwipe.value) {
    answeredSongs.value.push(currentSongForSwipe.value.id);
    knownSongs.value.push(currentSongForSwipe.value.id);
    displayKnowEffect(currentSongForSwipe.value);
    
    // 全ての曲に回答したら結果画面へ
    if (answeredSongs.value.length >= totalQuestions) {
      setTimeout(() => {
        currentStep.value = 'result';
      }, 1500);
    }
  }
};

const onSlidePrevStart = () => {
  // 左スワイプ（知らない）
  if (currentSongForSwipe.value) {
    answeredSongs.value.push(currentSongForSwipe.value.id);
    displayDontKnowEffect(currentSongForSwipe.value);
    
    // 全ての曲に回答したら結果画面へ
    if (answeredSongs.value.length >= totalQuestions) {
      setTimeout(() => {
        currentStep.value = 'result';
      }, 1500);
    }
  }
};

// 手動で「知らない！」を選択
const rejectCard = () => {
  console.log('知らない！ボタンクリック');
  
  if (swiperInstance.value) {
    // Swiperを左にスライド（知らない）
    swiperInstance.value.slidePrev();
  } else {
    console.log('Swiperインスタンスが初期化されていません');
    
    if (currentSongIndex.value < diagnosisSongs.value.length) {
      const currentSong = diagnosisSongs.value[currentSongIndex.value];
      console.log('知らない！処理開始', currentSong.title);
      
      // 回答を記録
      answeredSongs.value.push(currentSong.id);
      console.log('answeredSongs:', answeredSongs.value);
      
      // エフェクト表示
      displayDontKnowEffect(currentSong);
      
      // 次の曲へ
      const oldIndex = currentSongIndex.value;
      currentSongIndex.value++;
      console.log('インデックス更新:', oldIndex, '->', currentSongIndex.value);
      
      // プログレスバーを更新
      const progressPercent = (answeredSongs.value.length / totalQuestions) * 100;
      console.log(`進行状況: ${answeredSongs.value.length}/${totalQuestions} (${progressPercent}%)`);
      
      // 全ての曲に回答したら結果画面へ
      if (currentSongIndex.value >= diagnosisSongs.value.length || answeredSongs.value.length >= totalQuestions) {
        console.log('全ての曲に回答しました。結果画面へ移行します。');
        setTimeout(() => {
          currentStep.value = 'result';
        }, 1500);
      }
    } else {
      console.error('知らない！処理失敗: currentSongIndex が範囲外です', currentSongIndex.value, diagnosisSongs.value.length);
    }
  }
};

// 手動で「知ってる！」を選択
const acceptCard = () => {
  console.log('知ってる！ボタンクリック');
  
  if (swiperInstance.value) {
    // Swiperを右にスライド（知ってる）
    swiperInstance.value.slideNext();
  } else {
    console.log('Swiperインスタンスが初期化されていません');
    
    if (currentSongIndex.value < diagnosisSongs.value.length) {
      const currentSong = diagnosisSongs.value[currentSongIndex.value];
      console.log('知ってる！処理開始', currentSong.title);
      
      // 回答を記録
      answeredSongs.value.push(currentSong.id);
      knownSongs.value.push(currentSong.id);
      console.log('answeredSongs:', answeredSongs.value);
      console.log('knownSongs:', knownSongs.value);
      
      // エフェクト表示
      displayKnowEffect(currentSong);
      
      // 次の曲へ
      const oldIndex = currentSongIndex.value;
      currentSongIndex.value++;
      console.log('インデックス更新:', oldIndex, '->', currentSongIndex.value);
      
      // プログレスバーを更新
      const progressPercent = (answeredSongs.value.length / totalQuestions) * 100;
      console.log(`進行状況: ${answeredSongs.value.length}/${totalQuestions} (${progressPercent}%)`);
      
      // 全ての曲に回答したら結果画面へ
      if (currentSongIndex.value >= diagnosisSongs.value.length || answeredSongs.value.length >= totalQuestions) {
        console.log('全ての曲に回答しました。結果画面へ移行します。');
        setTimeout(() => {
          currentStep.value = 'result';
        }, 1500);
      }
    } else {
      console.error('知ってる！処理失敗: currentSongIndex が範囲外です', currentSongIndex.value, diagnosisSongs.value.length);
    }
  }
};

// 診断開始時にTinderカードを初期化
watch(() => currentStep.value, (newValue) => {
  if (newValue === 'diagnosis') {
    nextTick(() => {
      initTinderCards();
    });
  }
});

// ページロード時の処理
onMounted(() => {
  // 効果音の初期化
  initSounds();
});
</script>

<style scoped>
.vocaloid-diagnosis {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Noto Sans JP', sans-serif;
  color: #333;
}

.diagnosis-header {
  text-align: center;
  margin-bottom: 30px;
}

.diagnosis-header h1 {
  color: #ff6b9d;
  margin-bottom: 10px;
  font-size: 2.2rem;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
}

/* スタート画面 */
.start-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 30px;
  background-color: #fff9fb;
  border-radius: 20px;
  box-shadow: 0 6px 15px rgba(255, 107, 157, 0.1);
}

.start-image {
  margin-bottom: 20px;
}

.start-image img {
  border-radius: 15px;
  max-width: 100%;
}

.start-description {
  margin-bottom: 30px;
  line-height: 1.6;
  color: #666;
}

.start-btn {
  background-color: #ff6b9d;
  color: white;
  border: none;
  padding: 15px 40px;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(255, 107, 157, 0.3);
}

.start-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(255, 107, 157, 0.4);
}

/* 診断画面 */
.diagnosis-screen {
  padding: 20px;
}

.progress-bar-container {
  margin-bottom: 30px;
}

.progress-bar {
  height: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-fill {
  height: 100%;
  background-color: #ff6b9d;
  border-radius: 5px;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: right;
  font-size: 0.9rem;
  color: #666;
}

.song-card {
  background-color: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.song-thumbnail {
  margin-bottom: 20px;
}

.song-thumbnail img {
  border-radius: 10px;
  max-width: 100%;
}

.song-info {
  margin-bottom: 30px;
}

.song-title {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}

.song-producer {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 5px;
}

.song-vocalist {
  font-size: 1rem;
  color: #888;
}

.answer-buttons {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  justify-content: center;
  margin-bottom: 30px;
}

.know-btn, .dont-know-btn {
  padding: 15px 30px;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.know-btn {
  background-color: #ff6b9d;
  color: white;
  box-shadow: 0 4px 10px rgba(255, 107, 157, 0.3);
}

.dont-know-btn {
  background-color: #f0f0f0;
  color: #666;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.know-btn:hover, .dont-know-btn:hover {
  transform: translateY(-3px);
}

/* 結果画面 */
.result-screen {
  padding: 20px;
}

.result-card {
  background-color: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
}

.result-title {
  text-align: center;
  color: #ff6b9d;
  margin-bottom: 30px;
  font-size: 2rem;
}

.result-type {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background-color: #fff9fb;
  border-radius: 15px;
}

.result-type h3 {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 10px;
}

.result-type-name {
  font-size: 2rem;
  font-weight: bold;
  color: #ff6b9d;
  margin-bottom: 15px;
}

.result-type-description {
  color: #666;
  line-height: 1.6;
}

.result-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30px;
}

.stats-item {
  text-align: center;
}

.stats-label {
  font-size: 1rem;
  color: #666;
  margin-bottom: 5px;
}

.stats-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.era-breakdown {
  margin-bottom: 30px;
}

.era-breakdown h3 {
  font-size: 1.2rem;
  margin-bottom: 15px;
  text-align: center;
}

.era-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.era-bar-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.era-label {
  width: 120px;
  font-size: 0.9rem;
}

.era-bar-wrapper {
  flex-grow: 1;
  height: 12px;
  background-color: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
}

.era-bar {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease;
}

.era-percentage {
  width: 40px;
  text-align: right;
  font-size: 0.9rem;
}

.share-section {
  margin-bottom: 30px;
  text-align: center;
}

.share-section h3 {
  font-size: 1.2rem;
  margin-bottom: 15px;
}

.share-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.share-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 50px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.twitter-btn {
  background-color: #1DA1F2;
  color: white;
}

.image-btn {
  background-color: #f0f0f0;
  color: #333;
}

.share-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.share-image {
  margin-top: 20px;
  text-align: center;
}

.share-image img {
  max-width: 100%;
  border-radius: 10px;
  margin-bottom: 15px;
  border: 1px solid #eee;
}

.download-btn {
  padding: 10px 20px;
  background-color: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s;
}

.restart-section {
  text-align: center;
  margin-top: 30px;
}

.restart-btn {
  padding: 12px 25px;
  background-color: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s;
}

.restart-btn:hover {
  background-color: #e0e0e0;
}

/* Swiperカードのスタイル */
.card-swiper {
  width: 100%;
  height: 400px;
  position: relative;
  z-index: 1;
}

:deep(.swiper-slide) {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 20px;
  font-size: 22px;
  font-weight: bold;
  color: #333;
  background-color: white;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
}

:deep(.swiper-slide-shadow-left),
:deep(.swiper-slide-shadow-right) {
  border-radius: 20px;
}

:deep(.swiper-cards) {
  overflow: visible;
}

/* スワイプオーバーレイ */
.swipe-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 10;
  pointer-events: none;
}

.left-overlay {
  background: linear-gradient(to right, rgba(255, 0, 0, 0.2), transparent);
  justify-content: flex-start;
  padding-left: 30px;
}

.right-overlay {
  background: linear-gradient(to left, rgba(0, 255, 0, 0.2), transparent);
  justify-content: flex-end;
  padding-right: 30px;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 15px;
  border-radius: 50%;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.overlay-icon {
  font-size: 2rem;
}

.overlay-text {
  font-size: 1rem;
  font-weight: bold;
  margin-top: 5px;
}

/* スワイプ中のオーバーレイ表示 */
:deep(.swiper-slide-prev) .left-overlay,
:deep(.swiper-slide-next) .right-overlay {
  opacity: 1;
}

/* Tinderカードコンテナ */
.tinder-cards {
  width: 100%;
  height: 400px;
  position: relative;
}
.card-container {
  position: relative;
  margin-bottom: 30px;
  height: 450px;
}

.simple-card {
  width: 100%;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 1;
}

.swipe-indicators {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  color: #999;
  font-size: 0.9rem;
}

.swipe-left, .swipe-right {
  display: flex;
  align-items: center;
  gap: 5px;
}

.indicator-icon {
  font-size: 1.2rem;
}

.manual-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
  margin-bottom: 30px;
}

.manual-buttons .know-btn, 
.manual-buttons .dont-know-btn {
  padding: 20px 40px;
  font-size: 1.3rem;
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s;
}

.manual-buttons .know-btn:hover, 
.manual-buttons .dont-know-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.manual-buttons .know-btn {
  background-color: #ff6b9d;
  color: white;
}

.manual-buttons .dont-know-btn {
  background-color: #f0f0f0;
  color: #666;
}

.btn-icon {
  margin-right: 5px;
  font-size: 1.5rem;
}

/* エフェクト */
.know-effect, .dont-know-effect, .rare-effect {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  pointer-events: none;
  background-color: rgba(255, 255, 255, 0.5);
}

.effect-content, .rare-content {
  background-color: rgba(255, 255, 255, 0.9);
  padding: 30px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  max-width: 80%;
}

.effect-stamp {
  font-size: 2rem;
  font-weight: bold;
  color: #ff6b9d;
  margin-bottom: 15px;
}

.effect-comment {
  font-size: 1.2rem;
  color: #666;
}

.effect-trivia {
  margin-bottom: 20px;
}

.effect-trivia h3 {
  font-size: 1.5rem;
  color: #ff6b9d;
  margin-bottom: 10px;
}

.effect-trivia p {
  font-size: 1.1rem;
  color: #666;
  line-height: 1.5;
}

.effect-action {
  margin-top: 20px;
}

.add-to-checklist-btn {
  background-color: #ff6b9d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 50px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 auto;
  pointer-events: auto;
}

.rare-title {
  font-size: 2rem;
  font-weight: bold;
  color: #ffaa00;
  margin-bottom: 15px;
}

.rare-message {
  font-size: 1.2rem;
  color: #666;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .vocaloid-diagnosis {
    padding: 15px;
  }
  
  .diagnosis-header h1 {
    font-size: 1.8rem;
  }
  
  .song-title {
    font-size: 1.5rem;
  }
  
  .answer-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .know-btn, .dont-know-btn {
    width: 100%;
  }
  
  .result-type-name {
    font-size: 1.6rem;
  }
  
  .share-buttons {
    flex-direction: column;
    gap: 10px;
  }
  
  .share-btn {
    width: 100%;
  }
}
</style>
