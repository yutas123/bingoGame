<template>
  <div class="vocaloid-bingo">
    <div class="bingo-header">
      <h1>ボカロビンゴ</h1>
      <div class="filters">
        <button @click="filterByEra('all')" :class="{ active: currentFilter === 'all' }">すべて</button>
        <button @click="filterByEra('dawn')" :class="{ active: currentFilter === 'dawn' }">黎明期 (2007-2009)</button>
        <button @click="filterByEra('firstBoom')" :class="{ active: currentFilter === 'firstBoom' }">第一次ブーム (2010-2012)</button>
        <button @click="filterByEra('golden')" :class="{ active: currentFilter === 'golden' }">全盛期 (2013-2015)</button>
        <button @click="filterByEra('mature')" :class="{ active: currentFilter === 'mature' }">成熟期 (2016-2018)</button>
        <button @click="filterByEra('modern')" :class="{ active: currentFilter === 'modern' }">現代 (2019-)</button>
      </div>
    </div>
    
    <div class="bingo-grid" :class="`grid-${gridSize}`">
      <div 
        v-for="song in filteredSongs" 
        :key="song.id" 
        class="bingo-cell"
        :class="{ selected: selectedSongs.includes(song.id) }"
        @click="toggleSong(song.id)"
      >
        <div class="song-info">
          <div class="song-title">{{ song.title }}</div>
          <div class="song-producer">{{ song.producer }}</div>
          <div class="song-year">{{ song.year }}</div>
        </div>
      </div>
    </div>
    
    <div class="bingo-stats">
      <div class="completion-rate">
        完了率: {{ Math.round((selectedSongs.length / filteredSongs.length) * 100) }}%
      </div>
      <div class="era-stats">
        <div v-for="(count, era) in eraCompletion" :key="era">
          {{ eraLabels[era] }}: {{ count.completed }}/{{ count.total }}
        </div>
      </div>
    </div>
    
    <!-- 追加: アクションボタン -->
    <div class="action-buttons">
      <button 
        @click="showResults = true" 
        class="action-btn result-btn"
        v-if="selectedSongs.length > 0"
      >
        結果を見る
      </button>
      <button 
        @click="showAchievements = true" 
        class="action-btn achievements-btn"
      >
        実績を確認
      </button>
    </div>

    <div class="share-section">
      <button @click="generateShareImage">画像を生成して共有</button>
      <div class="share-result" v-if="shareImageUrl">
        <img :src="shareImageUrl" alt="Your Vocaloid Bingo Result" />
        <div class="share-buttons">
          <button @click="shareToTwitter">Twitterで共有</button>
          <button @click="downloadImage">画像を保存</button>
        </div>
      </div>
    </div>
    
    <!-- 追加: モーダル - 結果表示 -->
    <div class="modal-overlay" v-if="showResults" @click="closeModals">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeModals">×</button>
        <ShareResult 
          :selectedSongs="selectedSongs" 
          :vocaloidSongs="vocaloidSongs" 
        />
      </div>
    </div>
    
    <!-- 追加: モーダル - 実績表示 -->
    <div class="modal-overlay" v-if="showAchievements" @click="closeModals">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeModals">×</button>
        <AchievementDisplay :achievements="achievements" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import html2canvas from 'html2canvas';
import type { VocaloidSong } from '../type';
import { vocaloidSongs } from '../data/songs';
// 追加: コンポーネントのインポート
import ShareResult from './ShareResult.vue';
import AchievementDisplay from './AchievementDisplay.vue';
import { calculateAchievements } from '../utils/achievements';

// 状態管理
const selectedSongs = ref<number[]>([]);
const currentFilter = ref('all');
const shareImageUrl = ref('');
const gridSize = ref(10); // 10x10 グリッド

// 追加: 新しい状態変数
const showResults = ref(false);
const showAchievements = ref(false);
const achievements = ref(calculateAchievements(selectedSongs.value, vocaloidSongs));

// 曲のフィルタリング
const filteredSongs = computed(() => {
  if (currentFilter.value === 'all') {
    return vocaloidSongs;
  }
  return vocaloidSongs.filter(song => song.era === currentFilter.value);
});

