export type Language = 'he' | 'en';

export const translations = {
  he: {
    // Navigation & Common
    brandName: 'Study Smarter',
    navPlan: 'תוכנית לימודים',
    navMatrix: 'מטריצת נושאים',
    navSimulation: 'סימולציה',
    navUpload: 'העלאת מבחן',
    navMyCourses: '← הקורסים שלי',

    // Auth / Landing Page
    loginTitle: 'התחברות למערכת',
    signupTitle: 'יצירת חשבון חדש',
    loginSubtitle: 'הכנס את הפרטים כדי לגשת לקורסים שלך',
    signupSubtitle: 'הרשם והתחל לנהל את הקורסים שלך',
    emailLabel: 'דוא"ל',
    passwordLabel: 'סיסמה',
    submitLogin: 'התחבר לחשבון',
    submitSignup: 'הרשם כעת',
    toggleSignup: 'אין לך חשבון? הרשם כעת',
    toggleLogin: 'כבר נרשמת? התחבר כאן',
    heroTag: '🚀 פלטפורמת ה-AI הבלעדית לסטודנטים',
    heroTitle: 'ללמוד למבחנים חכם יותר,',
    heroTitleHighlight: '100% מתואם לחומרי הקורס שלך.',
    heroDescription: 'SS - Study Smarter הופכת את סיכומי כתב היד, הסילבוסים ומבחני העבר שלך למאגר תרגול ממוקד.',

    // Topic Matrix
    matrixTitle: 'מטריצת נושאי הבחינות',
    matrixSubtitle: 'לחץ על נושא בסילבוס כדי להתחיל לתרגל את השאלות המקושרות אליו.',
    syllabusTopic: 'נושא בסילבוס',
    solvedSuccess: 'נפתר בהצלחה',
    needsReview: 'נדרשת חזרה',
    noQuestion: 'ללא שאלה',
  },
  en: {
    // Navigation & Common
    brandName: 'Study Smarter',
    navPlan: 'Study Plan',
    navMatrix: 'Topic Matrix',
    navSimulation: 'Simulation',
    navUpload: 'Upload Exam',
    navMyCourses: '← My Courses',

    // Auth / Landing Page
    loginTitle: 'Login to System',
    signupTitle: 'Create New Account',
    loginSubtitle: 'Enter your credentials to access your courses',
    signupSubtitle: 'Register and start managing your courses',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    submitLogin: 'Login',
    submitSignup: 'Register Now',
    toggleSignup: "Don't have an account? Register now",
    toggleLogin: 'Already registered? Login here',
    heroTag: '🚀 Exclusive AI Platform for Students',
    heroTitle: 'Study for exams smarter,',
    heroTitleHighlight: '100% aligned with your course materials.',
    heroDescription: 'SS - Study Smarter transforms your handwritten summaries, syllabi, and past exams into targeted practice sets.',

    // Topic Matrix
    matrixTitle: 'Topic Mastery Matrix',
    matrixSubtitle: 'Click on a syllabus topic to practice questions linked to it.',
    syllabusTopic: 'Syllabus Topic',
    solvedSuccess: 'Solved Successfully',
    needsReview: 'Needs Review',
    noQuestion: 'No Question',
  },
};