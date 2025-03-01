<template>
  <div class="achievements-container">
    <h2 class="achievements-title">獲得した実績</h2>
    
    <div class="achievements-grid">
      <div 
        v-for="achievement in achievements" 
        :key="achievement.id"
        class="achievement-card"
        :class="{ unlocked: achievement.unlocked }"
      >
        <div class="achievement-icon">{{ achievement.icon }}</div>
        <div class="achievement-info">
          <div class="achievement-title">{{ achievement.title }}</div>
          <div class="achievement-description">{{ achievement.description }}</div>
          
          <div v-if="achievement.progress !== undefined && achievement.maxProgress !== undefined" class="achievement-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }"
              ></div>
            </div>
            <div class="progress-text">{{ achievement.progress }}/{{ achievement.maxProgress }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { Achievement } from '../utils/achievements';

const props = defineProps<{
  achievements: Achievement[];
}>();
</script>

<style scoped>
.achievements-container {
  margin-top: 30px;
}

.achievements-title {
  text-align: center;
  margin-bottom: 20px;
  color: #5d4dff;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

.achievement-card {
  display: flex;
  padding: 15px;
  border-radius: 10px;
  background-color: #f0f0f0;
  opacity: 0.7;
  transition: all 0.3s;
}

.achievement-card.unlocked {
  background-color: #f0f8ff;
  border: 1px solid #b5eaff;
  box-shadow: 0 4px 8px rgba(93, 77, 255, 0.1);
  opacity: 1;
}

.achievement-icon {
  font-size: 2rem;
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.achievement-info {
  flex: 1;
}

.achievement-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.achievement-description {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 8px;
}

.achievement-progress {
  margin-top: 8px;
}

.progress-bar {
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-fill {
  height: 100%;
  background-color: #5d4dff;
  border-radius: 4px;
}

.progress-text {
  font-size: 0.8rem;
  text-align: right;
  color: #666;
}

@media (max-width: 600px) {
  .achievements-grid {
    grid-template-columns: 1fr;
  }
}
</style>