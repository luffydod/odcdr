# PaddleOCR+CURSOR 体验

## Windows端环境配置记录

```bash
conda create -n odcdr python=3.12 -y

pip install \
-i https://pypi.tuna.tsinghua.edu.cn/simple \
    paddlepaddle \
    paddleocr \
    fastapi \
    uvicorn \
    python-multipart \
    jinja2 \
    python-dotenv \
    openai \
    you-get \
    ffmpeg-python

```

## 通义千问note

[阿里云百炼控制台](https://bailian.console.aliyun.com/)

通义千问-Max API调用示例：

```python
import os
from openai import OpenAI

client = OpenAI(
    # 若没有配置环境变量，请用百炼API Key将下行替换为：api_key="sk-xxx",
    api_key=os.getenv("DASHSCOPE_API_KEY"), 
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
completion = client.chat.completions.create(
    model="qwen-plus", # 模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
    messages=[
        {'role': 'system', 'content': 'You are a helpful assistant.'},
        {'role': 'user', 'content': '你是谁？'}],
    )
    
print(completion.model_dump_json())
```

使用 env 文件配置 API Key：

```bash
# 安装python-dotenv
# 在项目根目录创建 .env 文件
DASHSCOPE_API_KEY=***
```

## BiliBili 视频下载

### 音视频合并-ffmpeg

[安装ffmpeg](https://github.com/BtbN/FFmpeg-Builds/releases)
