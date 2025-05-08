module.exports = {
    dbConfig: {
        HOST: process.env.DB_HOST,
        PORT: process.env.DB_PORT,
        USER: process.env.DB_USER,
        PASSWORD: process.env.DB_PASSWORD,
        DATABASE: process.env.DB_NAME
    },
    START_TIMEOUT_MSEC: process.env.START_TIMEOUT_MSEC,
    MAX_ATTEMPTS: 5,
    ATTEMPTS_TIMEOUT_MIN: 15,
    CLEANUP_INTERVAL_HOURS: 1,
    VERIFY_PROMPT_DURATION_SEC: 60,
    MENTIONED_MESSAGE_DURATION_SEC: 10,
    KICKED_MESSAGE_DURATION_SEC: 30,
    KICK_REASONS : {
        VIOLENCE: "Violence",
        ILLEGAL_GOODS: "Illegal goods",
        ILLEGAL_CONTENT: "Illegal content",
        PERSONAL_DATA: "Personal data",
        SCAM_OR_SPAM: "Scam or spam",
        COURSE_OFFERS: "Course offers",
        SELLING_SERVICES: "Selling services",
        FINANCIAL_HELP: "Asking for a financial help",
        ONLINE_EDUCATION: "Online education offers",
        DATING: "Dating proposal",
        OTHER: "Other" 
    },
    SPAM_REASONS : {
        VIOLENCE: "Violence",
        ILLEGAL_GOODS: "Illegal goods",
        ILLEGAL_CONTENT: "Illegal content",
        ILLEGAL_WORK: "Illegal work",
        SCAM_OR_SPAM: "Scam or spam",
        FAST_MONEY: "Fast money",
        CRYPTO: "Earn with Crypto"
    },
    USERS_TABLE_NAME: process.env.NODE_ENV === 'production' ? 'users' : 'users_test'
};
