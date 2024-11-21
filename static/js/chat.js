document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chatInput');
    const charCount = document.getElementById('charCount');
    const sendBtn = document.getElementById('sendBtn');
    const expandBtn = document.getElementById('expandBtn');
    const chatMessages = document.getElementById('chatMessages');
    
    // 字符计数功能
    chatInput.addEventListener('input', function() {
        const length = this.value.length;
        charCount.textContent = `${length}/2000`;
        
        // 如果超过2000字符，禁用输入
        if (length > 2000) {
            this.value = this.value.substring(0, 2000);
        }
    });
    // 展开按钮功能
    expandBtn.addEventListener('click', function() {
        if (chatInput.style.height === '300px') {
            chatInput.style.height = '100px';
        } else {
            chatInput.style.height = '300px';
        }
    });
    // 配置marked选项
    marked.setOptions({
        highlight: function(code, language) {
            if (language && hljs.getLanguage(language)) {
                return hljs.highlight(code, { language: language }).value;
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true
    });

    // 添加聊天历史记录数组
    let chatHistory = [];

    // 添加消息到聊天窗口和历史记录
    // 更新添加消息的函数
    function addMessage(content, isUser = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'message-user' : 'message-ai'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (isUser) {
            // 用户消息保持纯文本
            messageContent.textContent = content;
        } else {
            // AI响应使用Markdown渲染
            messageContent.className += ' markdown-content';
            // 使用marked渲染Markdown内容
            messageContent.innerHTML = marked.parse(content);
            
            // 对新添加的代码块应用高亮
            messageContent.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
            });
        }
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = new Date().toLocaleTimeString();
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 添加到历史记录
        chatHistory.push({
            content: content,
            isUser: isUser,
            timestamp: new Date().toISOString()
        });
    }

    // 显示加载动画
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message message-ai';
        indicator.innerHTML = `
            <div class="typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;
        indicator.id = 'typingIndicator';
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 移除加载动画
    function removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // 发送消息
    async function sendMessage(message) {
        try {
            // 显示用户消息
            addMessage(message, true);
            
            // 显示加载动画
            showTypingIndicator();
            
            // 发送请求到后端，包含历史记录
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    history: chatHistory
                })
            });
            
            if (!response.ok) {
                throw new Error('网络响应出错');
            }
            
            const data = await response.json();
            
            // 移除加载动画
            removeTypingIndicator();
            
            // 显示AI响应
            if (data.error) {
                addMessage(data.response, false);
                console.error('API错误:', data.error);
            } else {
                addMessage(data.response, false);
            }
            
        } catch (error) {
            console.error('发送消息失败:', error);
            removeTypingIndicator();
            addMessage('抱歉，发送消息失败，请稍后重试。', false);
        }
    }

    // 发送按钮点击事件
    sendBtn.addEventListener('click', function() {
        const message = chatInput.value.trim();
        if (message) {
            sendMessage(message);
            chatInput.value = '';
            charCount.textContent = '0/2000';
        }
    });

    // 添加回车发送功能（按住Shift+回车换行）
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
        }
    });
});