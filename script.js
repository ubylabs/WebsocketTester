class WebSocketTester {
    constructor() {
        this.ws = null;
        this.sentCount = 0;
        this.receivedCount = 0;
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.wsUrlInput = document.getElementById('wsUrl');
        this.protocolInput = document.getElementById('protocol');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.connectBtn = document.getElementById('connectBtn');
        this.disconnectBtn = document.getElementById('disconnectBtn');
        this.messageTypeSelect = document.getElementById('messageType');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.messagesDiv = document.getElementById('messages');
        this.sentCountSpan = document.getElementById('sentCount');
        this.receivedCountSpan = document.getElementById('receivedCount');
    }

    bindEvents() {
        this.connectBtn.addEventListener('click', () => this.connect());
        this.disconnectBtn.addEventListener('click', () => this.disconnect());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.clearBtn.addEventListener('click', () => this.clearMessages());

        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.sendMessage();
            }
        });

        // Preset message buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.messageInput.value = btn.dataset.message;
                this.messageTypeSelect.value = 'json';
            });
        });
    }

    connect() {
        const url = this.wsUrlInput.value.trim();
        const protocol = this.protocolInput.value.trim();

        if (!url) {
            this.addMessage('error', 'Please enter a WebSocket URL');
            return;
        }

        this.updateConnectionStatus('connecting', 'Connecting...');
        this.connectBtn.disabled = true;

        try {
            this.ws = protocol ? new WebSocket(url, protocol) : new WebSocket(url);

            this.ws.onopen = (event) => {
                this.updateConnectionStatus('connected', 'Connected');
                this.connectBtn.disabled = true;
                this.disconnectBtn.disabled = false;
                this.sendBtn.disabled = false;
                this.addMessage('system', `Connected to ${url}`);
            };

            this.ws.onmessage = (event) => {
                this.receivedCount++;
                this.updateStats();

                let messageContent;
                if (typeof event.data === 'string') {
                    try {
                        const parsed = JSON.parse(event.data);
                        messageContent = JSON.stringify(parsed, null, 2);
                    } catch {
                        messageContent = event.data;
                    }
                } else {
                    messageContent = `Binary data (${event.data.size || event.data.byteLength} bytes)`;
                }

                this.addMessage('received', messageContent);
            };

            this.ws.onclose = (event) => {
                this.updateConnectionStatus('disconnected', 'Disconnected');
                this.connectBtn.disabled = false;
                this.disconnectBtn.disabled = true;
                this.sendBtn.disabled = true;

                const reason = event.reason || 'No reason provided';
                this.addMessage('system', `Connection closed (Code: ${event.code}, Reason: ${reason})`);
            };

            this.ws.onerror = (error) => {
                this.addMessage('error', `WebSocket error occurred`);
                console.error('WebSocket error:', error);
            };

        } catch (error) {
            this.updateConnectionStatus('disconnected', 'Connection Failed');
            this.connectBtn.disabled = false;
            this.addMessage('error', `Failed to connect: ${error.message}`);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'User initiated disconnect');
        }
    }

    sendMessage() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.addMessage('error', 'WebSocket is not connected');
            return;
        }

        const message = this.messageInput.value.trim();
        const messageType = this.messageTypeSelect.value;

        if (!message) {
            this.addMessage('error', 'Please enter a message');
            return;
        }

        try {
            let dataToSend;

            switch (messageType) {
                case 'json':
                    // Validate JSON
                    JSON.parse(message);
                    dataToSend = message;
                    break;
                case 'binary':
                    dataToSend = new TextEncoder().encode(message);
                    break;
                default:
                    dataToSend = message;
            }

            this.ws.send(dataToSend);
            this.sentCount++;
            this.updateStats();

            this.addMessage('sent', message);
            this.messageInput.value = '';

        } catch (error) {
            this.addMessage('error', `Failed to send message: ${error.message}`);
        }
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date().toLocaleTimeString();

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;

        messageDiv.appendChild(timeDiv);
        messageDiv.appendChild(contentDiv);

        this.messagesDiv.appendChild(messageDiv);
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
    }

    clearMessages() {
        this.messagesDiv.innerHTML = '';
        this.sentCount = 0;
        this.receivedCount = 0;
        this.updateStats();
        this.addMessage('system', 'Message history cleared');
    }

    updateConnectionStatus(status, text) {
        this.connectionStatus.className = `status ${status}`;
        this.connectionStatus.textContent = text;
    }

    updateStats() {
        this.sentCountSpan.textContent = this.sentCount;
        this.receivedCountSpan.textContent = this.receivedCount;
    }
}

// Initialize the WebSocket tester when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WebSocketTester();
});