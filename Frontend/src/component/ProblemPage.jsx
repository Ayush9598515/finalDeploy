// ProblemPage.jsx
import { useState, useEffect, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const defaultCodes = {
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World";\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello World");\n    return 0;\n}`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}`,
  py: `print("Hello World")`
};

const ProblemPage = () => {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('cpp');
  const [verdict, setVerdict] = useState('');
  const [testcaseFeedback, setTestcaseFeedback] = useState('');
  const [aiFeedback, setAIFeedback] = useState('');
  const outputRef = useRef(null);

  const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:2000";
  const COMPILER_URL = import.meta.env.VITE_COMPILER_URL || "http://localhost:8000/run";
  const SUBMIT_URL = import.meta.env.VITE_SUBMIT_URL || "http://localhost:2000/api/submit";

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const { data } = await axios.get(`${AUTH_URL}/api/problems/${id}`);
        setProblem(data);
        const starterCode = data?.starterCode?.[language] || defaultCodes[language];
        setCode(starterCode);
        setInput(data.defaultInput || '');
      } catch (err) {
        console.error("❌ Failed to fetch problem:", err);
      }
    };
    fetchProblem();
  }, [id]);

  useEffect(() => {
    if (!problem) return;
    const langCode = problem?.starterCode?.[language] || defaultCodes[language];
    setCode(langCode);
  }, [language, problem]);

  const handleRun = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setOutput('');
    setVerdict('');
    setTestcaseFeedback('');
    setAIFeedback('');

    try {
      const { data } = await axios.post(COMPILER_URL, {
        code,
        language,
        input,
        timeout: 2
      });
      setOutput(data.output || data.error || "No output.");
    } catch (err) {
      if (err.response) {
        setOutput(`Error: ${err.response.data.error || 'Server error occurred'}`);
      } else if (err.request) {
        setOutput('Error: Could not connect to server.');
      } else {
        setOutput(`Error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  };

  const handleVerdictSubmit = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setOutput('');
    setVerdict('');
    setTestcaseFeedback('');
    setAIFeedback('');

    try {
      const res = await axios.post(SUBMIT_URL, {
        code,
        language,
        problemId: id
      }, {
        withCredentials: true
      });

      const { verdict, error, expected, actual, aiReview } = res.data;

      setVerdict(verdict);
      if (verdict === 'Wrong Answer') {
        setTestcaseFeedback(`Expected: ${expected}\nYour Output: ${actual}`);
      } else if (verdict === 'Accepted') {
        setTestcaseFeedback("🎉 All test cases passed!");
        if (aiReview) setAIFeedback(aiReview);
      }
    } catch (err) {
      setVerdict("Submission Failed");
      setOutput("❌ Server error while submitting.");
    } finally {
      setIsLoading(false);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  };

  if (!problem) return <div className="p-4 text-center">⏳ Loading problem...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-screen font-sans bg-white text-gray-900 dark:bg-[#1e1e1e] dark:text-white transition-colors duration-300">
      <div className="p-6 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-4">{problem.title}</h1>
        <p className="mb-6 text-gray-700 dark:text-gray-300">{problem.description}</p>
        {problem.examples && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">Examples</h2>
            {problem.examples.map((ex, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 p-3 rounded mb-2">
                <p><strong>Input:</strong> {ex.input}</p>
                <p><strong>Output:</strong> {ex.output}</p>
              </div>
            ))}
          </>
        )}
        {problem.constraints && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mt-4 mb-2">Constraints</h2>
            <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
              {problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </>
        )}
      </div>

      <div className="p-6 space-y-3 overflow-y-auto">
        <div>
          <label className="block text-sm font-medium mb-1">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 p-2 rounded"
          >
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="java">Java</option>
            <option value="py">Python</option>
          </select>
        </div>

        <div className="border border-gray-300 dark:border-gray-700 rounded h-[400px] overflow-auto bg-white dark:bg-black">
          <Editor
            value={code}
            onValueChange={setCode}
            highlight={(code) => highlight(code, languages[language] || languages.clike)}
            padding={12}
            style={{
              fontFamily: 'Fira Code, monospace',
              fontSize: 14,
              minHeight: '100%',
              backgroundColor: 'transparent',
              color: 'inherit'
            }}
          />
        </div>

        <button
          onClick={handleRun}
          disabled={isLoading}
          className={`w-full py-2 font-bold text-white rounded ${isLoading ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}
        >
          ▶ {isLoading ? 'Running...' : 'Run Code'}
        </button>

        <button
          onClick={handleVerdictSubmit}
          disabled={isLoading}
          className={`w-full py-2 font-bold text-white rounded ${isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
        >
          ✅ {isLoading ? 'Submitting...' : 'Submit & Judge'}
        </button>

        {verdict && (
          <div className={`text-sm font-semibold mt-2 p-2 rounded ${
            verdict === 'Accepted' ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200' :
            verdict === 'Wrong Answer' ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200' :
            'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200'
          }`}>
            Verdict: {verdict}
            {testcaseFeedback && <div className="mt-1 text-xs whitespace-pre-line">{testcaseFeedback}</div>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Program Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 p-2 rounded resize-none"
            placeholder="Enter input (optional)"
          />
        </div>

        <div ref={outputRef}>
          <label className="block text-sm font-medium mb-1">Output</label>
          <div className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-green-400 p-3 rounded h-[120px] overflow-y-auto font-mono whitespace-pre-wrap">
            {output || 'Output will appear here...'}
          </div>
        </div>

        {aiFeedback && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded">
            <h3 className="text-lg font-bold mb-2 text-blue-800 dark:text-blue-200">AI Code Review</h3>
            <ReactMarkdown className="prose dark:prose-invert">{aiFeedback}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemPage;
