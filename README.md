# CCAPDEV Project

This repository contains a project for the CCAPDEV course. The HTML and CSS version is a prototype of how the final application should look and is not the fully functional version. The functional application can be set up and run locally through a Node.js server.

## Table of Contents

- [Setup](#setup)
- [Running the Application](#running-the-application)
- [Prototype](#prototype)

## Setup

1. **Clone the repository:**

    ```bash
    git clone https://github.com/rnzbobi/CCAPDEV.git
    cd CCAPDEV/ProjectFolder
    ```

2. **Install the dependencies:**

    Make sure you have [Node.js](https://nodejs.org/) installed. Then run the following command to install the required packages:

    ```bash
    npm install
    ```

3. **Setup environment variables:**

    Create a `.env` file in the `ProjectFolder` directory and add the necessary environment variables. An example `.env` file might look like this:

    ```env
    PORT=3000
    DB_URI=mongodb://localhost:27017/ccapdev
    ```

## Running the Application

1. **Start the server:**

    To start the Node.js server, run the following command in the `ProjectFolder` directory:

    ```bash
    npm start
    ```

2. **Access the application:**

    Open your web browser and go to `http://localhost:3000` to view the application.

## Prototype

The HTML and CSS version located in the `HTML AND CSS VERSION` folder is a static prototype of the application's design and layout. It demonstrates how the application should look like but does not include the backend functionality.

Feel free to explore and modify the code to better suit your needs. If you encounter any issues, please open an issue on GitHub.

---