// 🧠 Updated ProblemPage.jsx to trigger Vercel redeploy (added dummy comment)

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/themes/prism.css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import ReactMarkdown from "react-markdown";

const languageToPrismMap = {
  cpp: "cpp",
  c: "c",
  java: "java",
  python: "python",
};

const starterCodeMap = {
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // your code here\n    return 0;\n}",
  c: "#include <stdio.h>\n\nint main() {\n    // your code here\n    return 0;\n}",
  java: "public class Main {\n    public static void main(String[] args) {\n        // your code here\n    }\n}",
  python: "# your code here",
};

const ProblemPage = () => {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState(starterCodeMap.cpp);
  const [language, setLanguage] = useState("cpp");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [verdict, setVerdict] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [yourOutput, setYourOutput] = useState("");
  const [aiFeedback, setAIFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const COMPILER_URL = import.meta.env.VITE_COMPILER_URL;
  const SUBMIT_URL = import.meta.env.VITE_SUBMIT_URL;

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await axios.get(`/api/problems/${id}`);
        setProblem(res.data);
        setCode(starterCodeMap[language]);
      } catch (err) {
        console.error("Error fetching problem:", err);
      }
    };
    fetchProblem();
  }, [id]);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(starterCodeMap[lang]);
  };

  const handleRun = async () => {
    setLoading(true);
    setVerdict("");
    setOutput("");
    try {
      const res = await axios.post(`${COMPILER_URL}`, {
        code,
        language,
        input,
        timeout: 2,
      });
      setOutput(res.data.output);
    } catch (err) {
      setOutput("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setVerdict("");
    setExpectedOutput("");
    setYourOutput("");
    setAIFeedback("");

    try {
      const res = await axios.post(`${SUBMIT_URL}`, {
        problemId: id,
        code,
        language,
      }, { withCredentials: true });

      const { verdict, failedTest, aiReview } = res.data;

      setVerdict(verdict);
      if (verdict === "Wrong Answer" && failedTest) {
        setExpectedOutput(failedTest.expectedOutput);
        setYourOutput(failedTest.actualOutput);
      }
      if (verdict === "Accepted" && aiReview) {
        setAIFeedback(aiReview);
      }

    } catch (err) {
      setVerdict("Error submitting: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!problem) return <div className="text-center mt-10 text-xl">Loading problem...</div>;

  return (
    <div className="p-4 max-w-7xl mx-auto text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-4">{problem.title}</h1>
      <p className="mb-4 text-gray-700 dark:text-gray-300">{problem.description}</p>

      <div className="mb-4">
        <label className="mr-2 font-semibold">Language:</label>
        <select
          className="p-2 rounded bg-gray-100 dark:bg-gray-800"
          value={language}
          onChange={handleLanguageChange}
        >
          <option value="cpp">C++</option>
          <option value="c">C</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
        </select>
      </div>

      <div className="mb-4 border dark:border-gray-600 rounded">
        <Editor
          value={code}
          onValueChange={setCode}
          highlight={code => Prism.highlight(code, Prism.languages[languageToPrismMap[language]], language)}
          padding={10}
          className="min-h-[300px] font-mono bg-white dark:bg-gray-900 text-sm rounded"
        />
      </div>

      <div className="mb-4">
        <label className="font-semibold">Custom Input:</label>
        <textarea
          rows="4"
          className="w-full p-2 mt-1 border rounded bg-gray-100 dark:bg-gray-800"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      <div className="space-x-4 mb-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          onClick={handleRun}
          disabled={loading}
        >
          Run Code
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          onClick={handleSubmit}
          disabled={loading}
        >
          Submit Code
        </button>
      </div>

      {output && (
        <div className="mb-4">
          <h2 className="font-semibold">Output:</h2>
          <pre className="p-2 bg-gray-100 dark:bg-gray-800 rounded whitespace-pre-wrap">{output}</pre>
        </div>
      )}

      {verdict && (
        <div className={`mb-4 p-3 rounded font-bold ${
          verdict === "Accepted"
            ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
            : verdict === "Wrong Answer"
            ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200"
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200"
        }`}>
          Verdict: {verdict}
        </div>
      )}

      {verdict === "Wrong Answer" && (
        <div className="mb-4">
          <h3 className="font-semibold text-red-600 dark:text-red-300">Expected Output:</h3>
          <pre className="p-2 bg-gray-100 dark:bg-gray-800 rounded whitespace-pre-wrap">{expectedOutput}</pre>

          <h3 className="font-semibold text-red-600 dark:text-red-300">Your Output:</h3>
          <pre className="p-2 bg-gray-100 dark:bg-gray-800 rounded whitespace-pre-wrap">{yourOutput}</pre>
        </div>
      )}

      {aiFeedback && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded">
          <h3 className="text-lg font-bold mb-2 text-blue-800 dark:text-blue-200">AI Code Review</h3>
          <ReactMarkdown className="prose dark:prose-invert">{aiFeedback}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default ProblemPage;

