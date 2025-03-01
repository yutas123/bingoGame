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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import html2canvas from 'html2canvas';
import { VocaloidSong } from '../types';
import { vocaloidSongs } from '../data/songs';

// 状態管理
const selectedSongs = ref<number[]>([]);
const currentFilter = ref('all');
const shareImageUrl = ref('');
const gridSize = ref(10); // 10x10 グリッド

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

// ページロード時に保存データ読み込み
onMounted(() => {
  const saved = localStorage.getItem('vocaloidBingoSelected');
  if (saved) {
    selectedSongs.value = JSON.parse(saved);
  }
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

@media (max-width: 768px) {
  .grid-10 {
    grid-template-columns: repeat(5, 1fr);
  }
  
  .bingo-cell {
    font-size: 0.7rem;
  }
}
</style>


