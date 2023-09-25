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

## Usage

To use the application, open the URL generated in your browser then follow the steps below to get the core functionality of the application.

1. createUser - Create 3 different users, 2 as of type 'user' and 1 of type 'driver'

2. createUserLocation - Using the 3 users created in 1, create their respective locations

3. createOrder - Creating an order depends on the first two methods, it uses the user data and the location detail to calculate the transport amount `initial_amount`.

4. createShipment - Shipping requires an order id, a driver, a pickup location (sender location) and a delivery location (receiver location).
