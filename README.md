# Transit - Logistics Application

This is a simple logistics application built on the DFINITY Internet Computer platform for managing users, orders, shipments, and payments.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- [Node.js](https://nodejs.org/) installed.
- [DFINITY Canister SDK](https://sdk.dfinity.org/docs) installed.

## Setup

1. Clone the repository:

   ```shell
   git clone https://github.com/bryanbill/transit-canister.git
   cd transit-canister
   ```

2. Install dependencies:

   ```shell
    npm install
    ```

3. Build and Deploy the canister:

   ```shell
   npm start
   ```

4. Deploy the frontend:

Running the following command will deploy the frontend to the Internet Computer. The first
time it will take a while to deploy the frontend, but subsequent deploys will be much faster.

   ```shell
   npm run deploy
   ```

