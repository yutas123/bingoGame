// ShareResult.vue
<template>
  <div class="share-result-container">
    <div class="result-card" ref="resultCard">
      <div class="card-header">
        <h2>ボカロビンゴ結果</h2>
        <div class="user-score">{{ completionRate }}%</div>
      </div>
      
      <div class="user-level">
        <span class="level-title">{{ userLevel.title }}</span>
        <span class="level-description">{{ userLevel.description }}</span>
      </div>
      
      <div class="era-breakdown">
        <h3>時代別達成率</h3>
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
      
      <div class="most-listened">
        <h3>あなたが最も聴くボカロ</h3>
        <div class="vocalist-stats">
          <div 
            v-for="vocalist in topVocalists" 
            :key="vocalist.name"
            class="vocalist-item"
          >
            <div class="vocalist-name">{{ vocalist.name }}</div>
            <div class="vocalist-count">{{ vocalist.count }}曲</div>
          </div>
        </div>
      </div>
      
      <div class="site-link">www.vocaloid-bingo.com</div>
    </div>
    
    <div class="share-actions">
      <button @click="downloadImage" class="btn download-btn">
        <span class="icon">📥</span> 画像を保存
      </button>
      <button @click="shareToTwitter" class="btn twitter-btn">
        <span class="icon">🐦</span> Twitterで共有
      </button>
      <button @click="copyShareLink" class="btn copy-btn">
        <span class="icon">🔗</span> リンクをコピー
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps } from 'vue';
import html2canvas from 'html2canvas';
import { VocaloidSong } from '../types';

const props = defineProps<{
  selectedSongs: number[];
  vocaloidSongs: VocaloidSong[];
}>();

const resultCard = ref<HTMLElement | null>(null);

// 完了率の計算
const completionRate = computed(() => {
  return Math.round((props.selectedSongs.length / props.vocaloidSongs.length) * 100);
});

// ユーザーレベルの判定
const userLevel = computed(() => {
  const rate = completionRate.value;
  if (rate < 20) {
    return { title: 'ボカロ初心者', description: 'ボカロの世界への第一歩を踏み出したばかり！' };
  } else if (rate < 40) {
    return { title: 'ボカロリスナー', description: 'メジャーな曲を中心に聴いています' };
  } else if (rate < 60) {
    return { title: 'ボカロファン', description: 'かなりのボカロ曲を知っています！' };
  } else if (rate < 80) {
    return { title: 'ボカロマニア', description: 'ボカロについての知識がかなり豊富です！' };
  } else {
    return { title: 'ボカロマスター', description: '究極のボカロ通！尊敬します！' };
  }
});

// 時代別達成率
const eraStats = computed(() => {
  const eras = {
    dawn: { count: 0, total: 0, label: '黎明期' },
    firstBoom: { count: 0, total: 0, label: '第一次ブーム' },
    golden: { count: 0, total: 0, label: '全盛期' },
    mature: { count: 0, total: 0, label: '成熟期' },
    modern: { count: 0, total: 0, label: '現代' }
  };
  
  props.vocaloidSongs.forEach(song => {
    eras[song.era].total++;
    if (props.selectedSongs.includes(song.id)) {
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

// グラフの色
const eraColors = ['#FF9999', '#FFCC99', '#CCFF99', '#99CCFF', '#CC99FF'];

// 最も聴くボカリスト
const topVocalists = computed(() => {
  const vocalistCount = {} as Record<string, number>;
  
  props.selectedSongs.forEach(id => {
    const song = props.vocaloidSongs.find(s => s.id === id);
    if (song) {
      const vocalists = song.vocalist.split('・');
      vocalists.forEach(v => {
        vocalistCount[v] = (vocalistCount[v] || 0) + 1;
      });
    }
  });
  
  return Object.entries(vocalistCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
});

// 画像ダウンロード
const downloadImage = async () => {
  if (!resultCard.value) return;
  
  try {
    const canvas = await html2canvas(resultCard.value, {
      backgroundColor: '#ffffff',
      scale: 2, // 高解像度
    });
    
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = 'vocaloid-bingo-result.png';
    link.click();
  } catch (error) {
    console.error('画像生成エラー:', error);
  }
};

// Twitterでの共有
const shareToTwitter = async () => {
  if (!resultCard.value) return;
  
  // 共有テキストのバリエーション
  const shareTexts = [
    `私のボカロ通レベルは「${userLevel.value.title}」(${completionRate.value}%)でした！あなたは何曲知ってる？`,
    `ボカロビンゴで${props.selectedSongs.length}曲聴いたことある曲がありました！あなたは？`,
    `【${userLevel.value.title}】ボカロビンゴで${completionRate.value}%達成！チャレンジしてみて！`
  ];
  
  // ランダムにテキストを選択
  const text = shareTexts[Math.floor(Math.random() * shareTexts.length)];
  
  const url = encodeURIComponent(window.location.href);
  const hashtags = encodeURIComponent('ボカロビンゴ,ボカロ');
  
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}&hashtags=${hashtags}`, '_blank');
};

// 共有リンクをコピー
const copyShareLink = () => {
  const link = window.location.href;
  navigator.clipboard.writeText(link)
    .then(() => {
      alert('リンクをコピーしました！友達にシェアしよう！');
    })
    .catch(err => {
      console.error('クリップボードへのコピーに失敗しました', err);
    });
};
</script>

<style scoped>
.share-result-container {
  max-width: 600px;
  margin: 0 auto;
}

.result-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0;
  color: #5d4dff;
}

.user-score {
  font-size: 2.5rem;
  font-weight: bold;
  color: #5d4dff;
}

.user-level {
  background-color: #f0f0ff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  text-align: center;
}

.level-title {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #5d4dff;
  margin-bottom: 4px;
}

.era-breakdown {
  margin-bottom: 20px;
}

.era-breakdown h3 {
  font-size: 1.2rem;
  margin-bottom: 10px;
}

.era-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.era-bar-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.era-label {
  width: 80px;
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
}

.era-percentage {
  width: 40px;
  text-align: right;
  font-size: 0.9rem;
}

.most-listened {
  margin-bottom: 20px;
}

.most-listened h3 {
  font-size: 1.2rem;
  margin-bottom: 10px;
}

.vocalist-stats {
  display: flex;
  justify-content: space-around;
}

.vocalist-item {
  text-align: center;
  padding: 8px;
  background-color: #f0f0ff;
  border-radius: 8px;
  min-width: 80px;
}

.vocalist-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.site-link {
  text-align: center;
  font-size: 0.8rem;
  color: #999;
  margin-top: 20px;
}

.share-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.download-btn {
  background-color: #5d4dff;
  color: white;
}

.twitter-btn {
  background-color: #1DA1F2;
  color: white;
}

.copy-btn {
  background-color: #f0f0f0;
  color: #333;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.icon {
  font-size: 1.2rem;
}

@media (max-width: 600px) {
  .result-card {
    padding: 16px;
  }
  
  .user-score {
    font-size: 2rem;
  }
  
  .vocalist-stats {
    flex-direction: column;
    gap: 8px;
  }
}
</style>