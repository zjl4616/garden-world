// 花园世界游戏 - 主逻辑
class GardenWorldGame {
    constructor() {
        this.coins = 100;
        this.level = 1;
        this.experience = 0;
        this.gardenSize = 25; // 5x5网格
        this.gardenPlots = [];
        this.selectedSeed = null;
        this.currentModalPlant = null;
        
        // 种子数据
        this.seeds = [
            { id: 1, name: '向日葵', price: 10, icon: '🌻', growthTime: 60, value: 20, level: 1, color: '#f6e05e', description: '面向太阳的快乐花朵' },
            { id: 2, name: '胡萝卜', price: 15, icon: '🥕', growthTime: 90, value: 30, level: 1, color: '#ed8936', description: '美味又营养的根茎蔬菜' },
            { id: 3, name: '玫瑰', price: 25, icon: '🌹', growthTime: 120, value: 50, level: 2, color: '#f56565', description: '象征爱情的花朵' },
            { id: 4, name: '苹果树', price: 50, icon: '🍎', growthTime: 180, value: 100, level: 3, color: '#68d391', description: '能结出甜美果实的树木' },
            { id: 5, name: '仙人掌', price: 30, icon: '🌵', growthTime: 150, value: 60, level: 2, color: '#48bb78', description: '耐旱的多肉植物' }
        ];
        
        // 植物生长阶段
        this.growthStages = ['幼苗', '成长', '成熟', '可收获'];
        
        this.init();
    }
    
    init() {
        this.loadGame();
        this.renderGarden();
        this.renderShop();
        this.setupEventListeners();
        this.updateUI();
        this.showStatus('欢迎来到花园世界！点击空地开始种植吧~');
    }
    
    // 渲染花园网格
    renderGarden() {
        const gardenGrid = document.getElementById('gardenGrid');
        gardenGrid.innerHTML = '';
        
        for (let i = 0; i < this.gardenSize; i++) {
            const plot = document.createElement('div');
            plot.className = 'garden-plot empty';
            plot.dataset.index = i;
            
            const plotData = this.gardenPlots[i] || { planted: false };
            
            if (plotData.planted) {
                plot.className = 'garden-plot planted';
                const plantIcon = document.createElement('div');
                plantIcon.className = 'plant-icon';
                plantIcon.textContent = plotData.icon;
                plantIcon.style.color = plotData.color;
                
                // 生长进度条
                const progressContainer = document.createElement('div');
                progressContainer.className = 'plant-progress';
                const progressBar = document.createElement('div');
                progressBar.className = 'plant-progress-bar';
                const growthPercent = (Date.now() - plotData.plantedAt) / (plotData.growthTime * 1000) * 100;
                progressBar.style.width = Math.min(growthPercent, 100) + '%';
                
                progressContainer.appendChild(progressBar);
                plot.appendChild(plantIcon);
                plot.appendChild(progressContainer);
            } else {
                plot.textContent = '🌱';
            }
            
            plot.addEventListener('click', () => this.handlePlotClick(i));
            gardenGrid.appendChild(plot);
        }
    }
    
