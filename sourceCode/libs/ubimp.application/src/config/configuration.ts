export default () => ({
    id: process.env.ID,
    defaultLanguage: process.env.DEFAULT_LANGUAGE,
    dev: {
        passwordSaltRounds: process.env.DEV_PASSWORD_SALT_ROUNDS,
        environmentname: process.env.DEV_ENV_NAME,
        web: {
            protocol: process.env.DEV_WEB_PROTOCOL,
            host: process.env.DEV_WEB_HOST,
            port: process.env.DEV_WEB_PORT,
        },
        database: {
                    host: process.env.DEV_DATABASE_HOST,
                    port: parseInt(process.env.DEV_DATABASE_PORT, 10) || 27017,
                    name: process.env.DEV_DATABASE_NAME,
                    user: process.env.DEV_DATABASE_USER,
                    password: process.env.DEV_DATABASE_PASSWORD,
                    authDatabase: process.env.DEV_AUTHDATABASE_NAME,
                },
        microservice: {
                    protocol: process.env.DEV_MICROSERVICE_PROTOCOL,
                    port: process.env.DEV_MICROSERVICE_PORT,
                    host: process.env.DEV_MICROSERVICE_HOST,
                },
                    service: {
                    users: {
                        port: process.env.DEV_SERVICE_USERS_PORT,
                        protocol: process.env.DEV_SERVICE_USERS_PROTOCOL,
                        host: process.env.DEV_SERVICE_USERS_HOST,
                    },
                    infrastructure: {
                        port: process.env.DEV_SERVICE_INFRASTRUCTURE_PORT,
                        protocol: process.env.DEV_SERVICE_INFRASTRUCTURE_PROTOCOL,
                        host: process.env.DEV_SERVICE_INFRASTRUCTURE_HOST,
                    },
                },
        templates: {

            path: process.env.DEV_TAMPLATES_PATH,
            emailActivation: process.env.DEV_EMAIL_ACTIVATION_TEMPLATE,
        },
        tokens: {
            activation: { expiresIn: process.env.DEV_TOKEN_ACTIVATION_EXPIRES },
            access: { expiresIn: process.env.DEV_TOKEN_ACCESS_EXPIRES },
        },
    },
    prod : {

    },
  });
