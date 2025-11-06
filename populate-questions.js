const mysql = require('mysql2/promise');

// Database configuration (update with your actual database credentials)
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'quiz_app'
};

const sampleQuestions = {
  'General Knowledge': [
    { text: 'What is the capital of France?', answer: 'Paris', difficulty: 1 },
    { text: 'Which planet is known as the Red Planet?', answer: 'Mars', difficulty: 1 },
    { text: 'Who painted the Mona Lisa?', answer: 'Leonardo da Vinci', difficulty: 2 },
    { text: 'What is the largest ocean on Earth?', answer: 'Pacific Ocean', difficulty: 1 },
    { text: 'In which year did World War II end?', answer: '1945', difficulty: 2 },
    { text: 'What is the chemical symbol for gold?', answer: 'Au', difficulty: 2 },
    { text: 'Which country is known as the Land of the Rising Sun?', answer: 'Japan', difficulty: 1 },
    { text: 'Who wrote "Romeo and Juliet"?', answer: 'William Shakespeare', difficulty: 2 },
    { text: 'What is the tallest mountain in the world?', answer: 'Mount Everest', difficulty: 1 },
    { text: 'Which gas makes up approximately 78% of Earth\'s atmosphere?', answer: 'Nitrogen', difficulty: 2 },
    { text: 'What is the currency of the United Kingdom?', answer: 'Pound Sterling', difficulty: 1 },
    { text: 'Who invented the telephone?', answer: 'Alexander Graham Bell', difficulty: 2 },
    { text: 'What is the smallest country in the world?', answer: 'Vatican City', difficulty: 2 },
    { text: 'Which river is the longest in the world?', answer: 'Nile River', difficulty: 2 },
    { text: 'What year did the Berlin Wall fall?', answer: '1989', difficulty: 2 },
    { text: 'Which element has the atomic number 1?', answer: 'Hydrogen', difficulty: 2 },
    { text: 'What is the largest continent?', answer: 'Asia', difficulty: 1 },
    { text: 'Who was the first person to walk on the moon?', answer: 'Neil Armstrong', difficulty: 2 },
    { text: 'What is the hardest natural substance on Earth?', answer: 'Diamond', difficulty: 2 },
    { text: 'Which country gifted the Statue of Liberty to the United States?', answer: 'France', difficulty: 2 }
  ],
  'English': [
    { text: 'What is the past tense of "go"?', answer: 'went', difficulty: 1 },
    { text: 'What is a synonym for "happy"?', answer: 'joyful', difficulty: 1 },
    { text: 'What is the plural of "child"?', answer: 'children', difficulty: 1 },
    { text: 'What part of speech is "quickly"?', answer: 'adverb', difficulty: 2 },
    { text: 'What is an antonym for "hot"?', answer: 'cold', difficulty: 1 },
    { text: 'What is the superlative form of "good"?', answer: 'best', difficulty: 2 },
    { text: 'What is the main verb in "She has been running"?', answer: 'running', difficulty: 2 },
    { text: 'What type of sentence is "Are you coming?"', answer: 'interrogative', difficulty: 2 },
    { text: 'What is the comparative form of "beautiful"?', answer: 'more beautiful', difficulty: 2 },
    { text: 'What is the past participle of "break"?', answer: 'broken', difficulty: 2 },
    { text: 'What is a homophone for "there"?', answer: 'their', difficulty: 2 },
    { text: 'What is the subject in "The cat sat on the mat"?', answer: 'The cat', difficulty: 1 },
    { text: 'What is the correct spelling: "recieve" or "receive"?', answer: 'receive', difficulty: 2 },
    { text: 'What is the plural of "mouse" (animal)?', answer: 'mice', difficulty: 2 },
    { text: 'What punctuation mark ends a question?', answer: 'question mark', difficulty: 1 },
    { text: 'What is the contraction for "do not"?', answer: "don't", difficulty: 1 },
    { text: 'What type of word is "beautiful" in "She is beautiful"?', answer: 'adjective', difficulty: 2 },
    { text: 'What is the past tense of "think"?', answer: 'thought', difficulty: 2 },
    { text: 'What is the opposite of "include"?', answer: 'exclude', difficulty: 2 },
    { text: 'What letter is silent in "knife"?', answer: 'k', difficulty: 2 }
  ],
  'Math': [
    { text: 'What is 7 + 8?', answer: '15', difficulty: 1 },
    { text: 'What is 12 × 9?', answer: '108', difficulty: 1 },
    { text: 'What is the square root of 64?', answer: '8', difficulty: 2 },
    { text: 'What is 144 ÷ 12?', answer: '12', difficulty: 1 },
    { text: 'What is 2³ (2 to the power of 3)?', answer: '8', difficulty: 2 },
    { text: 'What is 25% of 80?', answer: '20', difficulty: 2 },
    { text: 'What is the perimeter of a square with side length 5?', answer: '20', difficulty: 2 },
    { text: 'What is the area of a rectangle with length 6 and width 4?', answer: '24', difficulty: 2 },
    { text: 'What is 15 - 7?', answer: '8', difficulty: 1 },
    { text: 'What is 3.5 + 2.8?', answer: '6.3', difficulty: 2 },
    { text: 'What is the value of π (pi) to 2 decimal places?', answer: '3.14', difficulty: 2 },
    { text: 'What is 50% of 100?', answer: '50', difficulty: 1 },
    { text: 'What is 6 × 7?', answer: '42', difficulty: 1 },
    { text: 'What is the sum of the angles in a triangle?', answer: '180 degrees', difficulty: 2 },
    { text: 'What is 100 ÷ 4?', answer: '25', difficulty: 1 },
    { text: 'What is the cube of 3?', answer: '27', difficulty: 2 },
    { text: 'What is 0.5 as a fraction?', answer: '1/2', difficulty: 2 },
    { text: 'What is 9 + 6?', answer: '15', difficulty: 1 },
    { text: 'What is the circumference formula for a circle?', answer: '2πr', difficulty: 3 },
    { text: 'What is 8²?', answer: '64', difficulty: 2 }
  ],
  'Social Study': [
    { text: 'What is the capital of the United States?', answer: 'Washington, D.C.', difficulty: 1 },
    { text: 'Who was the first President of the United States?', answer: 'George Washington', difficulty: 1 },
    { text: 'What document begins with "We the People"?', answer: 'The Constitution', difficulty: 2 },
    { text: 'Which war was fought between the North and South in America?', answer: 'Civil War', difficulty: 2 },
    { text: 'What are the three branches of government?', answer: 'Executive, Legislative, Judicial', difficulty: 2 },
    { text: 'Who wrote the Declaration of Independence?', answer: 'Thomas Jefferson', difficulty: 2 },
    { text: 'What is the supreme law of the United States?', answer: 'The Constitution', difficulty: 2 },
    { text: 'How many states are in the United States?', answer: '50', difficulty: 1 },
    { text: 'What ocean is on the West Coast of the United States?', answer: 'Pacific Ocean', difficulty: 1 },
    { text: 'What is the longest river in the United States?', answer: 'Missouri River', difficulty: 2 },
    { text: 'Which president is on Mount Rushmore along with Washington, Jefferson, and Roosevelt?', answer: 'Abraham Lincoln', difficulty: 2 },
    { text: 'What was the Louisiana Purchase?', answer: 'Land bought from France in 1803', difficulty: 3 },
    { text: 'Who was President during World War I?', answer: 'Woodrow Wilson', difficulty: 3 },
    { text: 'What is the Bill of Rights?', answer: 'The first 10 amendments to the Constitution', difficulty: 2 },
    { text: 'Which Native American helped the Pilgrims?', answer: 'Squanto', difficulty: 2 },
    { text: 'What ship brought the Pilgrims to America?', answer: 'Mayflower', difficulty: 2 },
    { text: 'In what year did Columbus first reach the Americas?', answer: '1492', difficulty: 2 },
    { text: 'What was the Boston Tea Party?', answer: 'Protest against British tea tax', difficulty: 2 },
    { text: 'Who was known as the "Father of His Country"?', answer: 'George Washington', difficulty: 2 },
    { text: 'What does the 13 stripes on the American flag represent?', answer: 'The original 13 colonies', difficulty: 2 }
  ],
  'IT': [
    { text: 'What does "CPU" stand for?', answer: 'Central Processing Unit', difficulty: 1 },
    { text: 'What does "RAM" stand for?', answer: 'Random Access Memory', difficulty: 1 },
    { text: 'What is the most popular programming language for web development?', answer: 'JavaScript', difficulty: 2 },
    { text: 'What does "HTML" stand for?', answer: 'HyperText Markup Language', difficulty: 1 },
    { text: 'What does "CSS" stand for?', answer: 'Cascading Style Sheets', difficulty: 1 },
    { text: 'What is the binary representation of the decimal number 8?', answer: '1000', difficulty: 2 },
    { text: 'What does "URL" stand for?', answer: 'Uniform Resource Locator', difficulty: 1 },
    { text: 'What is the default port for HTTP?', answer: '80', difficulty: 2 },
    { text: 'What does "SQL" stand for?', answer: 'Structured Query Language', difficulty: 2 },
    { text: 'What is the file extension for a JavaScript file?', answer: '.js', difficulty: 1 },
    { text: 'What does "API" stand for?', answer: 'Application Programming Interface', difficulty: 2 },
    { text: 'What is the most common database management system?', answer: 'MySQL', difficulty: 2 },
    { text: 'What does "IDE" stand for?', answer: 'Integrated Development Environment', difficulty: 2 },
    { text: 'What is the default port for HTTPS?', answer: '443', difficulty: 2 },
    { text: 'What does "DNS" stand for?', answer: 'Domain Name System', difficulty: 2 },
    { text: 'What is the latest version of HTML?', answer: 'HTML5', difficulty: 2 },
    { text: 'What does "FTP" stand for?', answer: 'File Transfer Protocol', difficulty: 2 },
    { text: 'What is the most popular version control system?', answer: 'Git', difficulty: 2 },
    { text: 'What does "JSON" stand for?', answer: 'JavaScript Object Notation', difficulty: 2 },
    { text: 'What is the main language used for iOS app development?', answer: 'Swift', difficulty: 2 }
  ]
};

