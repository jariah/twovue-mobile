# Use a slim Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create photos directory
RUN mkdir -p photos

# Let Python script handle the port via environment variable
CMD ["python", "main.py"] 