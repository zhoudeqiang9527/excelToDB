from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
import os
import pandas as pd
import json
from werkzeug.utils import secure_filename
from datetime import datetime
import re

# Flask应用配置
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# 数据库配置 (需要根据实际情况修改)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://username:password@localhost/table_control'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# 允许的文件扩展名
ALLOWED_EXTENSIONS = {'xlsx'}

# 检查文件扩展名
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 主页路由
@app.route('/')
def index():
    """主页面"""
    return render_template('index.html')

# Excel上传页面
@app.route('/upload')
def upload_excel():
    """Excel上传页面"""
    return render_template('upload.html')

# 处理Excel上传
@app.route('/upload', methods=['POST'])
def handle_upload():
    """处理Excel文件上传"""
    if 'file' not in request.files:
        return jsonify({'error': '没有选择文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # 读取Excel文件的sheet信息
        try:
            excel_file = pd.ExcelFile(filepath)
            sheets = excel_file.sheet_names
            
            return jsonify({
                'success': True,
                'filename': filename,
                'sheets': sheets
            })
        except Exception as e:
            return jsonify({'error': f'读取Excel文件失败: {str(e)}'}), 500
    else:
        return jsonify({'error': '只支持.xlsx格式的文件'}), 400

# 处理Excel数据导入
@app.route('/import_excel', methods=['POST'])
def import_excel():
    """将Excel数据导入数据库"""
    data = request.get_json()
    
    filename = data.get('filename')
    sheet_configs = data.get('sheet_configs', [])
    
    if not filename:
        return jsonify({'error': '文件名不能为空'}), 400
    
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(filepath):
        return jsonify({'error': '文件不存在'}), 400
    
    try:
        # 读取Excel文件
        excel_file = pd.ExcelFile(filepath)
        
        # 处理每个sheet
        results = []
        for config in sheet_configs:
            sheet_name = config.get('sheet_name')
            table_name = config.get('table_name')
            start_row = config.get('start_row', 1)
            
            if sheet_name not in excel_file.sheet_names:
                results.append({
                    'sheet_name': sheet_name,
                    'status': 'error',
                    'message': 'Sheet不存在'
                })
                continue
            
            # 读取sheet数据
            df = pd.read_excel(filepath, sheet_name=sheet_name, header=start_row-1)
            
            # 清理列名
            df.columns = [col.strip().replace(' ', '_').replace('-', '_').lower() for col in df.columns]
            
            # 将数据导入数据库（这里只是示例，实际应根据具体需求创建表）
            # 在实际应用中，你需要根据DataFrame的结构动态创建表
            results.append({
                'sheet_name': sheet_name,
                'table_name': table_name,
                'status': 'success',
                'rows': len(df),
                'columns': len(df.columns)
            })
        
        return jsonify({
            'success': True,
            'results': results
        })
    except Exception as e:
        return jsonify({'error': f'导入数据失败: {str(e)}'}), 500

# 字段抽取页面
@app.route('/extract')
def extract_table():
    """字段抽取页面"""
    return render_template('extract.html')

# 获取表列表
@app.route('/api/tables')
def get_tables():
    """获取数据库中的表列表"""
    # 这里应该查询数据库获取真实的表列表
    # 示例数据
    tables = [
        {'name': 'users', 'type': 'custom'},
        {'name': 'products', 'type': 'custom'},
        {'name': 'orders', 'type': 'excel'},
        {'name': 'customers', 'type': 'excel'}
    ]
    return jsonify(tables)

# 获取表字段
@app.route('/api/table/<table_name>/columns')
def get_table_columns(table_name):
    """获取指定表的字段列表"""
    # 这里应该查询数据库获取真实的字段列表
    # 根据表名返回不同的示例数据
    columns = []
    if table_name == 'users':
        columns = ['id', 'name', 'email', 'age', 'created_at']
    elif table_name == 'products':
        columns = ['id', 'name', 'price', 'category', 'stock']
    elif table_name == 'orders':
        columns = ['id', 'user_id', 'product_id', 'quantity', 'order_date']
    elif table_name == 'customers':
        columns = ['id', 'company', 'contact', 'address', 'phone']
    else:
        columns = ['id', 'name', 'description']
    
    return jsonify(columns)

# 执行字段抽取
@app.route('/extract', methods=['POST'])
def execute_extract():
    """执行字段抽取并创建新表"""
    data = request.get_json()
    
    source_table = data.get('source_table')
    fields = data.get('fields', [])
    filter_rules = data.get('filter_rules', [])
    new_table_name = data.get('new_table_name')
    
    if not source_table:
        return jsonify({'error': '源表不能为空'}), 400
    
    if not fields:
        return jsonify({'error': '至少选择一个字段'}), 400
    
    if not new_table_name:
        return jsonify({'error': '新表名不能为空'}), 400
    
    # 构造新表名（加上前缀和时间戳）
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    full_table_name = f'extract_{new_table_name}_{timestamp}'
    
    # 构造SQL查询语句（示例）
    fields_str = ', '.join(fields)
    sql_query = f"SELECT {fields_str} FROM {source_table}"
    
    # 添加过滤条件
    if filter_rules:
        where_conditions = []
        for rule in filter_rules:
            field = rule.get('field')
            operator = rule.get('operator')
            value = rule.get('value')
            
            if operator == 'like':
                where_conditions.append(f"{field} LIKE '%{value}%'")
            else:
                where_conditions.append(f"{field} {operator} '{value}'")
        
        if where_conditions:
            sql_query += f" WHERE {' AND '.join(where_conditions)}"
    
    # 在实际应用中，这里应该执行SQL查询并将结果存储到新表中
    # 由于这是示例，我们只返回构造的SQL语句
    
    return jsonify({
        'success': True,
        'new_table_name': full_table_name,
        'sql_query': sql_query,
        'message': f'成功创建新表 {full_table_name}'
    })

# SQL执行页面
@app.route('/sql')
def execute_sql():
    """SQL执行页面"""
    return render_template('sql.html')

# 执行SQL语句
@app.route('/sql/execute', methods=['POST'])
def execute_sql_query():
    """执行SQL查询"""
    data = request.get_json()
    sql_query = data.get('sql', '').strip()
    
    if not sql_query:
        return jsonify({'error': 'SQL语句不能为空'}), 400
    
    # 检查SQL语句类型
    upper_sql = sql_query.upper()
    
    # 简单的SQL注入防护（示例）
    if any(keyword in upper_sql for keyword in ['DROP', 'DELETE', 'UPDATE']):
        # 检查是否是来自Excel导入的表，这些表不允许UPDATE/DELETE操作
        # 这里简化处理，实际应用中需要更复杂的检查逻辑
        if 'FROM' in upper_sql:
            # 进一步检查表名...
            pass
    
    # 根据SQL类型执行不同操作
    if upper_sql.startswith('SELECT'):
        # 执行SELECT查询
        # 示例数据
        result_data = {
            'columns': ['ID', '姓名', '邮箱', '年龄', '创建时间'],
            'rows': [
                [1, '张三', 'zhangsan@example.com', 25, '2023-01-15 10:30:00'],
                [2, '李四', 'lisi@example.com', 30, '2023-01-16 14:20:00'],
                [3, '王五', 'wangwu@example.com', 28, '2023-01-17 09:15:00'],
                [4, '赵六', 'zhaoliu@example.com', 35, '2023-01-18 16:45:00'],
                [5, '钱七', 'qianqi@example.com', 27, '2023-01-19 11:30:00']
            ],
            'row_count': 5
        }
        
        return jsonify({
            'success': True,
            'type': 'select',
            'data': result_data,
            'message': '查询执行成功'
        })
    
    elif upper_sql.startswith('INSERT'):
        # 执行INSERT语句
        return jsonify({
            'success': True,
            'type': 'insert',
            'affected_rows': 1,
            'message': '数据插入成功'
        })
    
    elif upper_sql.startswith('CREATE TABLE'):
        # 执行CREATE TABLE语句
        return jsonify({
            'success': True,
            'type': 'create',
            'message': '表创建成功'
        })
    
    else:
        return jsonify({'error': '只支持 SELECT, INSERT, CREATE TABLE 语句'}), 400

# 将SQL结果保存为新表
@app.route('/sql/save_result', methods=['POST'])
def save_sql_result():
    """将SQL查询结果保存为新表"""
    data = request.get_json()
    
    original_sql = data.get('original_sql', '')
    new_table_name = data.get('new_table_name', '')
    
    if not new_table_name:
        return jsonify({'error': '新表名不能为空'}), 400
    
    # 构造新表名（加上前缀和时间戳）
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    full_table_name = f'sql_result_{new_table_name}_{timestamp}'
    
    # 在实际应用中，这里应该执行CREATE TABLE AS SELECT操作
    # 由于这是示例，我们只返回构造的表名
    
    return jsonify({
        'success': True,
        'new_table_name': full_table_name,
        'message': f'结果已保存到新表 {full_table_name}'
    })

if __name__ == '__main__':
    app.run(debug=True)