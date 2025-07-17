import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';

const ProblemPage = ({ problemId }) => {
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [verdict, setVerdict] = useState('');
  const [aiReview, setAiReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedTestCases, setFailedTestCases] = useState([]);

  const BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const SUBMIT_URL = import.meta.env.VITE_SUBMIT_URL;
  const RUN_URL = import.meta.env.VITE_COMPILER_URL;

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/problems/${problemId}`);
        setProblem(response.data);
        setCode(response.data.starterCode[language] || '');
      } catch (error) {
        console.error('Error fetching problem:', error);
      }
    };
    fetchProblem();
  }, [problemId, language]);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${RUN_URL}`, { code, language, input });
      setOutput(res.data.output || res.data.error || 'No output');
    } catch (err) {
      setOutput('Error running code');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setAiReview('');
    setVerdict('');
    setFailedTestCases([]);
    try {
      const res = await axios.post(`${SUBMIT_URL}`, {
        code,
        language,
        problemId
      });
      setVerdict(res.data.verdict);
      if (res.data.verdict === 'Wrong Answer') {
        setFailedTestCases(res.data.failedTestCases || []);
      }
      setAiReview(res.data.aiReview || '');
    } catch (err) {
      setVerdict('Error submitting code');
    }
    setLoading(false);
  };

  const highlight = (code) => Prism.highlight(code, Prism.languages[language], language);

  if (!problem) return <div className="text-center mt-10 text-lg">Loading problem...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-4">{problem.title}</h1>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Description:</h2>
        <p className="whitespace-pre-line">{problem.description}</p>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Constraints:</h2>
        <p className="whitespace-pre-line">{problem.constraints}</p>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Examples:</h2>
        {problem.examples.map((ex, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-800 p-2 rounded mb-2">
            <p><strong>Input:</strong> {ex.input}</p>
            <p><strong>Output:</strong> {ex.output}</p>
          </div>
        ))}
      </div>

      {/* Language Selector */}
      <div className="mb-4">
        <label className="font-semibold mr-2">Language:</label>
        <select
          className="bg-gray-100 dark:bg-gray-700 text-black dark:text-white p-1 rounded"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="cpp">C++</option>
          <option value="c">C</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
        </select>
      </div>

      {/* Code Editor */}
      <div className="mb-4">
        <Editor
          value={code}
          onValueChange={setCode}
          highlight={highlight}
          padding={10}
          className="border rounded bg-white dark:bg-gray-900 text-sm font-mono min-h-[300px] text-black dark:text-white"
        />
      </div>

      {/* Input Box */}
      <div className="mb-4">
        <h2 className="font-semibold">Custom Input:</h2>
        <textarea
          rows="4"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 rounded border bg-white dark:bg-gray-800 text-black dark:text-white"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={handleRun}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Run Code
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Submit
        </button>
      </div>

      {/* Output */}
      {output && (
        <div className="mb-4">
          <h2 className="font-semibold">Output:</h2>
          <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">{output}</pre>
        </div>
      )}

      {/* Verdict */}
      {verdict && (
        <div className={`mb-4 font-bold ${verdict === 'Accepted' ? 'text-green-600' : 'text-red-500'}`}>
          Verdict: {verdict}
        </div>
      )}

      {/* Failed Test Cases */}
      {verdict === 'Wrong Answer' && failedTestCases.length > 0 && (
        <div className="mb-4 bg-red-100 dark:bg-red-900 p-4 rounded-lg">
          <h3 className="text-lg font-bold mb-2 text-red-700 dark:text-red-200">❌ Failed Test Case(s):</h3>
          {failedTestCases.map((test, idx) => (
            <div key={idx} className="mb-2 border-b border-gray-300 dark:border-gray-700 pb-2">
              <p><strong>Input:</strong> <code>{test.input}</code></p>
              <p><strong>Expected:</strong> <code>{test.expectedOutput}</code></p>
              <p><strong>Your Output:</strong> <code>{test.userOutput}</code></p>
            </div>
          ))}
        </div>
      )}

      {/* AI Review */}
      {aiReview && (
        <div className="mb-4 bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg">
          <h3 className="text-lg font-bold mb-2 text-yellow-700 dark:text-yellow-200">🤖 AI Code Review:</h3>
          <p>{aiReview}</p>
        </div>
      )}
    </div>
  );
};

export default ProblemPage;
