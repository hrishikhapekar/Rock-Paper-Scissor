# Rock-Paper-Scissor

A simple Rock–Paper–Scissors game implementation — playable locally or in the browser (depending on the project's implementation). This repository provides a small, easy-to-understand implementation of the classic hand game so you can play, learn, and extend it.

> Note: This README is written as a friendly, general-purpose guide. If your repository uses a specific language or framework (Python, JavaScript/Node, web), follow the corresponding instructions in the "Run / Play" section below. Adjust as needed for the actual project files in this repo.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Run / Play](#run--play)
  - [Option A — Python (CLI)](#option-a---python-cli)
  - [Option B — Node.js (CLI / Web)](#option-b---nodejs-cli--web)
  - [Option C — Static Web (Browser)](#option-c---static-web-browser)
- [Gameplay](#gameplay)
- [Project structure (suggested)](#project-structure-suggested)
- [Contributing](#contributing)
- [Tests](#tests)
- [License](#license)
- [Contact](#contact)
- [Acknowledgements](#acknowledgements)

## Features

- Play Rock–Paper–Scissors vs computer (random AI).
- Two-player local mode (take turns on the same machine).
- Score tracking (rounds, best-of-N support).
- Clear, easy-to-read code that is beginner-friendly and easy to extend.
- Optional GUI (web) or CLI interfaces depending on the implementation.

## Demo

If this repository includes a live demo or a packaged application, add the link here. Example:

- Live demo: https://your-hosted-demo.example.com (replace with your URL)

## Run / Play

Below are example instructions for common implementations. Use the section that matches your repository; if you're unsure, check the repo files (`.py`, `package.json`, `index.html`, etc.).

### Option A — Python (CLI)
1. Ensure Python 3.8+ is installed.
2. Clone the repo:
   ```
   git clone https://github.com/hrishikhapekar/Rock-Paper-Scissor.git
   cd Rock-Paper-Scissor
   ```
3. (Optional) Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate   # macOS / Linux
   venv\Scripts\activate      # Windows
   ```
4. Install dependencies (if any):
   ```
   pip install -r requirements.txt
   ```
5. Run the game (example):
   ```
   python rps.py
   ```
   Follow on-screen prompts to play.

### Option B — Node.js (CLI / Web)
1. Ensure Node.js (14+) and npm are installed.
2. Clone the repo:
   ```
   git clone https://github.com/hrishikhapekar/Rock-Paper-Scissor.git
   cd Rock-Paper-Scissor
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Run the CLI or dev server:
   - CLI:
     ```
     node rps.js
     ```
   - Web (dev server):
     ```
     npm start
     ```
   Open the browser to the address printed by the server (e.g., http://localhost:3000).

### Option C — Static Web (Browser)
1. Clone the repo and open the web demo:
   ```
   git clone https://github.com/hrishikhapekar/Rock-Paper-Scissor.git
   cd Rock-Paper-Scissor
   ```
2. Open `index.html` in your browser:
   - Double-click `index.html`, or
   - Serve with a static server, e.g.:
     ```
     npx http-server . -o
     ```
3. Play using the UI (buttons/controls) provided.

## Gameplay

- Standard rules:
  - Rock beats Scissors
  - Scissors beats Paper
  - Paper beats Rock
- Typically the player chooses one of Rock, Paper, or Scissors each round. The winner of the round is determined immediately.
- Best-of-N mode: play until one player reaches (N // 2) + 1 wins.
- Scores persist for the session; restart to reset or implement persistent storage to keep long-term scores.

## Project structure (suggested)

A typical layout (adapt to your repository):

- README.md — this file
- LICENSE
- src/ or lib/ — game logic
  - rps.py or rps.js — core Rock–Paper–Scissors logic
- cli/ — command-line interface wrappers (optional)
- web/ or public/ — browser UI (HTML/CSS/JS) (optional)
- tests/ — unit tests
- package.json or requirements.txt — dependencies and scripts

## Contributing

Contributions are welcome! Suggested workflow:

1. Fork the repository.
2. Create a feature branch:
   ```
   git checkout -b feat/your-feature
   ```
3. Make your changes, add tests if appropriate.
4. Run tests and linting.
5. Commit and push:
   ```
   git commit -am "Add feature: ..."
   git push origin feat/your-feature
   ```
6. Open a Pull Request on GitHub explaining the change.

Guidelines:
- Keep changes small and focused.
- Add tests for new behavior.
- Follow existing code style and include docs where helpful.

## Tests

If tests exist, run them with the commands appropriate for the project:

- Python (pytest):
  ```
  pytest
  ```
- Node.js (Jest / Mocha):
  ```
  npm test
  ```

Add or improve tests under the `tests/` directory.

## License

This project is provided under the MIT License — see LICENSE for details. If the repository has a different license, update this section accordingly.

## Contact

Maintainer: hrishikhapekar  
GitHub: https://github.com/hrishikhapekar/Rock-Paper-Scissor

If you'd like to report an issue or request a feature, please open an issue on GitHub.

## Acknowledgements

- Classic game rules and inspiration.
- Any libraries or resources used in the project (add names/links here).

Enjoy playing — and feel free to open issues or PRs to improve this project!
