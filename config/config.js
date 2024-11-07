module.exports = {
    dbConfig: {
        HOST: process.env.DB_HOST,
        USER: process.env.DB_USER,
        PASSWORD: process.env.DB_PASSWORD,
        DATABASE: process.env.DB_NAME
    },
    MAX_ATTEMPTS: 4,
    CLEANUP_INTERVAL_HOURS: 1,
    VERIFY_PROMPT_DURATION_SEC: 60,
    MENTIONED_MESSAGE_DURATION_SEC: 10,
    KICKED_MESSAGE_DURATION_SEC: 30,
    USERS_TABLE_NAME: process.env.NODE_ENV === 'production' ? 'users' : 'users_test'
};
