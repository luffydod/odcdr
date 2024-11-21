# 使用FastAPI创建一个服务，用于处理用户上传的图片，并调用paddleocr进行文字识别
from fastapi import FastAPI, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from paddleocr import PaddleOCR
import numpy as np
import cv2
import os
from typing import List, Optional
import uvicorn
from fastapi import HTTPException
from openai import OpenAI
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()
app = FastAPI()

# 添加 CORS 支持
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# 初始化OpenAI客户端
client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)
# 挂载静态文件目录
app.mount("/static", StaticFiles(directory="static"), name="static")

# 设置模板目录
templates = Jinja2Templates(directory="templates")

# 初始化PaddleOCR, 使用本地模型
ocr = PaddleOCR(
    use_angle_cls=True, # 使用方向分类器
    det_model_dir="./models/ch_PP-OCRv4_det_server_infer/",
    lang="ch",
    use_gpu=False, # 使用CPU
)

# 定义请求和响应的数据模型
class ChatMessage(BaseModel):
    content: str
    isUser: bool
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    response: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # 构建消息列表
        messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant."
            }
        ]
        
        # 添加历史消息
        for msg in request.history:
            role = "user" if msg.isUser else "assistant"
            messages.append({
                "role": role,
                "content": msg.content
            })
        
        # 添加当前用户消息
        messages.append({
            "role": "user",
            "content": request.message
        })

        # 调用通义千问API
        try:
            completion = client.chat.completions.create(
                model="qwen-plus",
                messages=messages
            )
            
            # 获取AI响应
            ai_response = completion.choices[0].message.content
            
            return ChatResponse(response=ai_response)
            
        except Exception as e:
            print(f"API调用错误: {str(e)}")  # 记录详细错误信息
            raise HTTPException(
                status_code=500,
                detail="AI服务调用失败"
            )

    except Exception as e:
        print(f"处理请求错误: {str(e)}")  # 记录详细错误信息
        raise HTTPException(
            status_code=500,
            detail="服务器内部错误"
        )

@app.post("/ocr/", response_model=List[dict])
async def read_text_from_image(file: UploadFile = File(...)):
    try:
        # 验证文件类型
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="只支持图片文件")
        
        # 读取图片文件
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="无法解析图片文件")
        
        # 执行 OCR
        result = ocr.ocr(img, cls=True)
        
        if not result or not result[0]:
            return []
        
        # 处理识别结果
        response = []
        for line in result[0]:
            # 确保结果格式正确
            if len(line) >= 2 and len(line[1]) >= 2:
                response.append({
                    "text": line[1][0],  # 识别的文本
                    "confidence": float(line[1][1]),  # 置信度
                    "position": line[0].tolist() if isinstance(line[0], np.ndarray) else line[0]  # 文本位置坐标
                })
        
        return response
        
    except Exception as e:
        # 记录错误日志
        print(f"OCR处理错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OCR处理失败: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/image-ocr", response_class=HTMLResponse)
async def image_ocr(request: Request):
    return templates.TemplateResponse("image_ocr.html", {"request": request})

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

