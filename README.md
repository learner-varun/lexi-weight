# Lexi-Weight 🧠🎮

Lexi-Weight is an engaging, lightweight browser-based word puzzle game where players must build valid English words that meet a specific "weight" requirement. 

Each letter of the alphabet is assigned a numerical weight, and players must strategize to find words that exactly hit the target weight within a time limit!

## 🌟 Features

- **Dynamic Level Selection**: Play at your own pace! Choose from Easy (Level 1) to Hard (Level 3), each increasing the required target weight and difficulty.
- **Glassmorphism UI**: A sleek, modern interface utilizing beautiful glass-like aesthetics, vibrant glowing gradients, and smooth micro-animations.
- **Advanced Theme Engine**: Customize your experience instantly!
  - Toggle between **Dark Mode** and **Light Mode** backgrounds.
  - Choose from 5 vivid color accents: **Cyberpunk**, **Neon**, **Fire**, **Ocean**, and **Toxic**.
- **Keyboard Support**: Fully supports physical keyboard typing! Type letters to place them, hit `Backspace` to delete, and hit `Enter` to submit your word.
- **Dictionary Validation**: Integrates with a real-time dictionary API to ensure submitted words are valid English words.
- **Smart Letter Bank**: Draggable letter tiles that dynamically display their assigned weight number right on the tile so you never have to guess.

## 🕹️ How to Play

### The Objective
- Your primary goal is to form a single, valid English word.
- The total "weight" of the letters in your word must exactly match the **Required Weight** displayed at the top of the screen.
- Each letter has a specific assigned numerical weight (e.g., A=1, B=2, Z=26) which is shown on the letter tile itself.

### Rules of Engagement
- **Pre-placed Letters**: Some levels give you a mandatory letter already placed on the board. You *must* build your word around it. The weight of this pre-placed letter is automatically counted toward your target!
- **Placing Letters**: You can place letters onto the board by:
  - Dragging a letter tile from the bank to a slot on the board.
  - Clicking a letter tile in the bank.
  - Typing the letter on your physical keyboard.
- **Removing Letters**: Made a mistake? Click a placed letter on the board to return it to the bank, or press `Backspace` on your keyboard.
- **Time Limit**: You are racing against a timer! The timer bar at the top indicates how much time you have left to submit a valid word.

### Winning and Losing
- When you are ready, click **Submit** (or press `Enter` on your keyboard).
- **You win if:** Your word is a valid English word (verified via dictionary API) AND its total weight exactly matches the target weight.
- **You lose if:** The timer runs out, your word is not a valid English word, or the total weight of your word does not equal the target weight.

## 🛠️ Tech Stack

- **HTML5**: Semantic structure.
- **CSS3**: Vanilla CSS handling all animations, theming, and responsive glassmorphism layouts.
- **JavaScript (Vanilla)**: Core game logic, state management, event listeners, and API fetching. No frameworks required!

## 🚀 How to Run Locally

Since this is a client-side only application, running it is incredibly simple:

1. Clone this repository or download the files.
2. Navigate to the `lexi-weight` folder.
3. Open `index.html` directly in any modern web browser.
4. No build steps, no dependencies, no local servers required!

## 🌐 Deployment (GitHub Pages)

You can host this game globally for free using GitHub Pages:
1. Push this repository to your GitHub account.
2. Go to your repository **Settings** -> **Pages**.
3. Under Build and Deployment, set the source to deploy from the `main` branch.
4. Save, and your game will be live on the internet!
