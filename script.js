const logElem = document.getElementById('log');

function addLog(msg) {
    const now = new Date().toLocaleTimeString();
    logElem.innerText += `[${now}] ${msg}\n`;
    logElem.scrollTop = logElem.scrollHeight;
}

document.getElementById('startBtn').addEventListener('click', async () => {
    // トークンを改行で分割し、空行を除去
    const tokenInput = document.getElementById('tokens').value;
    const tokens = tokenInput.split('\n').map(t => t.trim()).filter(t => t !== "");
    
    const channelId = document.getElementById('channelId').value;
    const threadName = document.getElementById('threadName').value;
    const message = document.getElementById('message').value;
    const count = parseInt(document.getElementById('count').value);
    const delay = parseFloat(document.getElementById('delay').value) * 1000;

    if (tokens.length === 0 || !channelId) {
        alert("トークンとチャンネルIDは必須です");
        return;
    }

    addLog(`処理を開始します... (使用トークン数: ${tokens.length})`);

    for (let i = 0; i < count; i++) {
        // 現在のトークンを順番に選択 (0, 1, 2, 0, 1...)
        const currentToken = tokens[i % tokens.length];
        const tokenDisplay = `トークン[${(i % tokens.length) + 1}]`;

        try {
            // 1. スレッドを作成 (Type 11: 公開スレッド)
            const threadRes = await fetch(`https://discord.com/api/v9/channels/${channelId}/threads`, {
                method: 'POST',
                headers: {
                    'Authorization': currentToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: threadName || "新規スレッド",
                    type: 11,
                    auto_archive_duration: 60
                })
            });

            const threadData = await threadRes.json();

            if (threadRes.ok) {
                const newThreadId = threadData.id;
                addLog(`[${i+1}/${count}] ${tokenDisplay}: スレッド作成成功 (ID: ${newThreadId})`);

                // 2. 作成したスレッドにメッセージを送信
                if (message) {
                    const msgRes = await fetch(`https://discord.com/api/v9/channels/${newThreadId}/messages`, {
                        method: 'POST',
                        headers: {
                            'Authorization': currentToken,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ content: message })
                    });

                    if (msgRes.ok) {
                        addLog(`[${i+1}/${count}] メッセージ送信成功`);
                    } else {
                        addLog(`[${i+1}/${count}] メッセージ送信失敗: ${msgRes.status}`);
                    }
                }
            } else {
                addLog(`[${i+1}/${count}] ${tokenDisplay} エラー: ${threadRes.status}`);
                if (threadData.retry_after) {
                    addLog(`レート制限中... ${threadData.retry_after}秒待機してください`);
                }
            }
        } catch (err) {
            addLog("通信エラー: " + err.message);
        }

        // 指定した間隔待機
        if (i < count - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    addLog("すべての処理が完了しました。");
});