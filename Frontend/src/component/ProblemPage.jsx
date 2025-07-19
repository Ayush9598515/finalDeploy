import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { toast } from "react-hot-toast";

const ProblemPage = () => {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [verdict, setVerdict] = useState("");
  const [testcaseFeedback, setTestcaseFeedback] = useState("");
  const [aiFeedback, setAIFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_AUTH_URL}/api/problems/${id}`, {
          withCredentials: true, // ✅ include cookies
        });
        setProblem(res.data.problem);
        setCode(res.data.problem.starterCode[language] || "");
      } catch (err) {
        console.error("❌ Error fetching problem:", err);
        toast.error("Failed to load problem.");
      }
    };

    fetchProblem();
  }, [id, language]);

  const handleVerdictSubmit = async () => {
    if (!code.trim()) {
      toast.error("Write some code first!");
      return;
    }

    setIsLoading(true);
    setVerdict("⏳ Checking...");
    setTestcaseFeedback("");
    setAIFeedback("");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_SUBMIT_URL}`,
        {
          code,
          language,
          problemId: problem._id,
        },
        {
          withCredentials: true, // ✅ send token in cookie
        }
      );

      const { verdict, failedCase, aiFeedback } = res.data;

      if (verdict === "Accepted") {
        setTestcaseFeedback("🎉 All test cases passed!");
      } else if (verdict === "Wrong Answer" && failedCase) {
        setTestcaseFeedback(`❌ Test Failed

🔹 Input:
${failedCase.input}

🔹 Expected Output:
${failedCase.expectedOutput}

🔹 Your Output:
${failedCase.actualOutput}`);
      } else {
        setTestcaseFeedback("❌ Submission failed. Try again.");
      }

      if (aiFeedback) {
        setAIFeedback(aiFeedback);
      }

      setVerdict(verdict);
    } catch (err) {
      console.error("❌ Error submitting code:", err);
      toast.error("Error submitting code. Try again.");
      setVerdict("❌ Internal Error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!problem) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{problem.title}</h1>
      <p className="mb-2 whitespace-pre-line">{problem.description}</p>
      <p className="font-semibold mb-2">Constraints:</p>
      <ul className="list-disc list-inside mb-4">
        {problem.constraints.map((constraint, index) => (
          <li key={index}>{constraint}</li>
        ))}
      </ul>

      <div className="mb-4">
        <label className="font-semibold mr-2">Choose Language:</label>
        <select
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            setCode(problem.starterCode[e.target.value] || "");
          }}
          className="border px-2 py-1 rounded"
        >
          <option value="cpp">C++</option>
          <option value="c">C</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
        </select>
      </div>

      <Editor
        height="400px"
        defaultLanguage={language}
        language={language}
        value={code}
        onChange={(value) => setCode(value)}
        className="mb-4 border"
        theme="vs-dark"
      />

      <button
        onClick={handleVerdictSubmit}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        disabled={isLoading}
      >
        {isLoading ? "Submitting..." : "Submit"}
      </button>

      <div className="mt-4">
        {verdict && <p className="font-semibold">Verdict: {verdict}</p>}
        {testcaseFeedback && (
          <pre className="bg-gray-100 p-3 mt-2 whitespace-pre-wrap rounded">{testcaseFeedback}</pre>
        )}
        {aiFeedback && (
          <div className="mt-4">
            <p className="font-semibold">🤖 AI Feedback:</p>
            <pre className="bg-yellow-100 p-3 whitespace-pre-wrap rounded">{aiFeedback}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemPage;