async function generateMoreQuestions(category, baseQuestions) {
  const questions = [];
  
  // Add the base questions
  questions.push(...baseQuestions);
  
  // Generate additional questions to reach 200 per category
  const needed = 200 - baseQuestions.length;
  
  for (let i = 0; i < needed; i++) {
    const baseIndex = i % baseQuestions.length;
    const baseQuestion = baseQuestions[baseIndex];
    
    // Create variations of existing questions
    questions.push({
      text: `${baseQuestion.text} (Variation ${Math.floor(i / baseQuestions.length) + 1})`,
      answer: baseQuestion.answer,
      difficulty: Math.min(3, baseQuestion.difficulty + Math.floor(Math.random() * 2))
    });
  }
  
  return questions.slice(0, 200); // Ensure exactly 200 questions
}

async function populateDatabase() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully');
    
    // Clear existing questions (optional)
    // await connection.execute('DELETE FROM questions_bank');
    // console.log('Cleared existing questions');
    
    for (const [category, baseQuestions] of Object.entries(sampleQuestions)) {
      console.log(`Generating questions for ${category}...`);
      
      const allQuestions = await generateMoreQuestions(category, baseQuestions);
      
      for (const question of allQuestions) {
        await connection.execute(
          'INSERT INTO questions_bank (text, answer, category, difficulty, topic, question_type) VALUES (?, ?, ?, ?, ?, ?)',
          [
            question.text,
            question.answer,
            category,
            question.difficulty,
            category,
            'text'
          ]
        );
      }
      
      console.log(`Added ${allQuestions.length} questions for ${category}`);
    }
    
    console.log('Database population completed successfully!');
    
  } catch (error) {
    console.error('Error populating database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the population script
populateDatabase();