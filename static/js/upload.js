$(document).ready(function() {
    const dropZone = $('#dropZone');
    const fileInput = $('#excelFile');
    const uploadForm = $('#uploadForm');
    const uploadProgress = $('#uploadProgress');
    const sheetConfigCard = $('#sheetConfigCard');
    const sheetConfigContainer = $('#sheetConfigContainer');
    const processBtn = $('#processBtn');
    
    let uploadedFileName = '';
    
    // 拖拽上传事件处理
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.on(eventName, preventDefaults);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.on(eventName, () => {
            dropZone.addClass('dragover');
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.on(eventName, () => {
            dropZone.removeClass('dragover');
        });
    });
    
    // 处理文件拖放
    dropZone.on('drop', function(e) {
        const dt = e.originalEvent.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            fileInput[0].files = files;
            handleFiles(files);
        }
    });
    
    // 文件选择事件
    fileInput.on('change', function() {
        handleFiles(this.files);
    });
    
    // 处理文件
    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        const fileName = file.name.toLowerCase();
        
        // 检查文件类型
        if (!fileName.endsWith('.xlsx')) {
            alert('只支持.xlsx格式的文件');
            return;
        }
        
        // 检查文件大小
        if (file.size > 50 * 1024 * 1024) { // 50MB
            alert('文件大小不能超过50MB');
            return;
        }
        
        // 使用AJAX上传文件
        uploadFile(file);
    }
    
    // 上传文件
    function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        // 显示进度条
        uploadProgress.removeClass('d-none');
        $('.progress-bar').css('width', '0%');
        
        $.ajax({
            url: '/upload',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            xhr: function() {
                const xhr = new window.XMLHttpRequest();
                // 上传进度
                xhr.upload.addEventListener("progress", function(evt) {
                    if (evt.lengthComputable) {
                        const percentComplete = evt.loaded / evt.total * 100;
                        $('.progress-bar').css('width', percentComplete + '%');
                    }
                }, false);
                return xhr;
            },
            success: function(response) {
                if (response.success) {
                    $('.progress-bar').css('width', '100%');
                    uploadedFileName = response.filename;
                    setTimeout(() => {
                        showSheetConfiguration(response.sheets);
                    }, 300);
                } else {
                    alert('上传失败: ' + response.error);
                    uploadProgress.addClass('d-none');
                }
            },
            error: function(xhr, status, error) {
                alert('上传失败: ' + error);
                uploadProgress.addClass('d-none');
            }
        });
    }
    
    // 显示sheet配置界面
    function showSheetConfiguration(sheets) {
        uploadProgress.addClass('d-none');
        sheetConfigCard.removeClass('d-none');
        
        let configHtml = '';
        
        sheets.forEach((sheet, index) => {
            configHtml += `
                <div class="card mb-3 sheet-config-item" data-sheet="${sheet}">
                    <div class="card-header">
                        <h6>${sheet}</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">表名</label>
                                    <input type="text" class="form-control table-name-input" name="tableName_${index}" value="${sheet.toLowerCase()}" placeholder="输入表名">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">起始行</label>
                                    <input type="number" class="form-control start-row-input" name="startRow_${index}" value="1" min="1">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        sheetConfigContainer.html(configHtml);
    }
    
    // 处理数据按钮事件
    processBtn.on('click', function() {
        if (!uploadedFileName) {
            alert('请先上传文件');
            return;
        }
        
        const sheetConfigs = [];
        $('.sheet-config-item').each(function() {
            const sheetName = $(this).data('sheet');
            const tableName = $(this).find('.table-name-input').val();
            const startRow = $(this).find('.start-row-input').val();
            
            if (tableName) {
                sheetConfigs.push({
                    sheet_name: sheetName,
                    table_name: tableName,
                    start_row: parseInt(startRow)
                });
            }
        });
        
        if (sheetConfigs.length === 0) {
            alert('请至少为一个sheet配置表名');
            return;
        }
        
        // 发送处理请求
        $.ajax({
            url: '/import_excel',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                filename: uploadedFileName,
                sheet_configs: sheetConfigs
            }),
            success: function(response) {
                if (response.success) {
                    let resultMessage = '数据导入完成:\n';
                    response.results.forEach(result => {
                        if (result.status === 'success') {
                            resultMessage += `- ${result.sheet_name}: 成功导入${result.rows}行数据\n`;
                        } else {
                            resultMessage += `- ${result.sheet_name}: ${result.message}\n`;
                        }
                    });
                    alert(resultMessage);
                } else {
                    alert('导入失败: ' + response.error);
                }
            },
            error: function(xhr, status, error) {
                alert('导入失败: ' + error);
            }
        });
    });
});