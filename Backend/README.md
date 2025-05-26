# NodeJS backend for the Rabobank Frontend assignment

This backend is a real plain express service to serve one file of transactions. To see the model of the transaction
feel free to take a look into the `transactions.json` file.

- Start with npm install ```npm install```
- Running the server you need to run:
    - Mac: ```npm run start:mac```
    - Windows: ```npm run start:windows```

> - This command will run the typescript compiler
> - Copies the transaction.json file to the dist folder
> - Run the express service on port `8080`

## Endpoints

This service will exist of two endpoints:

- `/` which will say OK if the service is running correctly
- `/api/transactions` which will return a json file with transactions


# That's it, happy 💻!
