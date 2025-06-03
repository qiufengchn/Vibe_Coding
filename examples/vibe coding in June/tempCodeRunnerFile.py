import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset, random_split
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_absolute_percentage_error

print("🔹 使用PyTorch构建机器学习模型")
print("=" * 50)

# 检查PyTorch版本和GPU
print(f"✅ PyTorch 版本: {torch.__version__}")
print(f"✅ 可用GPU: {'可用' if torch.cuda.is_available() else '不可用'}")

# 1. 创建房价预测数据集（回归问题）
print("\n🏠 创建房价预测数据集...")
np.random.seed(42)
n_samples = 2000

# 生成特征数据
house_data = pd.DataFrame({
    '面积': np.random.normal(120, 40, n_samples),  # 平方米
    '房间数': np.random.randint(1, 6, n_samples),   # 房间数量
    '楼层': np.random.randint(1, 31, n_samples),    # 楼层
    '房龄': np.random.randint(0, 30, n_samples),    # 房龄（年）
    '距离地铁': np.random.exponential(2, n_samples),  # 距离地铁站（公里）
    '学区房': np.random.choice([0, 1], n_samples, p=[0.7, 0.3]),  # 是否学区房
    '装修情况': np.random.choice([0, 1, 2], n_samples, p=[0.3, 0.5, 0.2])  # 0简装 1精装 2豪装
})

# 确保数据合理性
house_data['面积'] = np.clip(house_data['面积'], 30, 300)
house_data['距离地铁'] = np.clip(house_data['距离地铁'], 0.1, 10)

# 生成目标变量（房价）- 基于特征的复杂关系
base_price = (
    house_data['面积'] * 500 +                    # 面积影响
    house_data['房间数'] * 15000 +                # 房间数影响
    (31 - house_data['楼层']) * 2000 +            # 楼层影响（高楼层更贵）
    (30 - house_data['房龄']) * 3000 +            # 房龄影响（新房更贵）
    (10 - house_data['距离地铁']) * 8000 +        # 地铁距离影响
    house_data['学区房'] * 200000 +               # 学区房加成
    house_data['装修情况'] * 50000                # 装修情况影响
)

# 添加噪声
noise = np.random.normal(0, 50000, n_samples)
house_data['价格'] = base_price + noise
house_data['价格'] = np.clip(house_data['价格'], 100000, 2000000)  # 限制价格范围

print("数据集基本信息：")
print(house_data.describe())
print(f"\n数据集形状: {house_data.shape}")

# 2. 数据预处理
print("\n🔧 数据预处理...")
X = house_data.drop('价格', axis=1).values
y = house_data['价格'].values.reshape(-1, 1)

# 数据分割
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 特征标准化
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 转换为PyTorch张量
X_train_tensor = torch.tensor(X_train_scaled, dtype=torch.float32)
y_train_tensor = torch.tensor(y_train, dtype=torch.float32)
X_test_tensor = torch.tensor(X_test_scaled, dtype=torch.float32)
y_test_tensor = torch.tensor(y_test, dtype=torch.float32)

# 创建数据集和数据加载器
train_dataset = TensorDataset(X_train_tensor, y_train_tensor)
test_dataset = TensorDataset(X_test_tensor, y_test_tensor)

# 创建验证集
train_size = int(0.8 * len(train_dataset))
val_size = len(train_dataset) - train_size
train_dataset, val_dataset = random_split(train_dataset, [train_size, val_size])

batch_size = 32
train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=batch_size)
test_loader = DataLoader(test_dataset, batch_size=batch_size)

print(f"训练集大小: {len(train_dataset)}")
print(f"验证集大小: {len(val_dataset)}")
print(f"测试集大小: {len(test_dataset)}")

# 3. 构建神经网络模型
print("\n🧠 构建神经网络模型...")

