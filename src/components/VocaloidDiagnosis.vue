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
      
      <div class="song-card">
        <div class="song-thumbnail">
          <img src="https://placehold.jp/200x200.png" alt="曲のサムネイル" />
        </div>
        <div class="song-info">
          <h2 class="song-title">{{ currentSong.title }}</h2>
          <p class="song-producer">{{ currentSong.producer }}</p>
          <p class="song-vocalist">{{ currentSong.vocalist }}</p>
        </div>
      </div>
      
      <div class="answer-buttons">
        <button @click="answerSong(true)" class="know-btn">知ってる！</button>
        <button @click="answerSong(false)" class="dont-know-btn">知らない！</button>
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
import { ref, computed, onMounted } from 'vue';
import html2canvas from 'html2canvas';
import type { VocaloidSong } from '../type';
import { vocaloidSongs } from '../data/songs';

// 状態管理
const currentStep = ref<'start' | 'diagnosis' | 'result'>('start');
const selectedSongs = ref<number[]>([]);
const answeredSongs = ref<number[]>([]);
const knownSongs = ref<number[]>([]);
const currentSongIndex = ref(0);
const shareImageUrl = ref('');
const totalQuestions = 50; // 診断で使用する曲数

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
  // 診断用の曲をランダムに選択
  const shuffled = [...vocaloidSongs].sort(() => 0.5 - Math.random());
  diagnosisSongs.value = shuffled.slice(0, totalQuestions);
  
  // 状態のリセット
  currentSongIndex.value = 0;
  answeredSongs.value = [];
  knownSongs.value = [];
  
  // 診断画面に移行
  currentStep.value = 'diagnosis';
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

// ページロード時の処理
onMounted(() => {
  // ESCキーでモーダルを閉じるなどの処理があれば
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
