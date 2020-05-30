export default () => ({
    dev: {
        environmentname: process.env.DEV_ENV_NAME,
        web: {
            protocol: process.env.DEV_PROTOCOL,
            host: process.env.DEV_HOST,
            port: process.env.DEV_PORT,
        },
        database: {
                    host: process.env.DEV_DATABASE_HOST,
                    port: parseInt(process.env.DEV_DATABASE_PORT, 10) || 3001,
                    name: process.env.DEV_DATABASE_NAME,
                    user: process.env.DEV_DATABASE_USER,
                    password: process.env.DEV_DATABASE_PASSWORD,
                    authDatabase: process.env.DEV_AUTHDATABASE_NAME,
                },
    },
    prod : {

    },
  });
