$(document).ready(function() {
    const sqlForm = $('#sqlForm');
    const sqlEditor = $('#sqlEditor');
    const resultCard = $('#resultCard');
    const resultInfo = $('#resultInfo');
    const resultTableContainer = $('#resultTableContainer');
    const saveResultBtn = $('#saveResultBtn');
    const executeBtn = $('#executeBtn');
    const clearBtn = $('#clearBtn');
    
    let lastExecutedSql = '';
    
    // 清空按钮事件
    clearBtn.on('click', function() {
        sqlEditor.val('');
        resultCard.addClass('d-none');
    });
    
    // 表单提交事件
    sqlForm.on('submit', function(e) {
        e.preventDefault();
        
        const sql = sqlEditor.val().trim();
        if (!sql) {
            alert('请输入SQL语句');
            return;
        }
        
        // 禁用执行按钮并显示加载状态
        executeBtn.prop('disabled', true).text('执行中...');
        
        // 发送SQL执行请求
        $.ajax({
            url: '/sql/execute',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({sql: sql}),
            success: function(response) {
                if (response.success) {
                    lastExecutedSql = sql;
                    showResult(response);
                } else {
                    showError(response.error);
                }
            },
            error: function(xhr, status, error) {
                showError('执行失败: ' + error);
            },
            complete: function() {
                // 恢复执行按钮
                executeBtn.prop('disabled', false).text('执行');
            }
        });
    });
    
    // 显示执行结果
    function showResult(result) {
        // 显示结果卡片
        resultCard.removeClass('d-none');
        
        if (result.type === 'select') {
            showSelectResult(result);
        } else if (result.type === 'insert') {
            showInsertResult(result);
        } else if (result.type === 'create') {
            showCreateResult(result);
        }
    }
    
    // 显示错误信息
    function showError(message) {
        resultCard.removeClass('d-none');
        resultInfo.html(`
            <div class="alert alert-danger">
                <strong>执行失败!</strong> ${message}
            </div>
        `);
        resultTableContainer.html('');
        saveResultBtn.addClass('d-none');
    }
    
    // 显示SELECT结果
    function showSelectResult(result) {
        const data = result.data;
        
        resultInfo.html(`
            <div class="alert alert-success">
                <strong>执行成功!</strong> 查询返回 ${data.row_count} 行数据
            </div>
        `);
        
        // 显示保存按钮
        saveResultBtn.removeClass('d-none');
        
        // 生成表格数据
        let tableHtml = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
        `;
        
        // 添加表头
        data.columns.forEach(column => {
            tableHtml += `<th>${column}</th>`;
        });
        
        tableHtml += `
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // 添加数据行
        data.rows.forEach(row => {
            tableHtml += '<tr>';
            row.forEach(cell => {
                tableHtml += `<td>${cell}</td>`;
            });
            tableHtml += '</tr>';
        });
        
        tableHtml += `
                    </tbody>
                </table>
            </div>
        `;
        
        resultTableContainer.html(tableHtml);
    }
    
    // 显示INSERT结果
    function showInsertResult(result) {
        resultInfo.html(`
            <div class="alert alert-success">
                <strong>执行成功!</strong> 成功插入 ${result.affected_rows} 行数据
            </div>
        `);
        
        // 隐藏保存按钮
        saveResultBtn.addClass('d-none');
        resultTableContainer.html('');
    }
    
    // 显示CREATE TABLE结果
    function showCreateResult(result) {
        resultInfo.html(`
            <div class="alert alert-success">
                <strong>执行成功!</strong> ${result.message}
            </div>
        `);
        
        // 隐藏保存按钮
        saveResultBtn.addClass('d-none');
        resultTableContainer.html('');
    }
    
    // 保存结果按钮事件
    saveResultBtn.on('click', function() {
        const tableName = prompt('请输入新表名:');
        if (tableName) {
            // 发送保存请求
            $.ajax({
                url: '/sql/save_result',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    original_sql: lastExecutedSql,
                    new_table_name: tableName
                }),
                success: function(response) {
                    if (response.success) {
                        alert(response.message);
                    } else {
                        alert('保存失败: ' + response.error);
                    }
                },
                error: function(xhr, status, error) {
                    alert('保存失败: ' + error);
                }
            });
        }
    });
});