$(document).ready(function() {
    const sourceTableSelect = $('#sourceTable');
    const fieldCheckboxes = $('#fieldCheckboxes');
    const filterRules = $('#filterRules');
    const extractForm = $('#extractForm');
    const fieldSelects = $('.field-select');
    
    // 页面加载时获取表列表
    loadTableList();
    
    // 加载表列表
    function loadTableList() {
        $.ajax({
            url: '/api/tables',
            type: 'GET',
            success: function(tables) {
                sourceTableSelect.empty();
                sourceTableSelect.append('<option value="">请选择源表</option>');
                
                tables.forEach(table => {
                    sourceTableSelect.append(`<option value="${table.name}">${table.name}</option>`);
                });
            },
            error: function(xhr, status, error) {
                console.error('加载表列表失败:', error);
                // 使用示例数据
                const tables = ['users', 'products', 'orders', 'customers'];
                tables.forEach(table => {
                    sourceTableSelect.append(`<option value="${table}">${table}</option>`);
                });
            }
        });
    }
    
    // 源表选择变化事件
    sourceTableSelect.on('change', function() {
        const tableName = $(this).val();
        if (tableName) {
            loadTableFields(tableName);
            updateFieldSelects(tableName);
        } else {
            fieldCheckboxes.html('<p class="text-muted">请先选择源表以加载字段列表</p>');
        }
    });
    
    // 加载表字段
    function loadTableFields(tableName) {
        $.ajax({
            url: `/api/table/${tableName}/columns`,
            type: 'GET',
            success: function(fields) {
                let checkboxesHtml = '';
                fields.forEach(field => {
                    checkboxesHtml += `
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" name="fields[]" value="${field}" id="field_${field}">
                            <label class="form-check-label" for="field_${field}">${field}</label>
                        </div>
                    `;
                });
                
                fieldCheckboxes.html(checkboxesHtml);
            },
            error: function(xhr, status, error) {
                console.error('加载字段列表失败:', error);
                // 使用示例数据
                let fields = [];
                switch(tableName) {
                    case 'users':
                        fields = ['id', 'name', 'email', 'age', 'created_at'];
                        break;
                    case 'products':
                        fields = ['id', 'name', 'price', 'category', 'stock'];
                        break;
                    case 'orders':
                        fields = ['id', 'user_id', 'product_id', 'quantity', 'order_date'];
                        break;
                    case 'customers':
                        fields = ['id', 'company', 'contact', 'address', 'phone'];
                        break;
                    default:
                        fields = ['id', 'name', 'description'];
                }
                
                let checkboxesHtml = '';
                fields.forEach(field => {
                    checkboxesHtml += `
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" name="fields[]" value="${field}" id="field_${field}">
                            <label class="form-check-label" for="field_${field}">${field}</label>
                        </div>
                    `;
                });
                
                fieldCheckboxes.html(checkboxesHtml);
            }
        });
    }
    
    // 更新过滤规则中的字段选择器
    function updateFieldSelects(tableName) {
        $.ajax({
            url: `/api/table/${tableName}/columns`,
            type: 'GET',
            success: function(fields) {
                const optionsHtml = '<option value="">选择字段</option>' + 
                    fields.map(field => `<option value="${field}">${field}</option>`).join('');
                
                $('.field-select').html(optionsHtml);
            },
            error: function(xhr, status, error) {
                console.error('加载字段列表失败:', error);
                // 使用示例数据
                let fields = [];
                switch(tableName) {
                    case 'users':
                        fields = ['id', 'name', 'email', 'age', 'created_at'];
                        break;
                    case 'products':
                        fields = ['id', 'name', 'price', 'category', 'stock'];
                        break;
                    case 'orders':
                        fields = ['id', 'user_id', 'product_id', 'quantity', 'order_date'];
                        break;
                    case 'customers':
                        fields = ['id', 'company', 'contact', 'address', 'phone'];
                        break;
                    default:
                        fields = ['id', 'name', 'description'];
                }
                
                const optionsHtml = '<option value="">选择字段</option>' + 
                    fields.map(field => `<option value="${field}">${field}</option>`).join('');
                
                $('.field-select').html(optionsHtml);
            }
        });
    }
    
    // 添加过滤规则
    $('#addRule').on('click', function() {
        const ruleHtml = `
            <div class="rule-group mb-2">
                <div class="row">
                    <div class="col-md-3">
                        <select class="form-select field-select" name="filter_field[]">
                            <option value="">选择字段</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select operator-select" name="filter_operator[]">
                            <option value="=">等于</option>
                            <option value=">">大于</option>
                            <option value="<">小于</option>
                            <option value=">=">大于等于</option>
                            <option value="<=">小于等于</option>
                            <option value="!=">不等于</option>
                            <option value="like">包含</option>
                        </select>
                    </div>
                    <div class="col-md-5">
                        <input type="text" class="form-control filter-value" name="filter_value[]" placeholder="输入值">
                    </div>
                    <div class="col-md-1">
                        <button type="button" class="btn btn-danger remove-rule">-</button>
                    </div>
                </div>
            </div>
        `;
        
        filterRules.append(ruleHtml);
        
        // 更新新增的字段选择器
        const tableName = sourceTableSelect.val();
        if (tableName) {
            $.ajax({
                url: `/api/table/${tableName}/columns`,
                type: 'GET',
                success: function(fields) {
                    const optionsHtml = '<option value="">选择字段</option>' + 
                        fields.map(field => `<option value="${field}">${field}</option>`).join('');
                    
                    filterRules.find('.rule-group:last .field-select').html(optionsHtml);
                },
                error: function(xhr, status, error) {
                    console.error('加载字段列表失败:', error);
                    // 使用示例数据
                    let fields = [];
                    switch(tableName) {
                        case 'users':
                            fields = ['id', 'name', 'email', 'age', 'created_at'];
                            break;
                        case 'products':
                            fields = ['id', 'name', 'price', 'category', 'stock'];
                            break;
                        case 'orders':
                            fields = ['id', 'user_id', 'product_id', 'quantity', 'order_date'];
                            break;
                        case 'customers':
                            fields = ['id', 'company', 'contact', 'address', 'phone'];
                            break;
                        default:
                            fields = ['id', 'name', 'description'];
                    }
                    
                    const optionsHtml = '<option value="">选择字段</option>' + 
                        fields.map(field => `<option value="${field}">${field}</option>`).join('');
                    
                    filterRules.find('.rule-group:last .field-select').html(optionsHtml);
                }
            });
        }
    });
    
    // 删除过滤规则
    $(document).on('click', '.remove-rule', function() {
        if ($('.rule-group').length > 1) {
            $(this).closest('.rule-group').remove();
        } else {
            alert('至少需要保留一个过滤规则');
        }
    });
    
    // 表单提交事件
    extractForm.on('submit', function(e) {
        e.preventDefault();
        
        // 收集表单数据
        const formData = {
            source_table: $('#sourceTable').val(),
            fields: [],
            filter_rules: [],
            new_table_name: $('#newTableName').val()
        };
        
        // 收集选中的字段
        $('input[name="fields[]"]:checked').each(function() {
            formData.fields.push($(this).val());
        });
        
        // 收集过滤规则
        $('.rule-group').each(function() {
            const field = $(this).find('.field-select').val();
            const operator = $(this).find('.operator-select').val();
            const value = $(this).find('.filter-value').val();
            
            if (field && operator && value) {
                formData.filter_rules.push({
                    field: field,
                    operator: operator,
                    value: value
                });
            }
        });
        
        // 验证必填字段
        if (!formData.source_table) {
            alert('请选择源表');
            return;
        }
        
        if (formData.fields.length === 0) {
            alert('请至少选择一个字段');
            return;
        }
        
        if (!formData.new_table_name) {
            alert('请输入新表名');
            return;
        }
        
        // 发送AJAX请求到服务器
        $.ajax({
            url: '/extract',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                if (response.success) {
                    alert('操作成功: ' + response.message);
                } else {
                    alert('操作失败: ' + response.error);
                }
            },
            error: function(xhr, status, error) {
                alert('操作失败: ' + error);
            }
        });
    });
});