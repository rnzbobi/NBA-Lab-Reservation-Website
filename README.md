# NBA Lab Reservation Website Project

This repository contains a project for the CCAPDEV course. The HTML and CSS version is a prototype of how the final application should look and is not the fully functional version. The functional application can be set up and run locally through a Node.js server.

## Table of Contents

- [Setup](#setup)
- [Running the Application](#running-the-application)
- [Prototype](#prototype)
- [Sample Data](#sample-data)

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

    The `.env` file is already present in the `ProjectFolder` directory with the following content:

    ```env
    URL="mongodb://localhost:27017/lab_reservation"
    TOKEN_KEY="labReservePrivateKey"
    PORT=3000
    SECRET="secretKEY"
    ```

    You can modify these values as needed.

## Running the Application

1. **Start the server:**

    To start the Node.js server, run the following command in the `ProjectFolder` directory:

    ```bash
    node index.js
    ```

2. **Access the application:**

    Open your web browser and go to `http://localhost:3000` to view the application.

## Prototype

The HTML and CSS version located in the `HTML AND CSS VERSION` folder is a static prototype of the application's design and layout. It demonstrates how the application should look like but does not include the backend functionality.

## Sample Data

This repository includes 5 sample data entries for each JSON file. These samples are designed to help you understand the structure and expected content for the application's database.

Feel free to explore and modify the code to better suit your needs. If you encounter any issues, please open an issue on GitHub.

---
