Start Your Local Web Server:

    Open your Command Prompt (or Git Bash).

    Navigate to your game folder:
    Bash

    cd "C:\Users\desch\Desktop\Idle Game"

Start the server:

        python -m http.server



Open Your Game in the Browser:

        Go to http://localhost:8000/ in your web browser.

Make Changes to Your Files:

        Open index.html, style.css, or game.js in your text editor (e.g., VS Code).

        

Save & Refresh:

        Save the files in your text editor.

        Go back to your browser and refresh the page (Ctrl + R or Cmd + R).

        



Part 2: Updating GitHub (Pushing Your Changes Online)

    Stop Your Local Web Server:

        Press Ctrl + C to stop the server.

Open a New Command Prompt and Navigate to Your Game Folder:

      cd "C:\Users\desch\Desktop\Idle Game"

Check What You've Changed:

    This command shows you which files are modified or new.
    Bash

      git status

Stage Your Changes:

    This prepares all your modified/new files to be included in the next "snapshot."
    Bash

      git add .

Commit Your Changes:

    This creates a "snapshot" of your project with a descriptive message.
    Bash

      git commit -m "Your clear and concise message about what you did"

    Example message: "Added new inventory sorting feature and fixed player HP display."

Push Your Changes to GitHub:

    This sends your committed snapshot from your computer to your GitHub repository.
    Bash

      git push origin main

    You might be asked for your GitHub username/password or to authenticate in your browser the first time after a while.

Verify on GitHub Pages:

    Go to your GitHub Pages URL (e.g., https://Edditn.github.io/idle-game/).

    Wait a few minutes (GitHub Pages needs time to process).

    Hard refresh your browser (Ctrl + Shift + R or Cmd + Shift + R).

    You should see your latest updates live!# idle-game
Edds Test Idle Game