    // 渲染商店
    renderShop() {
        const seedList = document.getElementById('seedList');
        seedList.innerHTML = '';
        
        this.seeds.forEach(seed => {
            const seedItem = document.createElement('div');
            seedItem.className = `seed-item ${this.level >= seed.level ? '' : 'unavailable'}`;
            seedItem.dataset.seedId = seed.id;
            
            seedItem.innerHTML = `
                <div class="seed-icon">${seed.icon}</div>
                <div class="seed-name">${seed.name}</div>
                <div class="seed-price">${seed.price}金币</div>
                <div class="seed-level">等级 ${seed.level}</div>
            `;
            
            if (this.level >= seed.level) {
                seedItem.addEventListener('click', () => this.selectSeed(seed));
            }
            
            seedList.appendChild(seedItem);
        });
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 工具按钮
        document.getElementById('waterAll').addEventListener('click', () => this.waterAllPlants());
        document.getElementById('harvestAll').addEventListener('click', () => this.harvestAllPlants());
        document.getElementById('clearAll').addEventListener('click', () => this.clearAllEmptyPlots());
        
        // 操作按钮
        document.getElementById('saveGame').addEventListener('click', () => this.saveGame());
        document.getElementById('loadGame').addEventListener('click', () => this.loadGame(true));
        document.getElementById('resetGame').addEventListener('click', () => this.resetGame());
        
        // 模态框
        const modal = document.getElementById('plantModal');
        const closeBtn = document.querySelector('.close');
        
        closeBtn.addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                this.closeModal();
            }
        });
        
        // 植物操作按钮
        document.getElementById('waterPlant').addEventListener('click', () => this.waterCurrentPlant());
        document.getElementById('harvestPlant').addEventListener('click', () => this.harvestCurrentPlant());
        document.getElementById('removePlant').addEventListener('click', () => this.removeCurrentPlant());
        
        // 自动保存
        setInterval(() => this.autoSave(), 30000); // 每30秒自动保存
        setInterval(() => this.checkPlantGrowth(), 1000); // 每秒检查植物生长
    }
    
    // 处理花园格子点击
    handlePlotClick(index) {
        const plot = this.gardenPlots[index];
        
        if (plot && plot.planted) {
            // 显示植物详情
            this.showPlantModal(index);
        } else if (this.selectedSeed) {
            // 种植植物
            this.plantSeed(index);
        } else {
            this.showStatus('请先选择一种种子进行种植！', 'warning');
        }
    }
    
    // 选择种子
    selectSeed(seed) {
        if (this.coins < seed.price) {
            this.showStatus(`金币不足！需要${seed.price}金币，你只有${this.coins}金币`, 'error');
            return;
        }
        
        this.selectedSeed = seed;
        this.showStatus(`已选择${seed.name}种子，点击空地种植`);
        
        // 视觉反馈
        const seedItems = document.querySelectorAll('.seed-item');
        seedItems.forEach(item => {
            item.classList.remove('selected');
            if (parseInt(item.dataset.seedId) === seed.id) {
                item.classList.add('selected');
                item.style.borderColor = seed.color;
            }
        });
    }
    
    // 种植种子
    plantSeed(index) {
        if (!this.selectedSeed) return;
        
        if (this.gardenPlots[index] && this.gardenPlots[index].planted) {
            this.showStatus('这个位置已经有植物了！', 'warning');
            return;
        }
        
        // 扣除金币
        this.coins -= this.selectedSeed.price;
        
        // 创建植物数据
        this.gardenPlots[index] = {
            planted: true,
            seedId: this.selectedSeed.id,
            name: this.selectedSeed.name,
            icon: this.selectedSeed.icon,
            color: this.selectedSeed.color,
            plantedAt: Date.now(),
            growthTime: this.selectedSeed.growthTime,
            value: this.selectedSeed.value,
            stage: 0,
            watered: false
        };
        
        // 增加经验
        this.addExperience(5);
        
        this.showStatus(`成功种植了${this.selectedSeed.name}！花费${this.selectedSeed.price}金币`);
        this.selectedSeed = null;
        
        // 更新UI
        this.renderGarden();
        this.updateUI();
        
        // 清除种子选择状态
        document.querySelectorAll('.seed-item').forEach(item => {
            item.classList.remove('selected');
            item.style.borderColor = '';
        });
    }
    
    // 显示植物详情模态框
    showPlantModal(index) {
        const plant = this.gardenPlots[index];
        if (!plant) return;
        
        this.currentModalPlant = index;
        
        // 计算生长进度
        const growthTime = (Date.now() - plant.plantedAt) / 1000;
        const growthPercent = Math.min(growthTime / plant.growthTime * 100, 100);
        const stageIndex = Math.min(Math.floor(growthPercent / 25), 3);
        
        // 更新模态框内容
        document.getElementById('plantName').textContent = plant.name;
        document.getElementById('plantIcon').textContent = plant.icon;
        document.getElementById('plantIcon').style.color = plant.color;
        document.getElementById('plantStage').textContent = this.growthStages[stageIndex];
        document.getElementById('plantTime').textContent = this.formatTime(plant.growthTime - growthTime);
        document.getElementById('plantValue').textContent = `${plant.value}金币`;
        document.getElementById('plantDesc').textContent = this.seeds.find(s => s.id === plant.seedId).description;
        
        // 显示模态框
        document.getElementById('plantModal').style.display = 'block';
    }
    
    // 浇水当前植物
    waterCurrentPlant() {
        if (this.currentModalPlant === null) return;
        
        const plant = this.gardenPlots[this.currentModalPlant];
        if (!plant || !plant.planted) return;
        
        if (plant.watered) {
            this.showStatus('这个植物已经浇过水了！', 'warning');
            return;
        }
        
        plant.watered = true;
        plant.growthTime *= 0.8; // 浇水加速20%
        
        this.showStatus(`成功给${plant.name}浇水！生长速度加快了`);
        this.closeModal();
        this.renderGarden();
    }
    
    // 收获当前植物
    harvestCurrentPlant() {
        if (this.currentModalPlant === null) return;
        
        const plant = this.gardenPlots[this.currentModalPlant];
        if (!plant || !plant.planted) return;
        
        // 检查是否成熟
        const growthTime = (Date.now() - plant.plantedAt) / 1000;
        if (growthTime < plant.growthTime) {
            this.showStatus('植物还未成熟，无法收获！', 'warning');
            return;
        }
        
        // 收获植物
        this.coins += plant.value;
        this.addExperience(10);
        
        this.showStatus(`收获${plant.name}！获得${plant.value}金币`);
        
        // 移除植物
        this.gardenPlots[this.currentModalPlant] = { planted: false };
        
        this.closeModal();
        this.renderGarden();
        this.updateUI();
    }
    
    // 移除当前植物
    removeCurrentPlant() {
        if (this.currentModalPlant === null) return;
        
        const plant = this.gardenPlots[this.currentModalPlant];
        if (!plant || !plant.planted) return;
        
        if (confirm(`确定要移除${plant.name}吗？`)) {
            this.gardenPlots[this.currentModalPlant] = { planted: false };
            this.showStatus(`移除了${plant.name}`);
            this.closeModal();
            this.renderGarden();
        }
    }
    
    // 关闭模态框
    closeModal() {
        document.getElementById('plantModal').style.display = 'none';
        this.currentModalPlant = null;
    }
    
    // 给所有植物浇水
    waterAllPlants() {
        let wateredCount = 0;
        
        this.gardenPlots.forEach((plot, index) => {
            if (plot && plot.planted && !plot.watered) {
                plot.watered = true;
                plot.growthTime *= 0.8;
                wateredCount++;
            }
        });
        
        if (wateredCount > 0) {
            this.showStatus(`成功给${wateredCount}棵植物浇水！`);
            this.renderGarden();
        } else {
            this.showStatus('没有需要浇水的植物', 'info');
        }
    }
    
    // 收获所有成熟植物
    harvestAllPlants() {
        let harvestedCount = 0;
        let totalCoins = 0;
        
        this.gardenPlots.forEach((plot, index) => {
            if (plot && plot.planted) {
                const growthTime = (Date.now() - plot.plantedAt) / 1000;
                if (growthTime >= plot.growthTime) {
                    this.coins += plot.value;
                    totalCoins += plot.value;
                    this.addExperience(10);
                    this.gardenPlots[index] = { planted: false };
                    harvestedCount++;
                }
            }
        });
        
        if (harvestedCount > 0) {
            this.showStatus(`收获${harvestedCount}棵植物！获得${totalCoins}金币`);
            this.renderGarden();
            this.updateUI();
        } else {
            this.showStatus('没有可以收获的植物', 'info');
        }
    }
    
    // 清除所有空地
    clearAllEmptyPlots() {
        let clearedCount = 0;
        
        this.gardenPlots.forEach((plot, index) => {
            if (!plot || !plot.planted) {
                this.gardenPlots[index] = { planted: false };
                clearedCount++;
            }
        });
        
        if (clearedCount > 0) {
            this.showStatus(`清理了${clearedCount}块空地`);
            this.renderGarden();
        } else {
            this.showStatus('没有需要清理的空地', 'info');
        }
    }
    
    // 检查植物生长
    checkPlantGrowth() {
        let needsUpdate = false;
        
        this.gardenPlots.forEach((plot, index) => {
            if (plot && plot.planted) {
                const growthTime = (Date.now() - plot.plantedAt) / 1000;
                if (growthTime >= plot.growthTime) {
                    // 植物成熟，闪烁提示
                    const plotElement = document.querySelector(`.garden-plot[data-index="${index}"]`);
                    if (plotElement) {
                        plotElement.classList.add('pulse');
                        setTimeout(() => plotElement.classList.remove('pulse'), 500);
                    }
                    needsUpdate = true;
                }
            }
        });
        
        if (needsUpdate) {
            this.renderGarden();
        }
    }
    
    // 增加经验
    addExperience(amount) {
        this.experience += amount;
        const requiredExp = this.level * 100;
        
        if (this.experience >= requiredExp) {
            this.level++;
            this.experience -= requiredExp;
            this.showStatus(`恭喜升级到${this.level}级！`, 'success');
        }
        
        this.updateUI();
    }
    
    // 更新UI
    updateUI() {
        document.getElementById('coins').textContent = this.coins;
        document.getElementById('level').textContent = this.level;
    }
    
    // 显示状态消息
    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('statusMessage');
        statusElement.textContent = message;
        
        // 根据类型添加样式
        statusElement.className = '';
        if (type === 'error') {
            statusElement.style.backgroundColor = '#fed7d7';
            statusElement.style.color = '#c53030';
        } else if (type === 'warning') {
            statusElement.style.backgroundColor = '#feebc8';
            statusElement.style.color = '#c05621';
        } else if (type === 'success') {
            statusElement.style.backgroundColor = '#c6f6d5';
            statusElement.style.color = '#276749';
        } else {
            statusElement.style.backgroundColor = '#edf2f7';
            statusElement.style.color = '#2d3748';
        }
        
        // 添加动画
        statusElement.classList.add('shake');
        setTimeout(() => statusElement.classList.remove('shake'), 500);
    }
    
    // 格式化时间
    formatTime(seconds) {
        if (seconds <= 0) return '已成熟';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        if (minutes > 0) {
            return `${minutes}分${remainingSeconds}秒`;
        } else {
            return `${remainingSeconds}秒`;
        }
    }
    
    // 保存游戏
    saveGame() {
        const saveData = {
            coins: this.coins,
            level: this.level,
            experience: this.experience,
            gardenPlots: this.gardenPlots,
            timestamp: Date.now()
        };
        
        localStorage.setItem('gardenWorldSave', JSON.stringify(saveData));
        this.showStatus('游戏已保存！', 'success');
    }
    
    // 加载游戏
    loadGame(showMessage = false) {
        const saveData = localStorage.getItem('gardenWorldSave');
        
        if (saveData) {
            try {
                const data = JSON.parse(saveData);
                this.coins = data.coins || 100;
                this.level = data.level || 1;
                this.experience = data.experience || 0;
                this.gardenPlots = data.gardenPlots || [];
                
                // 恢复种植时间
                const now = Date.now();
                this.gardenPlots.forEach(plot => {
                    if (plot && plot.planted && plot.plantedAt) {
                        // 如果植物已经过期，设置为成熟状态
                        const elapsed = now - plot.plantedAt;
                        if (elapsed > plot.growthTime * 1000) {
                            plot.plantedAt = now - plot.growthTime * 1000;
                        }
                    }
                });
                
                if (showMessage) {
                    this.showStatus('游戏已加载！', 'success');
                }
            } catch (error) {
                console.error('加载游戏失败:', error);
                if (showMessage) {
                    this.showStatus('加载游戏失败，使用新游戏', 'error');
                }
            }
        }
        
        this.renderGarden();
        this.updateUI();
    }
    
    // 自动保存
    autoSave() {
        this.saveGame();
    }
    
    // 重置游戏
    resetGame() {
        if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
            this.coins = 100;
            this.level = 1;
            this.experience = 0;
            this.gardenPlots = [];
            this.selectedSeed = null;
            this.currentModalPlant = null;
            
            localStorage.removeItem('gardenWorldSave');
            
            this.showStatus('游戏已重置！', 'success');
            this.renderGarden();
            this.renderShop();
            this.updateUI();
        }
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new GardenWorldGame();
    
    // 添加到全局，方便调试
    window.gardenGame = game;
    
    // PWA 支持
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('Service Worker 注册失败:', error);
        });
    }
});