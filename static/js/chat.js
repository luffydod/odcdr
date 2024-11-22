class ChatHistory {
    constructor() {
        this.historyContainer = document.getElementById('chatHistory');
        this.currentChat = [];
        this.currentChatId = null;
        this.contextMenu = null;
        this.setupContextMenu();
        this.loadHistory();
        this.addMessageToChat = window.addMessage;
        this.setupScrollButtons();
        this.setupNewChatButton();
        this.setupConfirmDialog();
    }

    setupContextMenu() {
        // 创建右键菜单元素
        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'context-menu';
        this.contextMenu.style.display = 'none';
        document.body.appendChild(this.contextMenu);

        // 点击其他地方关闭菜单
        document.addEventListener('click', () => {
            this.contextMenu.style.display = 'none';
        });
    }

    loadHistory() {
        const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        this.historyContainer.innerHTML = '';
        
        // 按时间倒序排列历史记录
        history.sort((a, b) => {
            const timeA = new Date(b.lastUpdated || b.timestamp);
            const timeB = new Date(a.lastUpdated || a.timestamp);
            return timeA - timeB;
        });
        
        history.forEach(chat => {
            this.addHistoryItem(chat);
        });
    }

    addHistoryItem(chat) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.setAttribute('data-chat-id', chat.id);
        historyItem.innerHTML = `
            <div class="history-content">${chat.messages[0].content.substring(0, 12)}...</div>
            <div class="history-time">${new Date(chat.timestamp).toLocaleString()}</div>
        `;
        
        // 添加点击事件
        historyItem.addEventListener('click', () => {
            // 移除其他项的active类
            this.historyContainer.querySelectorAll('.history-item').forEach(item => {
                item.classList.remove('active');
            });
            // 添加active类到当前项
            historyItem.classList.add('active');
            this.loadChat(chat);
        });

        // 添加右键菜单
        historyItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, chat.id);
        });

        this.historyContainer.prepend(historyItem);
    }

    showContextMenu(e, chatId) {
        this.contextMenu.innerHTML = `
            <div class="context-menu-item" data-action="delete">
                <i class="fas fa-trash"></i>
                删除此记录
            </div>
        `;

        // 设置菜单位置
        this.contextMenu.style.left = `${e.pageX}px`;
        this.contextMenu.style.top = `${e.pageY}px`;
        this.contextMenu.style.display = 'block';

        // 添加删除功能
        const deleteBtn = this.contextMenu.querySelector('[data-action="delete"]');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteChat(chatId);
        });
    }

    setupConfirmDialog() {
        this.confirmDialog = document.getElementById('confirmDialog');
        this.confirmDialog.querySelector('.close-btn').addEventListener('click', () => {
            this.hideConfirmDialog();
        });
        
        // 点击对话框外部关闭
        this.confirmDialog.addEventListener('click', (e) => {
            if (e.target === this.confirmDialog) {
                this.hideConfirmDialog();
            }
        });
    }

    showConfirmDialog(chatId) {
        return new Promise((resolve) => {
            // 先隐藏右键菜单
            this.contextMenu.style.display = 'none';
            
            // 显示确认弹窗
            this.confirmDialog.classList.add('show');
            
            const confirmBtn = this.confirmDialog.querySelector('.confirm-btn');
            const cancelBtn = this.confirmDialog.querySelector('.cancel-btn');
            
            const handleConfirm = () => {
                this.hideConfirmDialog();
                resolve(true);
                cleanup();
            };
            
            const handleCancel = () => {
                this.hideConfirmDialog();
                resolve(false);
                cleanup();
            };
            
            const cleanup = () => {
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
            };
            
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
        });
    }

    hideConfirmDialog() {
        this.confirmDialog.classList.remove('show');
    }

    async deleteChat(chatId) {
        // 确保在显示确认弹窗前隐藏右键菜单
        this.contextMenu.style.display = 'none';
        
        const confirmed = await this.showConfirmDialog(chatId);
        
        if (confirmed) {
            // 从localStorage中删除
            const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
            const updatedHistory = history.filter(chat => chat.id !== chatId);
            localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));

            // 从UI中删除
            const historyItem = this.historyContainer.querySelector(`[data-chat-id="${chatId}"]`);
            if (historyItem) {
                historyItem.remove();
            }

            // 如果删除的是当前对话，清空聊天窗口
            if (this.currentChatId === chatId) {
                document.getElementById('chatMessages').innerHTML = '';
                this.currentChat = [];
                this.currentChatId = null;
            }

            // 隐藏右键菜单
            this.contextMenu.style.display = 'none';
        }
    }

    getCurrentChat() {
        return this.currentChat.map(msg => ({
            content: msg.content,
            isUser: msg.role === 'user'
        }));
    }

    saveChat(messages) {
        const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        
        if (this.currentChatId) {
            const index = history.findIndex(chat => chat.id === this.currentChatId);
            if (index !== -1) {
                history[index] = {
                    ...history[index],
                    messages: messages,
                    lastUpdated: new Date()
                };
                const historyItem = this.historyContainer.querySelector(`[data-chat-id="${this.currentChatId}"]`);
                if (historyItem) {
                    historyItem.querySelector('.history-content').textContent = 
                        `${messages[0].content.substring(0, 50)}...`;
                    historyItem.querySelector('.history-time').textContent = 
                        new Date().toLocaleString();
                }
            }
        } else {
            const newChat = {
                id: Date.now(),
                timestamp: new Date(),
                messages: messages
            };
            history.push(newChat);
            this.currentChatId = newChat.id;
            this.addHistoryItem(newChat);
            
            // 自动激活新创建的对话
            const newHistoryItem = this.historyContainer.querySelector(`[data-chat-id="${newChat.id}"]`);
            if (newHistoryItem) {
                this.historyContainer.querySelectorAll('.history-item').forEach(item => {
                    item.classList.remove('active');
                });
                newHistoryItem.classList.add('active');
            }
        }
        
        localStorage.setItem('chatHistory', JSON.stringify(history));
        this.currentChat = messages;
    }

    loadChat(chat) {
        // 每次加载聊天记录时，先刷新整个历史记录列表
        this.loadHistory();
        
        // 从最新的历史记录中获取当前聊天
        const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        const latestChat = history.find(item => item.id === chat.id);
        
        // 如果找到最新数据，使用最新数据
        if (latestChat) {
            chat = latestChat;
        }

        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        this.currentChatId = chat.id;
        this.currentChat = chat.messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        
        chat.messages.forEach(message => {
            const isUser = message.role === 'user';
            this.addMessageToChat(message.content, isUser);
        });
        
        // 更新active状态
        this.historyContainer.querySelectorAll('.history-item').forEach(item => {
            if (item.getAttribute('data-chat-id') === String(chat.id)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    setupScrollButtons() {
        this.scrollLeft = document.getElementById('scrollLeft');
        this.scrollRight = document.getElementById('scrollRight');
        
        if (this.scrollLeft && this.scrollRight) {
            this.scrollLeft.addEventListener('click', () => {
                this.historyContainer.scrollBy({
                    left: -200,
                    behavior: 'smooth'
                });
                this.updateScrollButtonsState();
            });
            
            this.scrollRight.addEventListener('click', () => {
                this.historyContainer.scrollBy({
                    left: 200,
                    behavior: 'smooth'
                });
                this.updateScrollButtonsState();
            });

            // 监听滚动事件来更新按钮状态
            this.historyContainer.addEventListener('scroll', () => {
                this.updateScrollButtonsState();
            });

            // 初始化按钮状态
            this.updateScrollButtonsState();
        }
    }

    setupNewChatButton() {
        const newChatBtn = document.querySelector('.new-chat-btn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                this.startNewChat();
            });
        }
    }

    startNewChat() {
        // 清空聊天消息区域
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        // 重置当前对话状态
        this.currentChat = [];
        this.currentChatId = null;
        
        // 移除历史记录项的激活状态
        this.historyContainer.querySelectorAll('.history-item').forEach(item => {
            item.classList.remove('active');
        });

        // 清空输入框
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.value = '';
            const charCount = document.getElementById('charCount');
            if (charCount) {
                charCount.textContent = '0/2000';
            }
        }
    }

    // 更新滚动按钮的状态（启用/禁用）
    updateScrollButtonsState() {
        if (this.scrollLeft && this.scrollRight) {
            // 检查是否可以向左滚动
            this.scrollLeft.disabled = this.historyContainer.scrollLeft <= 0;
            
            // 检查是否可以向右滚动
            const maxScroll = this.historyContainer.scrollWidth - this.historyContainer.clientWidth;
            this.scrollRight.disabled = this.historyContainer.scrollLeft >= maxScroll;

            // 根据状态更新按钮样式
            this.scrollLeft.style.opacity = this.scrollLeft.disabled ? '0.5' : '1';
            this.scrollRight.style.opacity = this.scrollRight.disabled ? '0.5' : '1';
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chatInput');
    const charCount = document.getElementById('charCount');
    const sendBtn = document.getElementById('sendBtn');
    const expandBtn = document.getElementById('expandBtn');
    const chatMessages = document.getElementById('chatMessages');
    
    window.addMessage = function(content, isUser = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'message-user' : 'message-ai'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (isUser) {
            messageContent.textContent = content;
        } else {
            messageContent.className += ' markdown-content';
            messageContent.innerHTML = marked.parse(content);
            
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
    }

    window.chatHistoryManager = new ChatHistory();
    
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
    // let chatHistory = [];
    const chatHistoryManager = new ChatHistory();

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
        // chatHistory.push({
        //     content: content,
        //     isUser: isUser,
        //     timestamp: new Date().toISOString()
        // });
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
    // 更新sendMessage函数
    async function sendMessage(message) {
        try {
            addMessage(message, true);
            showTypingIndicator();
            
            // 获取当前对话历史
            const currentMessages = chatHistoryManager.getCurrentChat();
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    history: currentMessages
                })
            });
            
            if (!response.ok) {
                throw new Error(`网络响应出错: ${response.status}`);
            }
            
            const data = await response.json();
            removeTypingIndicator();
            
            if (data.error) {
                addMessage(data.error, false);
                console.error('API错误:', data.error);
            } else {
                addMessage(data.response, false);
                
                // 修改这里：正确构建新的消息数组
                const newMessages = [
                    ...chatHistoryManager.currentChat,
                    { role: 'user', content: message },
                    { role: 'assistant', content: data.response }
                ];
                
                // 保存更新后的对话
                chatHistoryManager.saveChat(newMessages);
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