import { useState, useEffect } from 'react';
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

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:2000";
const COMPILER_URL = import.meta.env.VITE_COMPILER_URL || "http://localhost:8000/run";
const SUBMIT_URL = import.meta.env.VITE_SUBMIT_URL || `${AUTH_URL}/api/submit`;
const AI_REVIEW_URL = import.meta.env.VITE_AI_REVIEW_URL || `${AUTH_URL}/api/ai-review`;

const defaultCodes = {
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World";\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello World");\n    return 0;\n}`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}`,
  py: `print("Hello World")\n`
};

const ProblemPage = () => {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(defaultCodes['cpp']);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [aiFeedback, setAIFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await axios.get(`${AUTH_URL}/api/problems/${id}`);
        setProblem(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProblem();
  }, [id]);

  const handleRun = async () => {
    setLoading(true);
    setOutput('');
    try {
      const res = await axios.post(COMPILER_URL, {
        code,
        language,
        input
      });
      setOutput(res.data.output);
    } catch (err) {
      setOutput('Error during execution.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setOutput('');
    try {
      const res = await axios.post(SUBMIT_URL, {
        problemId: id,
        code,
        language
      }, { withCredentials: true });

      setOutput(res.data.verdict || 'Submitted.');
      setAIFeedback(res.data.aiFeedback || '');
    } catch (err) {
      setOutput('Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(defaultCodes[lang]);
  };

  if (!problem) return <div className="text-center mt-10">Loading problem...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{problem.title}</h1>
      <div className="mb-6 prose max-w-none">
        <ReactMarkdown>{problem.description}</ReactMarkdown>
        <div><strong>Constraints:</strong></div>
        <pre className="bg-gray-800 text-white p-2 rounded">{problem.constraints}</pre>
        <div><strong>Examples:</strong></div>
        {problem.examples.map((ex, idx) => (
          <div key={idx} className="mb-2">
            <div><strong>Input:</strong> {ex.input}</div>
            <div><strong>Output:</strong> {ex.output}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <label className="font-semibold">Language:</label>
        <select value={language} onChange={handleLanguageChange} className="p-2 border rounded">
          <option value="cpp">C++</option>
          <option value="c">C</option>
          <option value="java">Java</option>
          <option value="py">Python</option>
        </select>
      </div>

      <div className="mb-4">
        <Editor
          value={code}
          onValueChange={setCode}
          highlight={code => highlight(code, languages[language] || languages.cpp)}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
            backgroundColor: "#2d2d2d",
            color: "white",
            borderRadius: "8px",
            minHeight: "250px"
          }}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Custom Input:</label>
        <textarea
          className="w-full p-2 border rounded bg-gray-100"
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={handleRun}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Running...' : 'Run Code'}
        </button>
        <button
          onClick={handleSubmit}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </div>

      {output && (
        <div className="mb-4">
          <label className="font-semibold">Output:</label>
          <pre className="bg-gray-800 text-white p-2 rounded mt-1">{output}</pre>
        </div>
      )}

      {aiFeedback && (
        <div className="mt-4 border-t pt-4">
          <h2 className="text-xl font-semibold mb-2">AI Review:</h2>
          <div className="prose max-w-none">
            <ReactMarkdown>{aiFeedback}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemPage;

