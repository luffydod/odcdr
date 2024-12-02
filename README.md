# ChatChat

## 介绍

当前项目实现了一个基于通义千问的智能聊天机器人，并集成了OCR文字识别功能。

### ToDo

- bilibili视频字幕提取
- 图文总结
- ocr功能优化
- 公式识别

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

## Docker 部署

### Python 3.12

```Dockerfile
FROM ubuntu:20.04
# 设置语言环境和时区
ENV LC_ALL=C.UTF-8 \
    LANG=C.UTF-8 \
    TZ=Asia/Shanghai
# 配置时区链接
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
ARG DEBIAN_FRONTEND=noninteractive
RUN sed 's/\/.*com/\/\/mirrors.aliyun.com/g' /etc/apt/sources.list -i

RUN apt-get update && apt-get install -y \
    build-essential cmake && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y --no-install-recommends \
    software-properties-common \
    && add-apt-repository ppa:deadsnakes/ppa
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.12 python3.12-dev python3.12-venv python3.12-distutils \
    && ln -sf /usr/bin/python3.12 /usr/bin/python \
    && python -m ensurepip --upgrade \
    && python -m pip install --upgrade pip \
    && apt-get clean \ 
    && rm -rf /var/lib/apt/lists/* /etc/apt/sources.list.d/deadsnakes-ppa*
```

## 项目依赖镜像

```Dockerfile
FROM pybase:v0.1

RUN pip install -i https://pypi.tuna.tsinghua.edu.cn/simple \
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

WORKDIR /app

COPY . /app

CMD ["python", "main.py"]
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
