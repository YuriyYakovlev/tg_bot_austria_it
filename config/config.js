module.exports = {
    dbConfig: {
        HOST: process.env.DB_HOST,
        USER: process.env.DB_USER,
        PASSWORD: process.env.DB_PASSWORD,
        DATABASE: process.env.DB_NAME
    },
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
    USERS_TABLE_NAME: process.env.NODE_ENV === 'production' ? 'users' : 'users_test'
};
