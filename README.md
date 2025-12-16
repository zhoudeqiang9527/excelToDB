# Table Control System

一个基于Flask的数据管理系统，支持Excel导入、数据查询和SQL执行等功能。

## 功能特性

1. **Excel上传与表转换**
   - 支持拖拽上传.xlsx文件
   - 可配置每个sheet的表名和起始行
   - 将Excel数据导入到数据库表中

2. **字段抽取**
   - 从现有表中选择特定字段
   - 应用自定义过滤规则
   - 创建新的数据表

3. **SQL执行**
   - 执行SELECT、INSERT、CREATE TABLE语句
   - 查看执行结果
   - 将结果保存为新表

## 技术栈

- Flask - Web框架
- SQLAlchemy - ORM工具
- Bootstrap 5 - 前端UI框架
- Pandas - 数据处理
- OpenPyXL - Excel文件处理
- MySQL - 数据库

## 安装与运行

1. 克隆项目代码

2. 安装依赖（使用uv）
   ```
   uv pip install -r requirements.txt
   ```

3. 配置数据库
   在[main.py](file:///c%3A/py_uv_pro/flaskpro/main.py#L1-L153)中修改数据库连接字符串：
   ```python
   app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://username:password@localhost/table_control'
   ```

4. 运行应用
   ```
   python main.py
   ```

5. 访问应用
   打开浏览器访问 http://localhost:5000

## 目录结构

```
table_control/
├── main.py              # Flask应用入口
├── templates/           # HTML模板
│   ├── base.html        # 基础模板
│   ├── index.html       # 首页
│   ├── upload.html      # Excel上传页面
│   ├── extract.html     # 字段抽取页面
│   └── sql.html         # SQL执行页面
├── static/              # 静态资源
│   ├── css/
│   │   └── style.css    # 自定义样式
│   └── js/              # JavaScript文件
│       ├── upload.js    # 上传页面脚本
│       ├── extract.js   # 抽取页面脚本
│       └── sql.js       # SQL页面脚本
├── uploads/             # 上传文件目录
├── requirements.txt     # 依赖包列表
├── work.md              # 项目规划文档
└── README.md            # 说明文档
```

## 使用说明

### Excel上传
1. 访问Excel上传页面
2. 选择或拖拽.xlsx文件
3. 配置每个sheet的表名和起始行
4. 点击"处理数据"导入到数据库

### 字段抽取
1. 访问字段抽取页面
2. 选择源表
3. 选择需要的字段
4. 设置过滤规则（可选）
5. 输入新表名
6. 点击"创建新表"

### SQL执行
1. 访问SQL执行页面
2. 输入SQL语句（支持SELECT、INSERT、CREATE TABLE）
3. 点击"执行"
4. 查看执行结果
5. 如需保存结果，点击"存为新表"

## 注意事项

- 上传的Excel文件最大支持50MB
- 仅支持.xlsx格式文件
- 从Excel导入的表不支持UPDATE和DELETE操作
- 新创建的表支持完整的SQL操作
- 使用uv进行包管理，不使用系统自带Python环境