-- 1. departments
CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL
);

-- 2. students
CREATE TABLE IF NOT EXISTS students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    department_id INT,
    image_url VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 3. sessions
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1
);

-- 4. session_participants
CREATE TABLE IF NOT EXISTS session_participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(50) NOT NULL,
    session_id VARCHAR(50) NOT NULL,
    is_representative TINYINT(1) DEFAULT 0,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    UNIQUE(student_id, session_id)
);

-- 5. questions_bank
CREATE TABLE IF NOT EXISTS questions_bank (
    id INT PRIMARY KEY AUTO_INCREMENT,
    text TEXT NOT NULL,
    answer TEXT NOT NULL,
    incorrect_option_1 TEXT,
    incorrect_option_2 TEXT,
    incorrect_option_3 TEXT,
    category VARCHAR(100) DEFAULT 'General',
    difficulty INT DEFAULT 1,
    topic VARCHAR(100) DEFAULT 'General',
    question_type VARCHAR(50) DEFAULT 'text',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1
);

-- 6. session_questions
CREATE TABLE IF NOT EXISTS session_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(50) NOT NULL,
    question_id INT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions_bank(id) ON DELETE CASCADE,
    UNIQUE(session_id, question_id)
);

-- 7. question_scores
CREATE TABLE IF NOT EXISTS student_question_scores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(50) NOT NULL,
    session_id VARCHAR(50) NOT NULL,
    question_id INT NOT NULL,
    score INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions_bank(id),
    UNIQUE(student_id, session_id, question_id)
);

-- 8. student_scores
CREATE TABLE IF NOT EXISTS student_scores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(50) NOT NULL,
    session_id VARCHAR(50) NOT NULL,
    score INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    UNIQUE(student_id, session_id)
);

-- 9. department_scores
CREATE TABLE IF NOT EXISTS department_scores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    department_id INT NOT NULL,
    session_id VARCHAR(50) NOT NULL,
    score INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    UNIQUE(department_id, session_id)
);

-- 10. admins
CREATE TABLE IF NOT EXISTS admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
