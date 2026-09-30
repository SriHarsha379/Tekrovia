export type InteractiveQuestion = {
  id: string;
  category: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export const INTERACTIVE_QUESTIONS: InteractiveQuestion[] = [
  {
    id: 'python-1',
    category: 'Python',
    prompt: 'Which Python data structure stores key-value pairs?',
    options: ['List', 'Tuple', 'Dictionary', 'Set'],
    correctIndex: 2,
    explanation: 'A dictionary stores values associated with unique keys.',
  },
  {
    id: 'python-2',
    category: 'Python',
    prompt: 'What does a Python decorator commonly do?',
    options: [
      'Deletes a function',
      'Wraps or modifies a function’s behavior',
      'Converts Python to SQL',
      'Creates a database table',
    ],
    correctIndex: 1,
    explanation: 'A decorator wraps a function or class to extend or modify its behavior.',
  },
  {
    id: 'django-1',
    category: 'Django',
    prompt: 'In Django, what is the primary purpose of a model?',
    options: [
      'Define database-backed data structures',
      'Render CSS animations',
      'Configure browser cookies only',
      'Replace URL routing',
    ],
    correctIndex: 0,
    explanation: 'Django models define data structures and map them to database tables through the ORM.',
  },
  {
    id: 'api-1',
    category: 'REST APIs',
    prompt: 'Which HTTP method is conventionally used to retrieve a resource?',
    options: ['POST', 'GET', 'PATCH', 'DELETE'],
    correctIndex: 1,
    explanation: 'GET is conventionally used to retrieve a resource without changing server state.',
  },
  {
    id: 'api-2',
    category: 'REST APIs',
    prompt: 'What does HTTP status code 401 generally indicate?',
    options: [
      'The resource was created',
      'The request succeeded',
      'Authentication is required or invalid',
      'The server has permanently moved',
    ],
    correctIndex: 2,
    explanation: '401 indicates that valid authentication credentials are missing or were not accepted.',
  },
  {
    id: 'sql-1',
    category: 'Databases',
    prompt: 'Which SQL clause filters rows before grouping?',
    options: ['ORDER BY', 'WHERE', 'HAVING', 'LIMIT'],
    correctIndex: 1,
    explanation: 'WHERE filters rows before grouping; HAVING filters grouped results.',
  },
  {
    id: 'js-1',
    category: 'JavaScript',
    prompt: 'Which JavaScript keyword declares a block-scoped variable that can be reassigned?',
    options: ['const', 'let', 'static', 'define'],
    correctIndex: 1,
    explanation: 'let declares a block-scoped variable that can be reassigned.',
  },
  {
    id: 'git-1',
    category: 'Git',
    prompt: 'What does git pull normally do?',
    options: [
      'Deletes the local repository',
      'Fetches remote changes and integrates them into the current branch',
      'Creates a new GitHub account',
      'Only lists local commits',
    ],
    correctIndex: 1,
    explanation: 'git pull fetches remote updates and integrates them into the current branch.',
  },
  {
    id: 'testing-1',
    category: 'Testing',
    prompt: 'What is the main purpose of a unit test?',
    options: [
      'Test a small, isolated unit of code',
      'Measure internet speed',
      'Deploy an application',
      'Replace code review',
    ],
    correctIndex: 0,
    explanation: 'Unit tests check the behavior of small, isolated pieces of software.',
  },
  {
    id: 'debugging-1',
    category: 'Debugging',
    prompt: 'An API returns HTTP 500. What is a sensible first debugging step?',
    options: [
      'Assume the frontend is always responsible',
      'Inspect server logs and the failing request context',
      'Delete the database',
      'Disable all authentication',
    ],
    correctIndex: 1,
    explanation: 'Server logs and request context help identify the source of an internal server error.',
  },
];