class HousePriceModel(nn.Module):
    def __init__(self, input_size):
        super(HousePriceModel, self).__init__()
        self.network = nn.Sequential(
            nn.Linear(input_size, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )
    
    def forward(self, x):
        return self.network(x)

# 创建模型
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = HousePriceModel(X_train_scaled.shape[1]).to(device)
print("模型结构：")
print(model)

# 定义损失函数和优化器
criterion = nn.MSELoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# 训练模型
print("\n🚀 开始训练模型...")
num_epochs = 100
patience = 10
best_val_loss = float('inf')
counter = 0

# 存储训练历史
history = {
    'train_loss': [],
    'val_loss': [],
    'train_mae': [],
    'val_mae': []
}

for epoch in range(num_epochs):
    # 训练阶段
    model.train()
    train_loss = 0.0
    train_mae = 0.0
    for inputs, targets in train_loader:
        inputs, targets = inputs.to(device), targets.to(device)
        
        # 前向传播
        outputs = model(inputs)
        loss = criterion(outputs, targets)
        
        # 反向传播和优化
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        
        # 计算统计量
        train_loss += loss.item()
        train_mae += torch.mean(torch.abs(outputs - targets)).item()
    
    # 验证阶段
    model.eval()
    val_loss = 0.0
    val_mae = 0.0
    with torch.no_grad():
        for inputs, targets in val_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            outputs = model(inputs)
            
            val_loss += criterion(outputs, targets).item()
            val_mae += torch.mean(torch.abs(outputs - targets)).item()
    
    # 计算平均损失
    train_loss /= len(train_loader)
    val_loss /= len(val_loader)
    train_mae /= len(train_loader)
    val_mae /= len(val_loader)
    
    # 存储历史
    history['train_loss'].append(train_loss)
    history['val_loss'].append(val_loss)
    history['train_mae'].append(train_mae)
    history['val_mae'].append(val_mae)
    
    # 打印进度
    print(f"Epoch [{epoch+1}/{num_epochs}], "
          f"Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}, "
          f"Train MAE: {train_mae:.2f}, Val MAE: {val_mae:.2f}")
    
    # 早停机制
    if val_loss < best_val_loss:
        best_val_loss = val_loss
        counter = 0
        # 保存最佳模型
        torch.save(model.state_dict(), 'best_model.pth')
    else:
        counter += 1
        if counter >= patience:
            print(f"早停在第 {epoch+1} 轮")
            break

# 加载最佳模型
model.load_state_dict(torch.load('best_model.pth'))
model.eval()

# 4. 模型评估
print("\n📊 模型评估...")

# 在测试集上评估
test_loss = 0.0
test_mae = 0.0
all_targets = []
all_predictions = []

with torch.no_grad():
    for inputs, targets in test_loader:
        inputs, targets = inputs.to(device), targets.to(device)
        outputs = model(inputs)
        
        test_loss += criterion(outputs, targets).item()
        test_mae += torch.mean(torch.abs(outputs - targets)).item()
        
        all_targets.append(targets.cpu().numpy())
        all_predictions.append(outputs.cpu().numpy())

# 计算平均损失
test_loss /= len(test_loader)
test_mae /= len(test_loader)

# 合并预测结果
all_targets = np.concatenate(all_targets)
all_predictions = np.concatenate(all_predictions)

# 计算更多指标
r2 = r2_score(all_targets, all_predictions)
mape = mean_absolute_percentage_error(all_targets, all_predictions)

print(f"测试集损失 (MSE): {test_loss:.2f}")
print(f"测试集平均绝对误差 (MAE): {test_mae:.2f}")
print(f"R² 分数: {r2:.4f}")
print(f"平均绝对百分比误差 (MAPE): {mape:.4f}")

# 5. 可视化结果
print("\n📈 结果可视化...")

fig, axes = plt.subplots(2, 2, figsize=(15, 12))
fig.suptitle('🤖 PyTorch房价预测模型分析', fontsize=16, fontweight='bold')

# 子图1：训练历史
axes[0,0].plot(history['train_loss'], label='训练损失', color='blue')
axes[0,0].plot(history['val_loss'], label='验证损失', color='red')
axes[0,0].set_title('📉 模型训练历史', fontsize=12, fontweight='bold')
axes[0,0].set_xlabel('轮次')
axes[0,0].set_ylabel('损失')
axes[0,0].legend()
axes[0,0].grid(True, alpha=0.3)

# 子图2：MAE历史
axes[0,1].plot(history['train_mae'], label='训练MAE', color='green')
axes[0,1].plot(history['val_mae'], label='验证MAE', color='orange')
axes[0,1].set_title('📊 平均绝对误差历史', fontsize=12, fontweight='bold')
axes[0,1].set_xlabel('轮次')
axes[0,1].set_ylabel('MAE')
axes[0,1].legend()
axes[0,1].grid(True, alpha=0.3)

# 子图3：预测vs实际
axes[1,0].scatter(all_targets, all_predictions, alpha=0.6, color='purple')
axes[1,0].plot([all_targets.min(), all_targets.max()], 
              [all_targets.min(), all_targets.max()], 'r--', lw=2)
axes[1,0].set_title('🎯 预测值 vs 实际值', fontsize=12, fontweight='bold')
axes[1,0].set_xlabel('实际房价')
axes[1,0].set_ylabel('预测房价')
axes[1,0].grid(True, alpha=0.3)

# 子图4：残差分布 - 修复错误：确保是一维数组
residuals = (all_targets - all_predictions).flatten()  # 展平数组
axes[1,1].hist(residuals, bins=30, alpha=0.7, color='cyan', edgecolor='black')
axes[1,1].set_title('📊 残差分布', fontsize=12, fontweight='bold')
axes[1,1].set_xlabel('残差')
axes[1,1].set_ylabel('频次')
axes[1,1].grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('pytorch_house_price_analysis.png')
plt.show()

# 6. 特征重要性分析
print("\n🔍 特征重要性分析...")

# 获取第一层权重
first_layer = model.network[0]
weights = first_layer.weight.data.cpu().numpy()
feature_importance = np.abs(weights).mean(axis=0)

feature_names = house_data.drop('价格', axis=1).columns
importance_df = pd.DataFrame({
    '特征': feature_names,
    '重要性': feature_importance
}).sort_values('重要性', ascending=False)

print("特征重要性排序：")
print(importance_df)

# 绘制特征重要性
plt.figure(figsize=(10, 6))
bars = plt.bar(importance_df['特征'], importance_df['重要性'], 
               color='lightblue', alpha=0.8, edgecolor='navy')
plt.title('🎯 特征重要性分析', fontsize=14, fontweight='bold')
plt.xlabel('特征')
plt.ylabel('重要性分数')
plt.xticks(rotation=45)
plt.grid(True, alpha=0.3, axis='y')

# 添加数值标签
for bar, value in zip(bars, importance_df['重要性']):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.001, 
            f'{value:.3f}', ha='center', va='bottom')

