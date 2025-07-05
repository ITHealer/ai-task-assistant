FROM nvidia/cuda:12.6.1-cudnn-runtime-ubuntu22.04

WORKDIR /app

COPY . .
COPY requirements.txt .

RUN python3 -m pip install --upgrade pip 
RUN python3 -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu126
RUN python3 -m pip install --no-cache-dir -r requirements.txt