// 時代ごとの完了率
const eraCompletion = computed(() => {
  const result: Record<string, { completed: number; total: number }> = {
    dawn: { completed: 0, total: 0 },
    firstBoom: { completed: 0, total: 0 },
    golden: { completed: 0, total: 0 },
    mature: { completed: 0, total: 0 },
    modern: { completed: 0, total: 0 }
  };
  
  vocaloidSongs.forEach(song => {
    result[song.era].total++;
    if (selectedSongs.value.includes(song.id)) {
      result[song.era].completed++;
    }
  });
  
  return result;
});

// 時代ラベル
const eraLabels = {
  dawn: '黎明期 (2007-2009)',
  firstBoom: '第一次ブーム (2010-2012)',
  golden: '全盛期 (2013-2015)',
  mature: '成熟期 (2016-2018)',
  modern: '現代 (2019-)'
};

// 曲の選択/解除
const toggleSong = (id: number) => {
  const index = selectedSongs.value.indexOf(id);
  if (index === -1) {
    selectedSongs.value.push(id);
  } else {
    selectedSongs.value.splice(index, 1);
  }
  // ローカルストレージに保存
  localStorage.setItem('vocaloidBingoSelected', JSON.stringify(selectedSongs.value));
};

// フィルター変更
const filterByEra = (era: string) => {
  currentFilter.value = era;
};

// 共有画像生成
const generateShareImage = async () => {
  const element = document.querySelector('.bingo-grid');
  if (element) {
    const canvas = await html2canvas(element as HTMLElement);
    shareImageUrl.value = canvas.toDataURL('image/png');
  }
};

// Twitterで共有
const shareToTwitter = () => {
  const completionRate = Math.round((selectedSongs.value.length / vocaloidSongs.length) * 100);
  const text = `私のボカロ知識は${completionRate}%です！あなたはどうですか？ #ボカロビンゴ`;
  const url = encodeURIComponent(window.location.href);
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`, '_blank');
};

// 画像ダウンロード
const downloadImage = () => {
  const a = document.createElement('a');
  a.href = shareImageUrl.value;
  a.download = 'vocaloid-bingo-result.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// 追加: モーダルを閉じる関数
const closeModals = () => {
  showResults.value = false;
  showAchievements.value = false;
};

// 追加: 選択曲が変更されたら実績を再計算するウォッチャー
watch(selectedSongs, () => {
  achievements.value = calculateAchievements(selectedSongs.value, vocaloidSongs);
  // ローカルストレージに保存
  localStorage.setItem('vocaloidBingoSelected', JSON.stringify(selectedSongs.value));
});

// ページロード時に保存データ読み込み
onMounted(() => {
  const saved = localStorage.getItem('vocaloidBingoSelected');
  if (saved) {
    selectedSongs.value = JSON.parse(saved);
  }
  
  // 追加: ESCキーでモーダルを閉じる
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModals();
    }
  });
});
</script>

<style scoped>
.vocaloid-bingo {
  max-width: 1000px;
  margin: 0 auto;
  font-family: 'Noto Sans JP', sans-serif;
}

.bingo-header {
  text-align: center;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.filters button {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background: #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
}

.filters button.active {
  background: #5d4dff;
  color: white;
}

.bingo-grid {
  display: grid;
  gap: 10px;
  margin-bottom: 30px;
}

.grid-10 {
  grid-template-columns: repeat(10, 1fr);
}

.bingo-cell {
  aspect-ratio: 1;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.8rem;
  background: #f9f9f9;
}

.bingo-cell:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.bingo-cell.selected {
  background: #b5eaff;
  border-color: #39c;
}

.song-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.song-producer {
  color: #666;
  font-size: 0.7rem;
}

.song-year {
  color: #999;
  font-size: 0.7rem;
}

.bingo-stats {
  margin-bottom: 30px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 10px;
}

.completion-rate {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.era-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.share-section {
  text-align: center;
}

.share-section button {
  padding: 10px 20px;
  background: #5d4dff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
}

.share-result {
  margin-top: 20px;
}

.share-result img {
  max-width: 100%;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.share-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
}

/* 追加: 新しいスタイル */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 30px 0;
}

.action-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.result-btn {
  background-color: #5d4dff;
  color: white;
}

.achievements-btn {
  background-color: #ffcc5d;
  color: #333;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  overflow-y: auto;
  padding: 20px;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #f0f0f0;
}

@media (max-width: 768px) {
  .grid-10 {
    grid-template-columns: repeat(5, 1fr);
  }
  
  .bingo-cell {
    font-size: 0.7rem;
  }
  
  .modal-content {
    width: 95%;
    padding: 15px;
  }
}
</style>
