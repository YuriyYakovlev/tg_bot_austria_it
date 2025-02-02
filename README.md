## Introduction
This chatbot was created in attempt to protect the Telegram chat from spam. This project is open and everyone can contribute to its development and improvement.

## Description
The chatbot is designed to identify and block spam messages in group chats. The bot uses a number of technologies to filter content, which helps to ensure the cleanliness and security of the communication space. The bot's functionality includes user verification via CAPTCHA, monitoring messages for unwanted content, and dynamic access control to the chat.

## Technologies
The bot is built on the following technologies:

 - Node.js: The basis of the server side.
 - Telegram API: Interface for interacting with Telegram.
 - Pooling: A polling method for receiving updates from Telegram.
 - MySQL: A database management system for storing user data and interactions.
 - Docker: Containerization for easy deployment and portability of the service.

## How to join
The project is open source, and we welcome any contributions to the code, documentation, or feature ideas:

 - Fork: Make a fork of the repository.
 - Clone: Clone the repository to your local computer.
 - Branch: Create a new branch for each individual feature or fix.
 - Develop: Develop new functionality or make changes.
 - Pull Request: Submit a pull request to the main repository for review and discussion.

## License
The project is distributed under a free license, which allows the code to be used, modified, and distributed freely for any purpose.

## ffmpeg commands
ffmpeg -i 4K_168.mp4 -vf scale=640:50 -c:v libx264 -crf 23 -preset fast -c:a copy 4K_168_50.mp4

## Credits
Videezy.com - news video animation