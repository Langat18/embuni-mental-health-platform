import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, AlertCircle, CheckCircle } from 'lucide-react';

const AssessmentPage = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [responses, setResponses] = useState({});
  const [notes, setNotes] = useState('');

  const sections = [
    {
      title: "Mental Health & Well-being",
      description: "Score each statement on a scale of 1 (Rarely/Not at all true) to 5 (Always/Completely true)",
      questions: [
        { id: 1, text: "I generally feel focused and can concentrate on my academic tasks." },
        { id: 2, text: "I get enough sleep and wake up feeling rested most days." },
        { id: 3, text: "I feel optimistic about the future and my ability to handle challenges." },
        { id: 4, text: "I can manage stress related to exams, deadlines, or workload effectively." },
        { id: 5, text: "I engage in activities I find stimulating or enjoyable (e.g., hobbies, learning new skills)." },
        { id: 6, text: "I can make decisions without feeling overwhelmed or paralyzed." }
      ]
    },
    {
      title: "Emotional Health",
      description: "Score each statement on a scale of 1 (Rarely/Not at all true) to 5 (Always/Completely true)",
      questions: [
        { id: 7, text: "I am usually in a stable mood and my emotions don't fluctuate wildly." },
        { id: 8, text: "I can identify and name how I am feeling (e.g., happy, anxious, frustrated)." },
        { id: 9, text: "I feel confident in myself and my abilities." },
        { id: 10, text: "I can calm myself down when feeling upset or anxious." },
        { id: 11, text: "I rarely feel an overwhelming sense of sadness, hopelessness, or emptiness." },
        { id: 12, text: "I can express my emotions appropriately and respectfully to others." }
      ]
    },
    {
      title: "Social Health",
      description: "Score each statement on a scale of 1 (Rarely/Not at all true) to 5 (Always/Completely true)",
      questions: [
        { id: 13, text: "I have at least one person I can trust and talk to openly about personal issues." },
        { id: 14, text: "I feel like I belong within my university or local community (e.g., clubs, groups)." },
        { id: 15, text: "I can maintain healthy boundaries in my relationships (saying 'no' when necessary)." },
        { id: 16, text: "I find it easy to connect with new people when I choose to." },
        { id: 17, text: "My current relationships (family, friends, partners) are generally supportive and positive." },
        { id: 18, text: "I participate in social activities (on or off campus) that I enjoy." }
      ]
    },
    {
      title: "Needs Awareness and Reflection",
      description: "Score each statement on a scale of 1 (Rarely/Not at all true) to 5 (Always/Completely true)",
      questions: [
        { id: 19, text: "I am aware of the university resources available for mental health support (e.g., counseling, student services)." },
        { id: 20, text: "I feel comfortable seeking help if I were struggling mentally or emotionally." }
      ]
    }
  ];

  const handleScoreChange = (questionId, score) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: score
    }));
  };

  const isAllSectionAnswered = () => {
    const currentQuestions = sections[currentSection].questions;
    return currentQuestions.every(q => responses[q.id] !== undefined);
  };

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = async () => {
    const formattedResponses = Object.keys(responses).map(id => ({
      id: parseInt(id),
      category: getSectionForQuestion(parseInt(id)),
      question: getQuestionText(parseInt(id)),
      score: responses[id]
    }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/assessments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          responses: formattedResponses,
          notes: notes
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
    }
  };

  const getSectionForQuestion = (id) => {
    if (id <= 6) return "Mental Health & Well-being";
    if (id <= 12) return "Emotional Health";
    if (id <= 18) return "Social Health";
    return "Needs Awareness and Reflection";
  };

  const getQuestionText = (id) => {
    for (const section of sections) {
      const question = section.questions.find(q => q.id === id);
      if (question) return question.text;
    }
    return "";
  };

  const getSeverityColor = (severity) => {
    if (severity?.includes("Excellent")) return "text-green-700 bg-green-50 border-green-200";
    if (severity?.includes("Good")) return "text-blue-700 bg-blue-50 border-blue-200";
    if (severity?.includes("Moderate")) return "text-yellow-700 bg-yellow-50 border-yellow-200";
    if (severity?.includes("Concerning")) return "text-orange-700 bg-orange-50 border-orange-200";
    if (severity?.includes("Critical")) return "text-red-700 bg-red-50 border-red-200";
    return "text-gray-700 bg-gray-50 border-gray-200";
  };

  if (submitted && result) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Complete</h2>
              <p className="text-gray-600">Your results have been recorded and sent to counselors</p>
            </div>

            <div className={`p-6 rounded-lg border-2 mb-6 ${getSeverityColor(result.severity_level)}`}>
              <h3 className="font-bold text-lg mb-2">Overall Result</h3>
              <p className="text-2xl font-bold mb-2">{result.total_score} / {result.max_score} ({result.percentage}%)</p>
              <p className="font-semibold">{result.severity_level}</p>
            </div>

            <div className="space-y-4 mb-6">
              <h3 className="font-bold text-lg">Score Breakdown:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Mental Health & Well-being</p>
                  <p className="text-xl font-bold text-blue-900">{result.breakdown.mental_health}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Emotional Health</p>
                  <p className="text-xl font-bold text-purple-900">{result.breakdown.emotional_health}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Social Health</p>
                  <p className="text-xl font-bold text-green-900">{result.breakdown.social_health}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Needs Awareness</p>
                  <p className="text-xl font-bold text-orange-900">{result.breakdown.needs_awareness}</p>
                </div>
              </div>
            </div>

            {(result.severity_level?.includes("Critical") || result.severity_level?.includes("Concerning")) && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-red-900 mb-2">Recommended Next Steps</h4>
                    <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                      <li>Consider scheduling a session with a counselor</li>
                      <li>Reach out to someone you trust</li>
                      <li>Explore campus mental health resources</li>
                      <li>If in crisis, contact emergency services immediately</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => navigate('/student/new-chat')}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Talk to a Counselor
              </button>
              <button
                onClick={() => navigate('/student/dashboard')}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const section = sections[currentSection];
  const progress = ((currentSection + 1) / sections.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/student/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Mental Health Self-Assessment</h2>
                <p className="text-gray-600">Section {currentSection + 1} of {sections.length}</p>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{section.title}</h3>
            <p className="text-sm text-gray-600 mb-6">{section.description}</p>

            <div className="space-y-6">
              {section.questions.map((question) => (
                <div key={question.id} className="border-b pb-6 last:border-b-0">
                  <p className="text-gray-900 mb-4 font-medium">{question.id}. {question.text}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => handleScoreChange(question.id, score)}
                        className={`flex-1 py-3 rounded-lg border-2 font-semibold transition ${
                          responses[question.id] === score
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Rarely/Not at all</span>
                    <span>Always/Completely</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {currentSection === sections.length - 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional thoughts or concerns you'd like to share..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          <div className="flex gap-4">
            {currentSection > 0 && (
              <button
                onClick={handlePrevious}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Previous
              </button>
            )}
            {currentSection < sections.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!isAllSectionAnswered()}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Section
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isAllSectionAnswered()}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Assessment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;