plt.tight_layout()
plt.savefig('feature_importance.png')
plt.show()

# 7. 实际预测示例
print("\n🏡 实际预测示例...")

# 创建几个示例房子
sample_houses = pd.DataFrame({
    '面积': [90, 130, 200],
    '房间数': [2, 3, 4],
    '楼层': [15, 8, 3],
    '房龄': [5, 15, 2],
    '距离地铁': [0.8, 2.5, 1.2],
    '学区房': [1, 0, 1],
    '装修情况': [2, 1, 2]
})

# 标准化
sample_scaled = scaler.transform(sample_houses)
sample_tensor = torch.tensor(sample_scaled, dtype=torch.float32).to(device)

# 预测
with torch.no_grad():
    predictions = model(sample_tensor).cpu().numpy().flatten()

print("示例房子预测结果：")
for i, (_, house) in enumerate(sample_houses.iterrows()):
    pred_price = predictions[i]
    print(f"\n房子 {i+1}:")
    print(f"  • 面积: {house['面积']}㎡")
    print(f"  • 房间数: {house['房间数']}室")
    print(f"  • 楼层: {house['楼层']}层")
    print(f"  • 房龄: {house['房龄']}年")
    print(f"  • 距离地铁: {house['距离地铁']:.1f}km")
    print(f"  • 学区房: {'是' if house['学区房'] else '否'}")
    print(f"  • 装修: {['简装', '精装', '豪装'][house['装修情况']]}")
    print(f"  🏷️ 预测价格: ¥{pred_price:,.0f}")

print("\n✅ PyTorch机器学习示例完成！")
