import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "ru" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    "app.name": "Adaptiv",
    "app.tagline": "Adaptive learning with spaced repetition",
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel",
    "create": "Create",
    "submit": "Submit",
    "send": "Send",
    "delete": "Delete",
    "edit": "Edit",
    "close": "Close",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "search": "Search",
    "filter": "Filter",
    "sort": "Sort",
    "actions": "Actions",
    "status": "Status",
    "name": "Name",
    "email": "Email",
    "password": "Password",
    "role": "Role",
    "student": "Student",
    "teacher": "Teacher",
    "admin": "Admin",
    "login": "Log In",
    "logout": "Log Out",
    "register": "Sign Up",
    "welcome": "Welcome",
    "welcomeBack": "Welcome back",
    "noAccount": "Don't have an account?",
    "hasAccount": "Already have an account?",
    "loginToContinue": "Please log in to continue",
    
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.myAssignments": "My Assignments",
    "nav.teacher": "Teacher",
    "nav.aiTutor": "AI Tutor",
    "nav.submissions": "Submissions",
    "nav.aiRules": "AI Rules",
    "nav.teacherVideos": "Manage Videos",
    "nav.courses": "Courses",
    "nav.topics": "Topics",
    "nav.flashcards": "Flashcards",
    "nav.reviews": "Reviews",
    
    // Dashboard
    "dashboard.subjects": "Subjects",
    "dashboard.dueNow": "Due now",
    "dashboard.reviewedToday": "Reviewed today",
    "dashboard.successRate": "Success rate",
    "dashboard.addCourse": "+ Add Course",
    "dashboard.noCourses": "No courses yet",
    "dashboard.createCourseHint": "Click \"+ Add Course\" to begin",
    "dashboard.topics": "topics",
    "dashboard.cardsDue": "cards due",
    "dashboard.addTopic": "+ Topic",
    "dashboard.noTopics": "No topics yet",
    "dashboard.addTopicHint": "Add a topic to start building flashcards",
    "dashboard.addCard": "+ Card",
    "dashboard.review": "Review",
    "dashboard.selected": "Selected",
    "dashboard.question": "Question",
    "dashboard.answer": "Answer",
    
    // Auth
    "auth.loginTitle": "Welcome Back",
    "auth.registerTitle": "Create Account",
    "auth.name": "Full Name",
    "auth.selectRole": "Select your role",
    "auth.loginBtn": "Sign In",
    "auth.registerBtn": "Sign Up",
    "auth.loginLink": "Sign In",
    "auth.registerLink": "Sign Up",
    "auth.error.emailExists": "Email already registered",
    "auth.error.invalidCredentials": "Invalid credentials",
    
    // Homework
    "homework.assignments": "Assignments",
    "homework.noAssignments": "No assignments available",
    "homework.deadline": "Deadline",
    "homework.status.pending": "Pending",
    "homework.status.reviewed": "Reviewed",
    "homework.status.aiReviewed": "AI Reviewed",
    "homework.status.notSubmitted": "Not Submitted",
    "homework.yourSubmission": "Your Submission",
    "homework.noText": "No text submitted",
    "homework.submitAssignment": "Submit Assignment",
    "homework.feedbackChat": "Feedback Chat",
    "homework.noMessages": "No messages yet. Start the conversation!",
    "homework.askAI": "Ask AI Assistant",
    "homework.typeMessage": "Type your message...",
    "homework.aiTutor": "AI Tutor",
    "homework.teacher": "Teacher",
    "homework.you": "You",
    "homework.assignment": "Assignment",
    "homework.description": "Description",
    "homework.answer": "Your Answer",
    "homework.writeSolution": "Write your solution here...",
    "homework.attachments": "Attachments",
    "homework.attachFile": "Attach File",
    "homework.fileAttached": "File attached",
    "homework.uploading": "Uploading...",
    "homework.uploadError": "File upload failed",
    "homework.maxFileSize": "Max 10 MB",
    "homework.attachedFile": "Attached file",
    "homework.hasAttachment": "Has attachment",
    
    // Teacher
    "teacher.yourAssignments": "Your Assignments",
    "teacher.studentSubmissions": "Student Submissions",
    "teacher.noSubmissions": "No submissions yet",
    "teacher.aiPersona": "AI Persona Prompt",
    "teacher.aiPersonaHint": "This prompt defines HOW the AI tutor behaves",
    "teacher.personaPlaceholder": "Explain concepts like Socrates, ask guiding questions...",
    "teacher.strictMode": "Strict mode — AI answers ONLY from uploaded materials",
    "teacher.saveRule": "Save Rule",
    "teacher.uploadMaterial": "Upload Course Material",
    "teacher.uploadHint": "Paste text content or notes for this course",
    "teacher.filename": "Filename",
    "teacher.filenamePlaceholder": "e.g. algebra-notes.txt",
    "teacher.content": "Content",
    "teacher.contentPlaceholder": "Paste your course material here...",
    "teacher.upload": "Upload Material",
    "teacher.uploadedMaterials": "Uploaded Materials",
    "teacher.noMaterials": "No materials uploaded yet",
    "teacher.selectCourse": "Select course",
    
    // AI Tutor
    "tutor.title": "AI Tutor",
    "tutor.placeholder": "Ask anything about your studies...",
    "tutor.send": "Send",
    "tutor.thinking": "Thinking...",
    "tutor.sources": "Sources",
    
    // Review
    "review.title": "Review",
    "review.progress": "Progress",
    "review.question": "Question",
    "review.showAnswer": "Show Answer",
    "review.correct": "Correct",
    "review.incorrect": "Incorrect",
    "review.hard": "Hard",
    "review.easy": "Easy",
    "review.results": "Results",
    "review.completed": "Completed",
    "review.accuracy": "Accuracy",
    "review.timeSpent": "Time spent",
    "review.cardsReviewed": "Cards reviewed",
    "review.streak": "Streak",
    "review.again": "Again",
    
    // Videos
    "nav.videos": "Videos",
    "videos.manage": "Manage Videos",
    "videos.addVideo": "Add Video",
    "videos.videoTitle": "Video Title",
    "videos.titlePlaceholder": "e.g. Introduction to Algebra",
    "videos.videoDescription": "Description",
    "videos.descPlaceholder": "Brief description of the video content...",
    "videos.sourceType": "Video Source",
    "videos.externalLink": "External Link (YouTube, etc.)",
    "videos.uploadFile": "Upload File",
    "videos.videoUrl": "Video URL",
    "videos.uploadComingSoon": "File upload coming soon. Please use external links for now.",
    "videos.yourVideos": "Your Videos",
    "videos.noVideos": "No videos yet.",
    "videos.watch": "Watch",

    // Settings
    "settings.language": "Language",
    "settings.russian": "Russian",
    "settings.english": "English",
    "settings.theme": "Theme",
    "settings.light": "Light",
    "settings.dark": "Dark",
  },
  ru: {
    // Common
    "app.name": "Адаптив",
    "app.tagline": "Адаптивное обучение с интервальным повторением",
    "loading": "Загрузка...",
    "save": "Сохранить",
    "cancel": "Отмена",
    "create": "Создать",
    "submit": "Отправить",
    "send": "Отправить",
    "delete": "Удалить",
    "edit": "Редактировать",
    "close": "Закрыть",
    "back": "Назад",
    "next": "Далее",
    "previous": "Назад",
    "search": "Поиск",
    "filter": "Фильтр",
    "sort": "Сортировка",
    "actions": "Действия",
    "status": "Статус",
    "name": "Имя",
    "email": "Email",
    "password": "Пароль",
    "role": "Роль",
    "student": "Студент",
    "teacher": "Учитель",
    "admin": "Админ",
    "login": "Войти",
    "logout": "Выйти",
    "register": "Регистрация",
    "welcome": "Добро пожаловать",
    "welcomeBack": "С возвращением",
    "noAccount": "Нет аккаунта?",
    "hasAccount": "Уже есть аккаунт?",
    "loginToContinue": "Войдите, чтобы продолжить",
    
    // Navigation
    "nav.dashboard": "Главная",
    "nav.myAssignments": "Мои задания",
    "nav.teacher": "Учитель",
    "nav.aiTutor": "ИИ-Репетитор",
    "nav.submissions": "Работы",
    "nav.aiRules": "Правила ИИ",
    "nav.teacherVideos": "Управление видео",
    "nav.courses": "Курсы",
    "nav.topics": "Темы",
    "nav.flashcards": "Карточки",
    "nav.reviews": "Повторения",
    
    // Dashboard
    "dashboard.subjects": "Курсов",
    "dashboard.dueNow": "На повторение",
    "dashboard.reviewedToday": "Повторено сегодня",
    "dashboard.successRate": "Успешность",
    "dashboard.addCourse": "+ Добавить курс",
    "dashboard.noCourses": "Пока нет курсов",
    "dashboard.createCourseHint": "Нажмите \"+ Добавить курс\" чтобы начать",
    "dashboard.topics": "тем",
    "dashboard.cardsDue": "карточек на повторение",
    "dashboard.addTopic": "+ Тема",
    "dashboard.noTopics": "Пока нет тем",
    "dashboard.addTopicHint": "Добавьте тему, чтобы создавать карточки",
    "dashboard.addCard": "+ Карточка",
    "dashboard.review": "Повторять",
    "dashboard.selected": "Выбрано",
    "dashboard.question": "Вопрос",
    "dashboard.answer": "Ответ",
    
    // Auth
    "auth.loginTitle": "С возвращением",
    "auth.registerTitle": "Создать аккаунт",
    "auth.name": "Полное имя",
    "auth.selectRole": "Выберите роль",
    "auth.loginBtn": "Войти",
    "auth.registerBtn": "Зарегистрироваться",
    "auth.loginLink": "Войти",
    "auth.registerLink": "Зарегистрироваться",
    "auth.error.emailExists": "Email уже зарегистрирован",
    "auth.error.invalidCredentials": "Неверные учетные данные",
    
    // Homework
    "homework.assignments": "Задания",
    "homework.noAssignments": "Нет доступных заданий",
    "homework.deadline": "Срок сдачи",
    "homework.status.pending": "На проверке",
    "homework.status.reviewed": "Проверено",
    "homework.status.aiReviewed": "Проверено ИИ",
    "homework.status.notSubmitted": "Не сдано",
    "homework.yourSubmission": "Ваше решение",
    "homework.noText": "Текст не добавлен",
    "homework.submitAssignment": "Отправить задание",
    "homework.feedbackChat": "Чат обратной связи",
    "homework.noMessages": "Пока нет сообщений. Начните диалог!",
    "homework.askAI": "Спросить ИИ-ассистента",
    "homework.typeMessage": "Введите сообщение...",
    "homework.aiTutor": "ИИ-Репетитор",
    "homework.teacher": "Учитель",
    "homework.you": "Вы",
    "homework.assignment": "Задание",
    "homework.description": "Описание",
    "homework.answer": "Ваш ответ",
    "homework.writeSolution": "Напишите ваше решение здесь...",
    "homework.attachments": "Вложения",
    "homework.attachFile": "Прикрепить файл",
    "homework.fileAttached": "Файл прикреплен",
    "homework.uploading": "Загрузка...",
    "homework.uploadError": "Ошибка загрузки файла",
    "homework.maxFileSize": "Макс. 10 МБ",
    "homework.attachedFile": "Прикрепленный файл",
    "homework.hasAttachment": "Есть вложение",
    
    // Teacher
    "teacher.yourAssignments": "Ваши задания",
    "teacher.studentSubmissions": "Работы студентов",
    "teacher.noSubmissions": "Пока нет работ",
    "teacher.aiPersona": "Промпт для ИИ",
    "teacher.aiPersonaHint": "Этот промпт определяет, КАК ведет себя ИИ-репетитор",
    "teacher.personaPlaceholder": "Объясняй как Сократ, задавай наводящие вопросы...",
    "teacher.strictMode": "Строгий режим — ИИ отвечает ТОЛЬКО по загруженным материалам",
    "teacher.saveRule": "Сохранить правило",
    "teacher.uploadMaterial": "Загрузить материал",
    "teacher.uploadHint": "Вставьте текст или заметки для этого курса",
    "teacher.filename": "Имя файла",
    "teacher.filenamePlaceholder": "например, algebra-notes.txt",
    "teacher.content": "Содержание",
    "teacher.contentPlaceholder": "Вставьте материал курса здесь...",
    "teacher.upload": "Загрузить",
    "teacher.uploadedMaterials": "Загруженные материалы",
    "teacher.noMaterials": "Материалы еще не загружены",
    "teacher.selectCourse": "Выберите курс",
    
    // AI Tutor
    "tutor.title": "ИИ-Репетитор",
    "tutor.placeholder": "Спросите что-нибудь об учебе...",
    "tutor.send": "Отправить",
    "tutor.thinking": "Думаю...",
    "tutor.sources": "Источники",
    
    // Review
    "review.title": "Повторение",
    "review.progress": "Прогресс",
    "review.question": "Вопрос",
    "review.showAnswer": "Показать ответ",
    "review.correct": "Правильно",
    "review.incorrect": "Неправильно",
    "review.hard": "Сложно",
    "review.easy": "Легко",
    "review.results": "Результаты",
    "review.completed": "Завершено",
    "review.accuracy": "Точность",
    "review.timeSpent": "Время",
    "review.cardsReviewed": "Карточек повторено",
    "review.streak": "Серия",
    "review.again": "Снова",
    
    // Videos
    "nav.videos": "Видео",
    "videos.manage": "Управление видео",
    "videos.addVideo": "Добавить видео",
    "videos.videoTitle": "Название видео",
    "videos.titlePlaceholder": "например, Введение в алгебру",
    "videos.videoDescription": "Описание",
    "videos.descPlaceholder": "Краткое описание содержания видео...",
    "videos.sourceType": "Источник видео",
    "videos.externalLink": "Внешняя ссылка (YouTube и др.)",
    "videos.uploadFile": "Загрузить файл",
    "videos.videoUrl": "Ссылка на видео",
    "videos.uploadComingSoon": "Загрузка файлов скоро будет доступна. Используйте внешние ссылки.",
    "videos.yourVideos": "Ваши видео",
    "videos.noVideos": "Пока нет видео.",
    "videos.watch": "Смотреть",

    // Settings
    "settings.language": "Язык",
    "settings.russian": "Русский",
    "settings.english": "English",
    "settings.theme": "Тема",
    "settings.light": "Светлая",
    "settings.dark": "Темная",
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language") as Language;
    return saved === "ru" || saved === "en" ? saved : "ru";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within LanguageProvider");
  return ctx;
};
