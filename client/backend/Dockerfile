FROM python:3.11-slim

# Installiamo le dipendenze di sistema necessarie per PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiamo i requisiti e installiamo
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamo il resto del codice
COPY . .

EXPOSE 8100

# Comando per avviare FastAPI (o Flask, vedi sotto)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8100"]