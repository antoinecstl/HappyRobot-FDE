FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy source
COPY backend/ ./backend/

# Make entrypoint executable
RUN chmod +x backend/start.sh

EXPOSE 8000

CMD ["bash", "backend/start.sh"]
