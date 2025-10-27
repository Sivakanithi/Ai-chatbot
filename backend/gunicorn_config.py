bind = "0.0.0.0:10000"
workers = 1  # Use 1 worker for free tier to save memory
threads = 2
timeout = 120  # Longer timeout for AI model inference
worker_class = "sync"
max_requests = 1000
max_requests_jitter = 50
preload_app = True  # Preload the app to save memory
