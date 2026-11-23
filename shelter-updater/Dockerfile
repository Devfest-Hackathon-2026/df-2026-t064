FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY update.py apply_update.py pipeline.py sync_cloud_storage.py cloud_runner.py ./

COPY data/prefectures/ ./data/prefectures/
COPY data/prefectures-json/ ./data/prefectures-json/

CMD ["python", "cloud_runner.py"]