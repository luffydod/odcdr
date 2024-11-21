class OCRHandler {
    constructor() {
        // 初始化变量
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.originalImage = null;

        // DOM 元素
        this.imageContainer = document.getElementById('imageContainer');
        this.previewImage = document.getElementById('previewImage');
        this.selectionBox = document.getElementById('selectionBox');
        this.resultDiv = document.getElementById('result');
        this.imageFile = document.getElementById('imageFile');

        // 绑定事件处理器
        this.initEventListeners();
    }

    initEventListeners() {
        // 文件选择处理
        this.imageFile.addEventListener('change', this.handleFileSelect.bind(this));

        // 鼠标事件处理
        this.imageContainer.addEventListener('mousedown', this.startDrawing.bind(this));
        this.imageContainer.addEventListener('mousemove', this.draw.bind(this));
        this.imageContainer.addEventListener('mouseup', this.endDrawing.bind(this));
        this.imageContainer.addEventListener('mouseleave', this.endDrawing.bind(this));

        // 禁用图片拖拽
        this.previewImage.addEventListener('dragstart', (e) => e.preventDefault());
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.previewImage.src = event.target.result;
                this.previewImage.style.display = 'block';
                this.originalImage = event.target.result;
                this.resetSelection();
            };
            reader.readAsDataURL(file);
        }
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.imageContainer.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;
        
        this.selectionBox.style.display = 'block';
        this.selectionBox.style.left = `${this.startX}px`;
        this.selectionBox.style.top = `${this.startY}px`;
        this.selectionBox.style.width = '0';
        this.selectionBox.style.height = '0';
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.imageContainer.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        const width = currentX - this.startX;
        const height = currentY - this.startY;

        this.selectionBox.style.width = `${Math.abs(width)}px`;
        this.selectionBox.style.height = `${Math.abs(height)}px`;
        this.selectionBox.style.left = `${width < 0 ? currentX : this.startX}px`;
        this.selectionBox.style.top = `${height < 0 ? currentY : this.startY}px`;
    }

    endDrawing() {
        this.isDrawing = false;
    }

    resetSelection() {
        this.selectionBox.style.display = 'none';
        this.resultDiv.innerHTML = '';
    }

    getSelectedRegion() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const boxRect = this.selectionBox.getBoundingClientRect();
        const imageRect = this.previewImage.getBoundingClientRect();
        
        const scaleX = this.previewImage.naturalWidth / this.previewImage.width;
        const scaleY = this.previewImage.naturalHeight / this.previewImage.height;
        
        const x = (boxRect.left - imageRect.left) * scaleX;
        const y = (boxRect.top - imageRect.top) * scaleY;
        const width = boxRect.width * scaleX;
        const height = boxRect.height * scaleY;
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(this.previewImage, x, y, width, height, 0, 0, width, height);
        
        return canvas.toDataURL('image/jpeg');
    }

    async recognizeSelection() {
        if (this.selectionBox.style.display === 'none') {
            alert('请先选择要识别的区域');
            return;
        }
        
        const croppedImage = this.getSelectedRegion();
        await this.uploadAndRecognize(croppedImage);
    }

    async recognizeFullImage() {
        if (!this.originalImage) {
            alert('请先选择图片');
            return;
        }
        await this.uploadAndRecognize(this.originalImage);
    }

    async uploadAndRecognize(imageData) {
        this.resultDiv.innerHTML = '识别中，请稍候...';

        try {
            const response = await fetch(imageData);
            const blob = await response.blob();
            
            const formData = new FormData();
            formData.append('file', blob, 'image.jpg');

            const apiResponse = await fetch('/ocr/', {
                method: 'POST',
                body: formData
            });

            if (!apiResponse.ok) {
                throw new Error('识别失败');
            }

            const data = await apiResponse.json();
            this.displayResults(data);
        } catch (error) {
            this.resultDiv.innerHTML = `错误：${error.message}`;
        }
    }

    displayResults(data) {
        this.resultDiv.innerHTML = '<h2>识别结果：</h2>';
        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'text-item';
            div.innerHTML = `
                <p>文本：${item.text}</p>
                <p>置信度：${(item.confidence * 100).toFixed(2)}%</p>
            `;
            this.resultDiv.appendChild(div);
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    const ocrHandler = new OCRHandler();
    
    // 绑定按钮事件
    window.resetSelection = () => ocrHandler.resetSelection();
    window.recognizeSelection = () => ocrHandler.recognizeSelection();
    window.recognizeFullImage = () => ocrHandler.recognizeFullImage();
});