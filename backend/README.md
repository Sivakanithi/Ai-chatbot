This backend serves a small Flask API that forwards requests to OpenAI.

Quick run (development):

1. Create and activate your virtual environment, or use the project's venv.
2. Install dependencies:

   D:/projects/ai-chatbot-project/.venv-1/Scripts/python.exe -m pip install -r requirements.txt

3. Configure your OpenAI API key (do NOT commit it):

   # Temporarily for current PowerShell session
   $env:OPENAI_API_KEY = 'sk-<your-key-here>'

   # Or set permanently (PowerShell)
   setx OPENAI_API_KEY "sk-<your-key-here>"

   Alternatively copy `backend/.env.example` to `.env` and populate the value if you use a loader.

4. Run the app:

   D:/projects/ai-chatbot-project/.venv-1/Scripts/python.exe app.py

Notes:
- The app reads the `OPENAI_API_KEY` environment variable. If it's missing, the server will start but calls to OpenAI will fail with a 401.
- For production, run behind a real WSGI server and do not enable Flask debug mode.
